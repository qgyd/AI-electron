<template>
  <div class="format-convert-container">
    <div class="page-header">
      <h2>格式转换工具</h2>
    </div>

    <div class="content-card">
      <el-row :gutter="24">
        <el-col :span="11">
          <div class="editor-header">
            <span class="label">输入 JSON</span>
          </div>
          <div class="editor-wrapper">
            <el-scrollbar max-height="500px">
              <el-input
                v-model="inputJson"
                type="textarea"
                :rows="20"
                placeholder="请粘贴要转换的 JSON 字符串..."
                class="code-input"
              />
            </el-scrollbar>
          </div>
        </el-col>

        <el-col :span="2" class="action-col">
          <el-button type="primary" class="convert-btn" @click="formatJson">
            <el-icon class="arrow-icon"><Right /></el-icon>
          </el-button>
        </el-col>

        <el-col :span="11">
          <div class="editor-header">
            <span class="label">格式化结果</span>
          </div>
          <div class="editor-wrapper">
            <el-scrollbar max-height="500px">
              <el-input
                v-model="outputResult"
                type="textarea"
                :rows="20"
                readonly
                placeholder="结果将显示在这里..."
                class="code-input"
              />
            </el-scrollbar>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const inputJson = ref('{"name":"test","age":18}')
const outputResult = ref('')

const formatJson = (): void => {
  try {
    const obj = JSON.parse(inputJson.value)
    outputResult.value = JSON.stringify(obj, null, 2)
    ElMessage.success('格式化成功')
  } catch (e) {
    ElMessage.error('JSON 格式错误，请检查输入')
    outputResult.value = ''
  }
}
</script>

<style scoped lang="scss">
.format-convert-container {
  max-width: 1400px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .content-card {
    background: var(--el-bg-color);
    border-radius: 12px;
    padding: 32px;
    box-shadow: var(--el-box-shadow-light);
  }

  .editor-header {
    margin-bottom: 12px;

    .label {
      font-weight: 500;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .editor-wrapper {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    background-color: var(--el-fill-color-light);
    transition: all 0.3s;

    &:focus-within {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    .code-input {
      :deep(.el-textarea__inner) {
        background-color: transparent;
        border: none;
        box-shadow: none;
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: var(--el-text-color-primary);
        padding: 16px;
        resize: none; // 禁用原生拖拽缩放

        // 隐藏 textarea 的原生滚动条
        &::-webkit-scrollbar {
          display: none;
        }
        scrollbar-width: none;

        &:hover,
        &:focus {
          box-shadow: none;
        }
      }
    }
  }

  .action-col {
    display: flex;
    justify-content: center;
    align-items: center;

    .convert-btn {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background-color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px var(--el-color-primary-light-5);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--el-color-primary-light-3);
      }

      &:active {
        transform: translateY(0);
      }

      .arrow-icon {
        font-size: 24px;
        font-weight: bold;
      }
    }
  }
}
</style>
