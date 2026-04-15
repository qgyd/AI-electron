<template>
  <div class="chat-header">
    <div class="header-left">
      <h2>AI 智能助手</h2>
      <el-select
        v-model="settings.aiModel"
        size="small"
        class="model-selector"
        filterable
        allow-create
        default-first-option
        placeholder="选择或输入模型"
      >
        <el-option-group label="硅基流动 (免费推荐)">
          <el-option label="Qwen 2.5 7B (阿里)" value="Qwen/Qwen2.5-7B-Instruct" />
          <el-option label="Qwen 2.7 Coder 7B (编程优化)" value="Qwen/Qwen2-7B-Instruct " />
          <el-option label="Llama 3.1 8B (Meta)" value="meta-llama/Meta-Llama-3.1-8B-Instruct" />
          <el-option label="GLM 4 9B (智谱)" value="THUDM/glm-4-9b-chat" />
          <el-option label="Hunyuan 7B (腾讯)" value="tencent/Hunyuan-MT-7B" />
          <el-option label="DeepSeek OCR (深度求索)" value="deepseek-ai/DeepSeek-OCR" />
          <el-option label="DeepSeek V2 (深度求索)" value="deepseek-ai/DeepSeek-V2-Chat" />
        </el-option-group>
        <el-option-group label="其他热门模型">
          <el-option label="DeepSeek Chat (需官方Key)" value="deepseek-chat" />
          <el-option label="GPT-4o mini (需OpenAI Key)" value="gpt-4o-mini" />
        </el-option-group>
      </el-select>
    </div>
    <div class="header-right">
      <el-button type="primary" link @click="emit('clear')">
        <el-icon><Delete /></el-icon> 清空对话
      </el-button>
      <el-button type="info" link @click="goToSettings">
        <el-icon><Setting /></el-icon> 配置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Delete, Setting } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/store/settings'

const emit = defineEmits(['clear'])
const router = useRouter()
const settings = useSettingsStore()

const goToSettings = () => {
  router.push('/settings')
}
</script>

<style scoped lang="scss">
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

    .model-selector {
      width: 220px;

      :deep(.el-input__wrapper) {
        border-radius: 12px;
        background-color: var(--el-color-primary-light-9);
        box-shadow: none;
        border: 1px solid var(--el-color-primary-light-5);
      }

      :deep(.el-input__inner) {
        color: var(--el-color-primary);
        font-size: 12px;
      }
    }
  }
}
</style>
