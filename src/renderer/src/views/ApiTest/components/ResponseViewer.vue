<template>
  <div class="response-viewer">
    <div class="meta">
      <el-tag :type="response.ok ? 'success' : 'danger'">
        {{ response.status ? `HTTP ${response.status}` : 'ERROR' }}
      </el-tag>
      <span v-if="response.timeMs != null" class="meta-item">{{ response.timeMs }} ms</span>
      <span v-if="response.statusText" class="meta-item">{{ response.statusText }}</span>
      <span v-if="response.fileSize" class="meta-item">{{ response.fileSize }}</span>
    </div>

    <div v-if="response.isFile" class="download-action">
      <el-button type="success" :icon="Download" @click="handleDownload">
        下载流文件 ({{ response.fileName }})
      </el-button>
    </div>

    <el-tabs class="resp-tabs">
      <el-tab-pane label="Body">
        <el-input
          v-model="bodyText"
          type="textarea"
          :rows="14"
          readonly
          placeholder="这里将显示接口返回数据..."
          class="code-input"
        />
      </el-tab-pane>
      <el-tab-pane label="Headers">
        <el-input
          v-model="headersText"
          type="textarea"
          :rows="14"
          readonly
          placeholder="这里将显示响应头..."
          class="code-input"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Download } from '@element-plus/icons-vue'
import type { ResponseState } from '../composables/useApiTester'

const props = defineProps<{
  response: ResponseState
}>()

const handleDownload = () => {
  if (!props.response.fileUrl || !props.response.fileName) return
  const a = document.createElement('a')
  a.href = props.response.fileUrl
  a.download = props.response.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const bodyText = computed(() => {
  if (props.response.errorText) return props.response.errorText
  return props.response.dataText || ''
})

const headersText = computed(() => {
  if (!props.response.headers) return ''
  try {
    return JSON.stringify(props.response.headers, null, 2)
  } catch {
    return String(props.response.headers)
  }
})
</script>

<style scoped lang="scss">
.response-viewer {
  .meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    .meta-item {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }

  .download-action {
    margin-bottom: 12px;
  }

  .resp-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 10px;
    }
  }

  :deep(.el-textarea__inner) {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
