<template>
  <div class="api-test-container">
    <div class="page-header">
      <h2>接口测试工具</h2>
    </div>

    <div class="content-card">
      <el-form label-position="top" class="api-form">
        <el-form-item label="请求地址">
          <el-input v-model="url" placeholder="请输入 API URL" class="url-input">
            <template #prepend>
              <el-select v-model="method" style="width: 100px">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
              </el-select>
            </template>
            <template #append>
              <el-button type="primary" class="send-btn" @click="sendRequest">发送请求</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="响应结果" class="response-item">
          <div class="response-wrapper">
            <el-scrollbar max-height="400px">
              <el-input
                v-model="response"
                type="textarea"
                :rows="14"
                readonly
                placeholder="这里将显示接口返回数据..."
                class="code-input"
              />
            </el-scrollbar>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const url = ref('https://jsonplaceholder.typicode.com/todos/1')
const method = ref('GET')
const response = ref('')

const sendRequest = (): void => {
  response.value = '正在请求...\n'
  setTimeout(() => {
    response.value = JSON.stringify(
      {
        userId: 1,
        id: 1,
        title: 'delectus aut autem',
        completed: false
      },
      null,
      2
    )
  }, 800)
}
</script>

<style scoped lang="scss">
.api-test-container {
  max-width: 1000px;
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

  .api-form {
    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-regular);
      font-size: 14px;
      padding-bottom: 8px;
    }

    .url-input {
      :deep(.el-input-group__prepend) {
        background-color: var(--el-fill-color-light);
        border-color: var(--el-border-color);
      }
      :deep(.el-input-group__append) {
        background-color: var(--el-color-primary);
        border-color: var(--el-color-primary);
        color: white;

        &:hover {
          background-color: var(--el-color-primary-light-3);
          border-color: var(--el-color-primary-light-3);
        }
      }
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
        &:hover {
          box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
        }
        &.is-focus {
          box-shadow: 0 0 0 1px var(--el-color-primary) inset;
        }
      }
    }

    .response-item {
      margin-top: 24px;
      margin-bottom: 0;
    }

    .response-wrapper {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--el-border-color);
      background-color: var(--el-fill-color-light);

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
}
</style>
