<template>
  <div class="qq-chat-page">
    <div v-if="!isLoggedIn" class="login-overlay">
      <div class="login-panel">
        <div class="login-brand">
          <div class="brand-title">QQ Chat</div>
          <div class="brand-subtitle">实时聊天 · 私聊 · 记录持久化</div>
        </div>
        <el-card class="chat-login-card" shadow="never">
          <template #header>
            <div class="login-title">登录聊天服务器</div>
          </template>
          <el-form :model="loginForm" label-position="top">
            <el-form-item label="用户名">
              <el-input v-model="loginForm.username" placeholder="例如：test1" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="例如：123456"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button type="primary" class="w-full" size="large" @click="handleLogin">
              登录
            </el-button>
          </el-form>
        </el-card>
      </div>
    </div>

    <div v-else class="chat-shell">
      <div class="sidebar">
        <div class="my-card">
          <div class="my-left">
            <el-avatar :src="currentUser.avatar" :size="40" />
            <div class="my-meta">
              <div class="my-name">{{ currentUser.username }}</div>
              <div class="my-status">在线</div>
            </div>
          </div>
          <el-button size="small" plain @click="handleLogout">退出</el-button>
        </div>

        <div class="search-bar">
          <el-input v-model="friendKeyword" placeholder="搜索好友" clearable />
        </div>

        <el-scrollbar class="friend-scroll">
          <div class="friend-list">
            <div
              v-for="friend in filteredFriends"
              :key="friend.id"
              class="friend-item"
              :class="{ active: currentFriend?.id === friend.id }"
              @click="selectFriend(friend)"
            >
              <el-avatar :src="friend.avatar" :size="36" />
              <div class="friend-main">
                <div class="friend-top">
                  <div class="friend-name">{{ friend.username }}</div>
                </div>
                <div class="friend-sub">点击开始聊天</div>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <div class="content">
        <div v-if="currentFriend" class="chat-area">
          <div class="chat-header">
            <div class="header-left">
              <el-avatar :src="currentFriend.avatar" :size="34" />
              <div class="header-meta">
                <div class="header-title">{{ currentFriend.username }}</div>
                <div class="header-subtitle">私聊</div>
              </div>
            </div>
          </div>

          <el-scrollbar class="chat-scroll">
            <div ref="historyRef" class="chat-history">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="message-row"
                :class="{ mine: msg.sender_id === currentUser.id }"
              >
                <el-avatar
                  class="avatar"
                  :size="34"
                  :src="
                    msg.sender_id === currentUser.id ? currentUser.avatar : currentFriend.avatar
                  "
                />
                <div class="bubble-col">
                  <div class="bubble-meta">
                    <span class="time">{{ formatTime(msg.created_at) }}</span>
                  </div>
                  <div class="bubble">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>

          <div class="chat-input">
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="3"
              placeholder="输入消息，Enter 发送"
              @keyup.enter.prevent="sendMessage"
            />
            <div class="action-bar">
              <el-button type="primary" @click="sendMessage">发送</el-button>
            </div>
          </div>
        </div>

        <div v-else class="no-chat">
          <el-empty description="选择一个好友开始聊天" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'

const API_BASE = 'http://localhost:3003/api'
const SOCKET_URL = 'http://localhost:3003'

const isLoggedIn = ref(false)
const currentUser = ref<any>({})
const friends = ref<any[]>([])
const currentFriend = ref<any>(null)
const messages = ref<any[]>([])
const inputText = ref('')
const historyRef = ref<HTMLElement | null>(null)
const friendKeyword = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

let socket: Socket | null = null
const filteredFriends = computed(() => {
  const keyword = friendKeyword.value.trim().toLowerCase()
  if (!keyword) return friends.value
  return friends.value.filter((f) =>
    String(f.username || '')
      .toLowerCase()
      .includes(keyword)
  )
})

const formatTime = (value: any) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString()
}

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  try {
    const res = await axios.post(`${API_BASE}/login`, loginForm)
    if (res.data.success) {
      currentUser.value = res.data.user
      isLoggedIn.value = true
      ElMessage.success('登录聊天服务器成功')
      initSocket()
      fetchFriends()
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '登录失败')
  }
}

