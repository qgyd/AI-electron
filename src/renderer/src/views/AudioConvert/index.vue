<template>
  <div class="tool-container">
    <div class="page-header">
      <h2>音频转换裁剪</h2>
      <p class="subtitle">支持 MP3, WAV, AAC, FLAC, OGG, M4A 格式及精确裁剪</p>
    </div>

    <div class="content-card">
      <!-- 预览与重新上传区域 -->
      <div v-if="sourceFile" class="media-player-section">
        <div class="player-wrapper">
          <audio :src="previewUrl" controls class="native-audio-player"></audio>
        </div>
        <div class="reselect-action">
          <el-button plain size="small" @click="clearFile">
            <el-icon><Switch /></el-icon> 更换文件
          </el-button>
        </div>
      </div>

      <!-- 上传区域 -->
      <el-upload
        v-show="!sourceFile"
        ref="uploadRef"
        class="single-uploader"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        accept="audio/*,video/*"
        @change="handleFileChange"
      >
        <div class="upload-placeholder">
          <el-icon class="upload-icon"><Microphone /></el-icon>
          <div class="upload-text">将音频/视频文件拖到此处，或 <em>点击选择</em></div>
          <div class="upload-tip">支持从视频中提取音频</div>
        </div>
      </el-upload>

      <!-- 转换设置 (选中文件后显示) -->
      <div v-if="sourceFile" class="settings-panel">
        <div class="file-info">
          <div class="info-left">
            <span class="file-name">{{ sourceFile.name }}</span>
            <span class="file-size">{{ formatSize(sourceFile.size) }}</span>
          </div>
          <div v-if="mediaInfo" class="info-right">
            <span class="file-duration">{{ formatDuration(mediaInfo.format.duration) }}</span>
          </div>
        </div>

        <el-form
          label-position="top"
          class="settings-form"
          :disabled="isConverting"
          @submit.prevent
        >
          <el-form-item label="目标格式">
            <el-select v-model="targetFormat" style="width: 100%">
              <el-option label="MP3 (.mp3)" value="mp3" />
              <el-option label="WAV (.wav)" value="wav" />
              <el-option label="AAC (.aac)" value="aac" />
              <el-option label="FLAC (.flac)" value="flac" />
              <el-option label="OGG (.ogg)" value="ogg" />
              <el-option label="M4A (.m4a)" value="m4a" />
            </el-select>
          </el-form-item>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="开始时间 (如: 00:00:10 或 10)">
                <el-input v-model="startTime" placeholder="不填则从头开始" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="裁剪时长 (秒)">
                <el-input v-model="duration" placeholder="不填则直到结尾" type="number" />
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="isConverting || progress > 0" class="progress-section">
            <div class="progress-header">
              <span>处理进度</span>
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
              :loading="isConverting"
              @click.stop="handleConvert"
            >
              <el-icon><RefreshRight /></el-icon>
              开始转换
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, Switch, RefreshRight } from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import { useSettingsStore } from '@/store/settings'

const settingsStore = useSettingsStore()
const uploadRef = ref<UploadInstance>()
const sourceFile = ref<any>(null)
const sourceFilePath = ref<string>('')
const previewUrl = ref<string>('')
const mediaInfo = ref<any>(null)
const targetFormat = ref<string>('mp3')
const startTime = ref<string>('')
const duration = ref<string>('')

