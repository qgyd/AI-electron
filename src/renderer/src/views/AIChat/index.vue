<template>
  <div class="chat-container">
    <ChatHeader @clear="clearHistory" />

    <MessageList
      ref="messageListRef"
      :messages="messages"
      :is-generating="isGenerating"
      @suggest="handleSuggest"
    />

    <ChatInput ref="chatInputRef" :is-generating="isGenerating" @send="sendMessage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChatHeader from './components/ChatHeader.vue'
import MessageList from './components/MessageList.vue'
import ChatInput from './components/ChatInput.vue'
import { useAIChat } from './composables/useAIChat'

const { messages, isGenerating, messagesContainer, clearHistory, sendMessage } = useAIChat()

const messageListRef = ref<InstanceType<typeof MessageList> | null>(null)
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null)

// Bind the container ref for scrolling
onMounted(() => {
  if (messageListRef.value) {
    messagesContainer.value = messageListRef.value.containerRef
  }
})

const handleSuggest = (text: string) => {
  if (chatInputRef.value) {
    chatInputRef.value.fillAndSend(text)
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
</style>
