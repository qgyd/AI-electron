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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone, Switch, RefreshRight } from '@element-plus/icons-vue'
import { useFormat } from '@/hooks/useFormat'
import { useFileSave } from '@/hooks/useFileSave'
import { useMediaConvert } from '@/hooks/useMediaConvert'

const { formatSize, formatDuration } = useFormat()
const { getOutputPath } = useFileSave()

const {
  uploadRef,
  sourceFile,
  sourceFilePath,
  previewUrl,
  mediaInfo,
  isConverting,
  progress,
  clearFile,
  handleFileChange
} = useMediaConvert()

void uploadRef

const targetFormat = ref<string>('mp3')
const startTime = ref<string>('')
const duration = ref<string>('')

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
    const name =
      sourceFile.value.name.substring(0, sourceFile.value.name.lastIndexOf('.')) || 'audio'

    const timestamp = new Date().getTime()
    const newFileName = `${name}_converted_${timestamp}.${targetFormat.value}`

    const outputPath = await getOutputPath(newFileName, [
      { name: 'Audio', extensions: [targetFormat.value] }
    ])
    if (!outputPath) {
      isConverting.value = false
      return
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
@use '@/assets/tool-layout.scss';
</style>