const isConverting = ref<boolean>(false)
const progress = ref<number>(0)

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '未知'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}时${m}分${s}秒`
  return `${m}分${s}秒`
}

onMounted(() => {
  if (window.api && window.api.media) {
    window.api.media.onProgress((prog: any) => {
      if (prog && prog.percent) {
        progress.value = Math.min(100, Math.max(0, prog.percent))
      }
    })
  }
})

const clearFile = () => {
  sourceFile.value = null
  sourceFilePath.value = ''
  mediaInfo.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  progress.value = 0
  startTime.value = ''
  duration.value = ''
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

const handleFileChange = async (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    sourceFile.value = uploadFile.raw
    previewUrl.value = URL.createObjectURL(uploadFile.raw)
    mediaInfo.value = null
    progress.value = 0
    startTime.value = ''
    duration.value = ''

    if (window.api && window.api.media) {
      sourceFilePath.value = window.api.media.getFilePath(uploadFile.raw)
    } else {
      sourceFilePath.value = (uploadFile.raw as any).path || ''
    }

    if (sourceFilePath.value && window.api && window.api.media) {
      try {
        mediaInfo.value = await window.api.media.getInfo(sourceFilePath.value)
      } catch (err) {
        console.error('获取媒体信息失败:', err)
      }
    }
  }
}

const handleConvert = async (e: Event) => {
  e.preventDefault()
  e.stopPropagation()

  if (!sourceFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  const inputPath = sourceFilePath.value
  if (!inputPath) {
    ElMessage.error('无法获取文件的本地路径')
    return
  }

  isConverting.value = true
  progress.value = 0

  try {
    const isWindows = navigator.userAgent.toLowerCase().includes('windows')
    const sep = isWindows ? '\\' : '/'
    const name =
      sourceFile.value.name.substring(0, sourceFile.value.name.lastIndexOf('.')) || 'audio'

    const timestamp = new Date().getTime()
    const newFileName = `${name}_converted_${timestamp}.${targetFormat.value}`

    let outputPath = ''
    if (settingsStore.outputDir) {
      outputPath = await window.api.file.joinPath(settingsStore.outputDir, newFileName)
    } else {
      outputPath = await window.api.file.showSaveDialog({
        defaultPath: newFileName,
        filters: [{ name: 'Audio', extensions: [targetFormat.value] }]
      })
      if (!outputPath) {
        isConverting.value = false
        return
      }
    }

    const result = await window.api.media.convert({
      inputPath,
      outputPath,
      format: targetFormat.value,
      startTime: startTime.value,
      duration: duration.value
    })

    if (result && result.success) {
      progress.value = 100
      ElMessage.success(`转换成功！文件已保存至：${outputPath}`)
    }
  } catch (error: any) {
    console.error(error)
    ElMessage.error('转换失败: ' + error.message)
    progress.value = 0
  } finally {
    isConverting.value = false
  }
}
</script>

<style scoped lang="scss">
.tool-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 20px 0;

  .page-header {
    margin-bottom: 24px;
    text-align: center;

    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .content-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--el-border-color-light);
  }

  .single-uploader {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 220px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--el-border-color);
      border-radius: 12px;
      background-color: var(--el-fill-color-blank);
      transition: all 0.3s;
      overflow: hidden;
      padding: 0;

      &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);

        .file-mask {
          opacity: 1;
        }
      }
    }
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;

    .upload-icon {
      font-size: 48px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 16px;
      transition: transform 0.3s;
    }

    .upload-text {
      font-size: 14px;
      color: var(--el-text-color-regular);
      em {
        color: var(--el-color-primary);
        font-style: normal;
      }
    }

    .upload-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
    }
  }

  .single-uploader:hover .upload-icon {
    transform: translateY(-5px);
    color: var(--el-color-primary);
  }

  .media-player-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--el-fill-color-light);
    border-radius: 12px;
    padding: 32px 20px 20px;
    border: 1px solid var(--el-border-color-light);
    animation: fadeIn 0.3s ease;

    .player-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 20px;

      .native-audio-player {
        width: 100%;
        max-width: 400px;
        height: 40px;
        outline: none;
      }
    }

    .reselect-action {
      display: flex;
      justify-content: center;
    }
  }

  .preview-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);

    &.media-preview {
      .preview-icon {
        font-size: 64px;
        color: var(--el-color-primary);
        opacity: 0.8;
      }
    }

    .file-mask {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      .el-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
    }
  }

  .settings-panel {
    margin-top: 24px;
    animation: fadeIn 0.4s ease-out;

    .file-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--el-fill-color-light);
      border-radius: 8px;
      margin-bottom: 24px;

      .info-left {
        display: flex;
        align-items: center;
        overflow: hidden;
        margin-right: 16px;

        .file-name {
          font-weight: 500;
          color: var(--el-text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 12px;
        }

        .file-size {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }
      }

      .info-right {
        flex-shrink: 0;
        .file-duration {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          background: var(--el-fill-color-darker);
          padding: 2px 8px;
          border-radius: 12px;
        }
      }
    }
  }

  .progress-section {
    margin-bottom: 24px;

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--el-text-color-regular);
      margin-bottom: 8px;
    }

    :deep(.el-progress-bar__outer) {
      border-radius: 4px;
    }
    :deep(.el-progress-bar__inner) {
      border-radius: 4px;
      transition: width 0.2s ease;
    }
  }

  .action-bar {
    margin-top: 16px;
    display: flex;
    justify-content: center;

    .submit-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      border-radius: 12px;
      transition:
        transform 0.2s,
        box-shadow 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--el-color-primary-light-5);
      }
      &:active {
        transform: translateY(0);
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
