<template>
  <div class="tool-container api-test-container">
    <div class="page-header">
      <h2>接口测试工具</h2>
    </div>

    <div class="content-card">
      <el-form label-position="top" class="api-form">
        <el-form-item label="请求地址">
          <el-input v-model="url" placeholder="请输入 API URL" class="url-input">
            <template #prepend>
              <el-select v-model="method" style="width: 110px">
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
                <el-option label="PUT" value="PUT" />
                <el-option label="DELETE" value="DELETE" />
                <el-option label="PATCH" value="PATCH" />
              </el-select>
            </template>
            <template #append>
              <el-button type="primary" class="send-btn" :loading="loading" @click="send">
                发送请求
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="请求参数" class="params-item">
          <el-tabs class="params-tabs">
            <el-tab-pane label="Query Params">
              <KeyValueEditor v-model="queryParams" />
            </el-tab-pane>
            <el-tab-pane label="Headers">
              <KeyValueEditor v-model="headers" />
            </el-tab-pane>
            <el-tab-pane label="Body" :disabled="!canEditBody">
              <BodyEditor v-model="body" :disabled="!canEditBody" />
              <div v-if="!canEditBody" class="body-tip">GET / DELETE 请求默认不携带 Body</div>
            </el-tab-pane>
          </el-tabs>
        </el-form-item>

        <el-form-item label="响应结果" class="response-item">
          <div class="response-wrapper">
            <el-scrollbar max-height="420px">
              <ResponseViewer :response="response" />
            </el-scrollbar>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import KeyValueEditor from './components/KeyValueEditor.vue'
import BodyEditor from './components/BodyEditor.vue'
import ResponseViewer from './components/ResponseViewer.vue'
import { useApiTester } from './composables/useApiTester'

const { url, method, queryParams, headers, body, canEditBody, loading, response, send } =
  useApiTester()
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

    .params-item {
      margin-top: 18px;
    }

    .params-tabs {
      width: 100%;
    }

    .body-tip {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .response-wrapper {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--el-border-color);
      background-color: var(--el-fill-color-light);

      padding: 16px;
    }
  }
}
</style>
