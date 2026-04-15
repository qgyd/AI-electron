<template>
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
        @click="handleSend"
      >
        发送 <el-icon class="el-icon--right"><Position /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Position } from '@element-plus/icons-vue'

const props = defineProps<{
  isGenerating: boolean
}>()

const emit = defineEmits(['send'])
const inputMessage = ref('')

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleSend = () => {
  if (!inputMessage.value.trim() || props.isGenerating) return
  emit('send', inputMessage.value.trim())
  inputMessage.value = ''
}

// 暴露给外部调用
defineExpose({
  fillAndSend: (text: string) => {
    inputMessage.value = text
    handleSend()
  }
})
</script>

<style scoped lang="scss">
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
</style>