const handleLogout = () => {
  isLoggedIn.value = false
  currentUser.value = {}
  friends.value = []
  currentFriend.value = null
  messages.value = []
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

const initSocket = () => {
  socket = io(SOCKET_URL)
  socket.on('connect', () => {
    console.log('Socket connected')
    socket?.emit('user_login', currentUser.value.id)
  })

  socket.on('receive_private_message', (msg) => {
    // 只有当消息属于当前聊天窗口时，或者是我发出去的，才推入列表
    if (
      (currentFriend.value &&
        msg.sender_id === currentFriend.value.id &&
        msg.receiver_id === currentUser.value.id) ||
      (msg.sender_id === currentUser.value.id &&
        currentFriend.value &&
        msg.receiver_id === currentFriend.value.id)
    ) {
      messages.value.push(msg)
      scrollToBottom()
    } else {
      // 不是当前窗口的消息，可以给个通知
      if (msg.sender_id !== currentUser.value.id) {
        ElMessage.info(`收到新消息`)
      }
    }
  })
}

const fetchFriends = async () => {
  try {
    const res = await axios.get(`${API_BASE}/friends/${currentUser.value.id}`)
    if (res.data.success) {
      friends.value = res.data.friends
    }
  } catch (err) {
    console.error('获取好友失败', err)
  }
}

const selectFriend = async (friend: any) => {
  currentFriend.value = friend
  try {
    const res = await axios.get(`${API_BASE}/messages/${currentUser.value.id}/${friend.id}`)
    if (res.data.success) {
      messages.value = res.data.messages
      scrollToBottom()
    }
  } catch (err) {
    console.error('获取消息失败', err)
  }
}

const sendMessage = () => {
  if (!inputText.value.trim() || !currentFriend.value || !socket) return
  const msgData = {
    senderId: currentUser.value.id,
    receiverId: currentFriend.value.id,
    content: inputText.value.trim()
  }
  socket.emit('private_message', msgData)
  inputText.value = ''
}

const scrollToBottom = () => {
  nextTick(() => {
    if (historyRef.value) {
      historyRef.value.scrollTop = historyRef.value.scrollHeight
    }
  })
}

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<style scoped lang="scss">
.qq-chat-page {
  height: 100%;
  min-height: 0;
  background:
    radial-gradient(1200px 700px at 10% 0%, rgba(76, 134, 255, 0.18), transparent 60%),
    radial-gradient(900px 600px at 90% 20%, rgba(86, 212, 160, 0.16), transparent 55%), #f6f7fb;
  padding: 16px;
  box-sizing: border-box;

  .login-overlay {
    height: 100%;
    display: grid;
    place-items: center;
    padding: 24px;

    .login-panel {
      width: min(920px, 100%);
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 16px;
      align-items: stretch;

      .login-brand {
        border-radius: 16px;
        padding: 28px;
        background: linear-gradient(135deg, rgba(76, 134, 255, 0.92), rgba(124, 92, 255, 0.88));
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .brand-title {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: 0.5px;
          line-height: 1.2;
        }

        .brand-subtitle {
          margin-top: 10px;
          opacity: 0.92;
          font-size: 14px;
          line-height: 1.6;
        }
      }

      .chat-login-card {
        border-radius: 16px;
        border: 1px solid rgba(17, 24, 39, 0.08);
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .login-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
      }

      .w-full {
        width: 100%;
      }
    }

    @media (max-width: 860px) {
      .login-panel {
        grid-template-columns: 1fr;
      }
      .login-brand {
        padding: 22px;
      }
    }
  }

  .chat-shell {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 16px;

    .sidebar {
      min-height: 0;
      border-radius: 16px;
      border: 1px solid rgba(17, 24, 39, 0.08);
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(8px);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .my-card {
        padding: 14px 14px 12px;
        border-bottom: 1px solid rgba(17, 24, 39, 0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;

        .my-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .my-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .my-name {
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .my-status {
          margin-top: 2px;
          font-size: 12px;
          color: #10b981;
        }
      }

      .search-bar {
        padding: 12px 14px;
        border-bottom: 1px solid rgba(17, 24, 39, 0.06);
      }

      .friend-scroll {
        min-height: 0;
        flex: 1;
      }

      .friend-list {
        .friend-item {
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.18s ease;

          &:hover {
            background: rgba(76, 134, 255, 0.08);
          }

          &.active {
            background: rgba(76, 134, 255, 0.12);
          }

          .friend-main {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .friend-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }

          .friend-name {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .friend-sub {
            font-size: 12px;
            color: rgba(17, 24, 39, 0.56);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .content {
      min-height: 0;
      border-radius: 16px;
      border: 1px solid rgba(17, 24, 39, 0.08);
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(8px);
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .chat-area {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;

        .chat-header {
          height: 64px;
          border-bottom: 1px solid rgba(17, 24, 39, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;

          .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .header-meta {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .header-title {
            font-weight: 800;
            font-size: 16px;
            color: #111827;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .header-subtitle {
            font-size: 12px;
            color: rgba(17, 24, 39, 0.56);
          }
        }

        .chat-scroll {
          min-height: 0;
          flex: 1;
          background: linear-gradient(180deg, rgba(245, 247, 255, 0.8), rgba(249, 250, 251, 0.7));
        }

        .chat-history {
          padding: 18px 18px 10px;
          display: flex;
          flex-direction: column;
          gap: 14px;

          .message-row {
            display: flex;
            gap: 10px;
            align-items: flex-end;
            max-width: 92%;

            .avatar {
              flex: 0 0 auto;
            }

            .bubble-col {
              display: flex;
              flex-direction: column;
              gap: 6px;
              min-width: 0;
            }

            .bubble-meta {
              font-size: 12px;
              color: rgba(17, 24, 39, 0.45);
            }

            .bubble {
              display: inline-flex;
              align-self: flex-start;
              max-width: 520px;
              padding: 10px 12px;
              border-radius: 12px;
              background: #fff;
              border: 1px solid rgba(17, 24, 39, 0.08);
              font-size: 14px;
              line-height: 1.55;
              color: #111827;
              word-break: break-word;
              white-space: pre-wrap;
            }

            &.mine {
              margin-left: auto;
              flex-direction: row-reverse;

              .bubble-meta {
                text-align: right;
              }

              .bubble {
                background: linear-gradient(
                  135deg,
                  rgba(76, 134, 255, 0.16),
                  rgba(76, 134, 255, 0.08)
                );
                border-color: rgba(76, 134, 255, 0.18);
              }
            }
          }
        }

        .chat-input {
          border-top: 1px solid rgba(17, 24, 39, 0.06);
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.95);

          :deep(.el-textarea__inner) {
            border-radius: 12px;
            border: 1px solid rgba(17, 24, 39, 0.12);
            resize: none;
            padding: 10px 12px;
            font-size: 14px;
            line-height: 1.5;
            &:focus {
              box-shadow: none;
              border-color: rgba(76, 134, 255, 0.6);
            }
          }

          .action-bar {
            display: flex;
            justify-content: flex-end;
            padding-top: 10px;
          }
        }
      }

      .no-chat {
        flex: 1;
        display: flex;
        width: 100%;
        justify-content: center;
        align-items: center;
      }
    }
  }
}
</style>
