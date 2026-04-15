<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="header-left">
        <h2>AI 智能助手</h2>
        <span class="model-badge">{{ settings.aiModel }}</span>
      </div>
      <div class="header-right">
        <el-button type="primary" link @click="clearHistory">
          <el-icon><Delete /></el-icon> 清空对话
        </el-button>
        <el-button type="info" link @click="goToSettings">
          <el-icon><Setting /></el-icon> 配置
        </el-button>
      </div>
    </div>

    <div ref="messagesContainer" class="chat-messages">
      <div v-if="messages.length === 0" class="empty-state">
        <el-icon class="empty-icon"><ChatDotSquare /></el-icon>
        <p>你好！我是基于 {{ settings.aiModel }} 的智能助手，有什么我可以帮你的？</p>
        <div class="suggestion-chips">
          <el-tag @click="fillInput('帮我写一段 Python 快速排序代码')"
            >帮我写一段 Python 代码</el-tag
          >
          <el-tag @click="fillInput('如何用 Electron 读取本地文件？')">Electron 读取文件</el-tag>
          <el-tag @click="fillInput('给我讲一个有趣的科幻故事')">讲个科幻故事</el-tag>
        </div>
      </div>

      <div v-for="(msg, index) in messages" :key="index" class="message-wrapper" :class="msg.role">
        <div class="message-avatar">
          <el-avatar
            v-if="msg.role === 'user'"
            :src="userStore.avatar || defaultAvatar"
            size="small"
          />
          <el-avatar v-else src="https://api.dicebear.com/7.x/bottts/svg?seed=ai" size="small" />
        </div>
        <div class="message-content">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="text-content user-text">{{ msg.content }}</div>
          <!-- AI message (Markdown rendered) -->
          <div
            v-else
            class="text-content ai-text markdown-body"
            v-html="renderMarkdown(msg.content)"
          ></div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isGenerating" class="message-wrapper assistant">
        <div class="message-avatar">
          <el-avatar src="https://api.dicebear.com/7.x/bottts/svg?seed=ai" size="small" />
        </div>
        <div class="message-content">
          <div class="text-content ai-text loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        placeholder="输入您的问题，按 Enter 发送，Shift + Enter 换行"
        resize="none"
        @keydown="handleKeydown"
      />
      <div class="input-actions">
        <el-button
          type="primary"
          :disabled="!inputMessage.trim() || isGenerating"
          @click="sendMessage"
        >
          发送 <el-icon class="el-icon--right"><Position /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotSquare, Delete, Setting, Position } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/store/settings'
import { useUserStore } from '@/store/user'
import MarkdownIt from 'markdown-it'

const router = useRouter()
const settings = useSettingsStore()
const userStore = useUserStore()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
})

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const renderMarkdown = (text: string) => {
  return md.render(text || '')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const fillInput = (text: string) => {
  inputMessage.value = text
  sendMessage()
}

const goToSettings = () => {
  router.push('/settings')
}

const clearHistory = () => {
  messages.value = []
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || isGenerating.value) return

  if (!settings.aiApiKey) {
    ElMessage.warning('请先前往设置配置 AI API Key')
    return
  }

  // Add user message
  messages.value.push({ role: 'user', content })
  inputMessage.value = ''
  scrollToBottom()

  isGenerating.value = true

  // Create a placeholder for AI response
  const aiMessageIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '' })

  try {
    // 构造发给大模型的上下文
    const apiMessages = messages.value.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content
    }))

    // 调用 OpenAI 兼容格式的流式接口
    const response = await fetch(`${settings.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.aiApiKey}`
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: apiMessages,
        stream: true
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API 请求失败: ${response.status} ${errText}`)
    }

    if (!response.body) throw new Error('ReadableStream not supported in this browser.')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let done = false

    while (!done) {
      const { value, done: readerDone } = await reader.read()
      done = readerDone
      if (value) {
        const chunk = decoder.decode(value, { stream: true })
        // 解析 SSE (Server-Sent Events) 格式
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                messages.value[aiMessageIndex].content += data.choices[0].delta.content
                scrollToBottom()
              }
            } catch (e) {
              // ignore parse error on incomplete chunks
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Chat API Error:', error)
    messages.value[aiMessageIndex].content =
      `**请求失败**\n\n\`\`\`text\n${error.message}\n\`\`\`\n\n请检查网络或前往设置检查 API Key 是否正确。`
  } finally {
    isGenerating.value = false
    scrollToBottom()
  }
}
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px); /* 固定高度，100vh 减去顶部控制栏、Header和外层Padding */
  background-color: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-fill-color-light);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .model-badge {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border: 1px solid var(--el-color-primary-light-5);
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: var(--el-bg-color-page);

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: var(--el-text-color-secondary);

    .empty-icon {
      font-size: 64px;
      color: var(--el-color-primary-light-5);
      margin-bottom: 16px;
    }

    p {
      margin-bottom: 24px;
    }

    .suggestion-chips {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;

      .el-tag {
        cursor: pointer;
        padding: 8px 16px;
        height: auto;
        border-radius: 16px;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px var(--el-color-primary-light-7);
        }
      }
    }
  }
}

.message-wrapper {
  display: flex;
  gap: 12px;
  max-width: 85%;

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .text-content {
      background-color: var(--el-color-primary);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }
  }

  &.assistant {
    align-self: flex-start;

    .text-content {
      background-color: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      color: var(--el-text-color-primary);
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .text-content {
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.6;
      word-break: break-word;

      &.user-text {
        white-space: pre-wrap;
      }
    }
  }
}

.chat-input-area {
  padding: 16px 24px;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);

  :deep(.el-textarea__inner) {
    border-radius: 12px;
    padding: 12px 16px;
    background-color: var(--el-fill-color-light);
    border-color: transparent;
    transition: all 0.3s;

    &:focus {
      background-color: var(--el-bg-color);
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  .input-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;

    .el-button {
      border-radius: 8px;
      padding: 8px 24px;
    }
  }
}

/* Loading animation */
.loading-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 20px !important;

  span {
    animation: blink 1.4s infinite both;
    width: 6px;
    height: 6px;
    background-color: var(--el-text-color-secondary);
    border-radius: 50%;
    display: inline-block;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes blink {
  0% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  20% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
}

/* 简单的 Markdown 样式覆盖 */
:deep(.markdown-body) {
  p {
    margin-top: 0;
    margin-bottom: 12px;
  }
  p:last-child {
    margin-bottom: 0;
  }
  pre {
    background-color: var(--el-fill-color-darker);
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
  }
  code {
    background-color: var(--el-fill-color-darker);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
  pre code {
    background-color: transparent;
    padding: 0;
  }
}
</style>
