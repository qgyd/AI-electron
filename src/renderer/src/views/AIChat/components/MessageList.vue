<template>
  <div ref="containerRef" class="chat-messages">
    <div v-if="messages.length === 0" class="empty-state">
      <el-icon class="empty-icon"><ChatDotSquare /></el-icon>
      <p>你好！我是基于 {{ settings.aiModel }} 的智能助手，有什么我可以帮你的？</p>
      <div class="suggestion-chips">
        <el-tag @click="emit('suggest', '帮我写一段 Python 快速排序代码')"
          >帮我写一段 Python 代码</el-tag
        >
        <el-tag @click="emit('suggest', '如何用 Electron 读取本地文件？')"
          >Electron 读取文件</el-tag
        >
        <el-tag @click="emit('suggest', '给我讲一个有趣的科幻故事')">讲个科幻故事</el-tag>
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotSquare } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/store/settings'
import { useUserStore } from '@/store/user'
import MarkdownIt from 'markdown-it'
import type { Message } from '../composables/useAIChat'

const props = defineProps<{
  messages: Message[]
  isGenerating: boolean
}>()

const emit = defineEmits(['suggest'])

const settings = useSettingsStore()
const userStore = useUserStore()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const containerRef = ref<HTMLElement | null>(null)

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
})

const renderMarkdown = (text: string) => {
  return md.render(text || '')
}

// 暴露给外部调用
defineExpose({
  containerRef
})
</script>

<style scoped lang="scss">
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
