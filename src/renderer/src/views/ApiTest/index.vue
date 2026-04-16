<template>
  <div class="tool-container api-test-container">
    <div class="page-header header-with-actions">
      <h2>接口测试工具</h2>
      <el-button type="info" plain :icon="Clock" @click="showHistory = true"> 历史记录 </el-button>
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

    <!-- 历史记录抽屉 -->
    <el-drawer
      v-model="showHistory"
      title="请求历史记录"
      direction="rtl"
      size="360px"
      destroy-on-close
    >
      <div v-if="apiHistoryStore.historyList.length === 0" class="empty-history">
        <el-empty description="暂无历史记录" :image-size="80" />
      </div>
      <div v-else class="history-list">
        <div class="history-actions">
          <el-button type="danger" link @click="apiHistoryStore.clearHistory()">
            清空历史记录
          </el-button>
        </div>
        <div v-for="item in apiHistoryStore.historyList" :key="item.id" class="history-item">
          <div class="history-header">
            <el-tag size="small" :type="getMethodTagType(item.method)">{{ item.method }}</el-tag>
            <span class="history-time">{{ new Date(item.timestamp).toLocaleString() }}</span>
          </div>
          <div class="history-url" :title="item.url">{{ item.url }}</div>
          <div class="history-footer">
            <el-button size="small" type="primary" @click="handleRestore(item)">
              回填数据
            </el-button>
            <el-button
              size="small"
              type="danger"
              link
              @click="apiHistoryStore.removeHistory(item.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import KeyValueEditor from './components/KeyValueEditor.vue'
import BodyEditor from './components/BodyEditor.vue'
import ResponseViewer from './components/ResponseViewer.vue'
import { useApiTester } from './composables/useApiTester'
import { useApiHistoryStore } from '@/store/apiHistory'

const apiHistoryStore = useApiHistoryStore()
const showHistory = ref(false)

const {
  url,
  method,
  queryParams,
  headers,
  body,
  canEditBody,
  loading,
  response,
  send,
  loadFromHistory
} = useApiTester()

const getMethodTagType = (m: string) => {
  switch (m) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'warning'
    case 'PUT':
      return 'info'
    case 'DELETE':
      return 'danger'
    default:
      return 'primary'
  }
}

const handleRestore = (item: any) => {
  loadFromHistory(item)
  showHistory.value = false
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

  .header-with-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 16px 24px;

    .history-actions {
      display: flex;
      justify-content: flex-end;
    }

    .history-item {
      background-color: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 12px;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: var(--el-box-shadow-light);
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .history-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .history-url {
        font-size: 13px;
        color: var(--el-text-color-primary);
        word-break: break-all;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 12px;
      }

      .history-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }

  .empty-history {
    margin-top: 60px;
  }
}
</style>
