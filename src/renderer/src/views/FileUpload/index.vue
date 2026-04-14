<template>
  <div class="tool-container">
    <div class="page-header">
      <h2>云端文件上传</h2>
      <p class="subtitle">基于七牛云的本地极速上传工具，支持断线重连与大文件分片</p>
    </div>

    <div class="content-card">
      <!-- 上传区域 -->
      <el-upload
        class="single-uploader"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        @change="handleFileChange"
      >
        <div v-if="sourceFile" class="preview-wrapper file-preview">
          <el-icon class="preview-icon"><Document /></el-icon>
          <div class="file-mask">
            <el-icon><Switch /></el-icon>
            <span>点击或拖拽更换文件</span>
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">将文件拖到此处，或 <em>点击选择</em></div>
          <div class="upload-tip">单文件超过4MB将自动采用分片断点续传</div>
        </div>
      </el-upload>

      <!-- 转换设置 (选中文件后显示) -->
      <div v-if="sourceFile" class="settings-panel">
        <div class="file-info">
          <div class="info-left">
            <span class="file-name">{{ sourceFile.name }}</span>
            <span class="file-size">{{ formatSize(sourceFile.size) }}</span>
          </div>
          <div class="info-right">
            <span v-if="sourceFile.size > 4 * 1024 * 1024" class="file-tag warning"
              >大文件模式</span
            >
            <span v-else class="file-tag primary">极速直传</span>
          </div>
        </div>

        <el-form label-position="top" class="settings-form" :disabled="isUploading" @submit.prevent>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="存储空间 (Bucket Type)">
                <el-select v-model="bucketType" style="width: 100%">
                  <el-option label="公共空间 (Type: 1)" :value="1" />
                  <el-option label="私有空间 (Type: 2)" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文件标识 (File Type)">
                <el-input v-model="fileType" placeholder="如: png, mp4, doc" />
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="isUploading || progress > 0" class="progress-section">
            <div class="progress-header">
              <span>上传进度</span>
              <span>{{ Math.floor(progress) }}%</span>
            </div>
            <el-progress
              :percentage="Math.floor(progress)"
              :show-text="false"
              :status="progress === 100 ? 'success' : ''"
            />
          </div>

          <div class="action-bar">
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="isUploading"
              @click.stop="handleUpload"
            >
              <el-icon><Upload /></el-icon>
              开始上传
            </el-button>
          </div>
        </el-form>

        <!-- 结果展示区 -->
        <div v-if="uploadResult" class="result-section">
          <div class="result-title">上传成功</div>
          <el-input v-model="uploadResult" readonly type="textarea" :rows="3" resize="none" />
          <el-button class="copy-btn" type="primary" link @click="copyUrl"> 复制链接 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Document, Switch, Upload } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { useFormat } from '@/hooks/useFormat'

const { formatSize } = useFormat()

const sourceFile = ref<any>(null)
const sourceFilePath = ref<string>('')
const bucketType = ref<number>(1)
const fileType = ref<string>('png')

const isUploading = ref<boolean>(false)
const progress = ref<number>(0)
const uploadResult = ref<string>('')

onMounted(() => {
  if (window.api && window.api.file) {
    window.api.file.onUploadProgress((prog) => {
      progress.value = prog.percent
    })
  }
})

const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    sourceFile.value = uploadFile.raw
    progress.value = 0
    uploadResult.value = ''

    // 自动推断文件后缀
    const name = uploadFile.raw.name
    const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : ''
    if (ext) fileType.value = ext

    if (window.api && window.api.media) {
      sourceFilePath.value = window.api.media.getFilePath(uploadFile.raw)
    } else {
      sourceFilePath.value = (uploadFile.raw as any).path || ''
    }
  }
}

const handleUpload = async () => {
  if (!sourceFile.value || !sourceFilePath.value) {
    ElMessage.warning('请先选择有效的文件')
    return
  }

  isUploading.value = true
  progress.value = 0
  uploadResult.value = ''

  try {
    const res = await window.api.file.upload({
      filePath: sourceFilePath.value,
      bucketType: bucketType.value,
      fileType: fileType.value
    })

    if (res.success && res.data) {
      progress.value = 100
      uploadResult.value = res.data.url || JSON.stringify(res.data)
      ElMessage.success('文件上传成功！')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error(error.message || '上传过程中发生错误')
    progress.value = 0
  } finally {
    isUploading.value = false
  }
}

const copyUrl = () => {
  if (!uploadResult.value) return
  navigator.clipboard
    .writeText(uploadResult.value)
    .then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}
</script>

<style scoped lang="scss">
@use '@/assets/tool-layout.scss';

.preview-wrapper.file-preview {
  .preview-icon {
    font-size: 64px;
    color: var(--el-color-primary);
    opacity: 0.8;
  }
}

.file-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;

  &.warning {
    color: var(--el-color-warning);
    background-color: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-5);
  }

  &.primary {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-5);
  }
}

.result-section {
  margin-top: 24px;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px dashed var(--el-border-color);
  position: relative;
  animation: fadeIn 0.3s ease;

  .result-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-color-success);
    margin-bottom: 8px;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--el-color-success);
      margin-right: 8px;
    }
  }

  .copy-btn {
    position: absolute;
    bottom: 24px;
    right: 24px;
  }
}
</style>
