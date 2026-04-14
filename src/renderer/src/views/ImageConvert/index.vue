<template>
  <div class="tool-container">
    <div class="page-header">
      <h2>图片格式转换</h2>
      <p class="subtitle">支持 PNG, JPEG, WEBP, BMP, ICO 格式互转</p>
    </div>

    <div class="content-card">
      <!-- 上传区域 -->
      <el-upload
        class="single-uploader"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        @change="handleFileChange"
      >
        <div v-if="previewUrl" class="preview-wrapper">
          <img :src="previewUrl" class="preview-image" />
          <div class="file-mask">
            <el-icon><Switch /></el-icon>
            <span>点击或拖拽更换图片</span>
          </div>
        </div>
        <div v-else class="upload-placeholder">
          <el-icon class="upload-icon"><Picture /></el-icon>
          <div class="upload-text">将图片拖到此处，或 <em>点击上传</em></div>
        </div>
      </el-upload>

      <!-- 转换设置 (选中文件后显示) -->
      <div v-if="sourceFile" class="settings-panel">
        <div class="file-info">
          <div class="info-left">
            <span class="file-name">{{ sourceFile.name }}</span>
            <span class="file-size">{{ formatSize(sourceFile.size) }}</span>
          </div>
        </div>

        <el-form label-position="top" class="settings-form" @submit.prevent>
          <el-row :gutter="24">
            <el-col
              :span="targetFormat === 'image/jpeg' || targetFormat === 'image/webp' ? 12 : 24"
            >
              <el-form-item label="目标格式">
                <el-select v-model="targetFormat" style="width: 100%">
                  <el-option label="PNG (.png)" value="image/png" />
                  <el-option label="JPEG (.jpg)" value="image/jpeg" />
                  <el-option label="WEBP (.webp)" value="image/webp" />
                  <el-option label="BMP (.bmp)" value="image/bmp" />
                  <el-option label="ICO (.ico)" value="image/x-icon" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col
              v-if="targetFormat === 'image/jpeg' || targetFormat === 'image/webp'"
              :span="12"
            >
              <el-form-item label="图片质量">
                <div class="slider-container">
                  <el-slider v-model="quality" :min="10" :max="100" :step="1" />
                  <span class="slider-value">{{ quality }}%</span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="action-bar">
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="isConverting"
              @click.stop="handleConvert"
            >
              <el-icon><RefreshRight /></el-icon>
              转换并保存
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
import { Picture, Switch, RefreshRight } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { useSettingsStore } from '@/store/settings'

const settingsStore = useSettingsStore()
const sourceFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const targetFormat = ref<string>('image/png')
const quality = ref<number>(90)
const isConverting = ref<boolean>(false)

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const encodeICO = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!pngBlob) throw new Error('无法生成 PNG 格式')
  const pngData = new Uint8Array(await pngBlob.arrayBuffer())

  const width = canvas.width >= 256 ? 0 : canvas.width
  const height = canvas.height >= 256 ? 0 : canvas.height

  const header = new Uint8Array([
    0,
    0, // Reserved
    1,
    0, // Type (1 = ICO)
    1,
    0, // Number of images
    width,
    height, // Dimensions
    0,
    0, // Color palette & Reserved
    1,
    0, // Color planes
    32,
    0, // BPP
    ...new Uint8Array(new Uint32Array([pngData.length]).buffer), // Size of image
    22,
    0,
    0,
    0 // Offset to image
  ])

  const icoData = new Uint8Array(header.length + pngData.length)
  icoData.set(header, 0)
  icoData.set(pngData, header.length)

  return new Blob([icoData], { type: 'image/x-icon' })
}

const encodeBMP = (canvas: HTMLCanvasElement): Blob => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取 Canvas 上下文')

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  const rowBytes = (width * 3 + 3) & ~3 // 4-byte aligned
  const imgSize = rowBytes * height
  const fileSize = 54 + imgSize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // BMP Header
  view.setUint16(0, 0x4d42, false) // 'BM'
  view.setUint32(2, fileSize, true) // file size
  view.setUint32(10, 54, true) // offset to image data

  // DIB Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true) // DIB header size
  view.setInt32(18, width, true) // width
  view.setInt32(22, height, true) // height (positive means bottom-up)
  view.setUint16(26, 1, true) // color planes
  view.setUint16(28, 24, true) // bits per pixel (24 for RGB)
  view.setUint32(30, 0, true) // compression (0 = none)
  view.setUint32(34, imgSize, true) // image size
  view.setInt32(38, 2835, true) // x pixels per meter
  view.setInt32(42, 2835, true) // y pixels per meter

  // Image Data (bottom-up, BGR)
  let offset = 54
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      view.setUint8(offset++, data[i + 2]) // B
      view.setUint8(offset++, data[i + 1]) // G
      view.setUint8(offset++, data[i]) // R
    }
    // padding
    offset += rowBytes - width * 3
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    const isImage = uploadFile.raw.type.startsWith('image/')
    if (!isImage) {
      ElMessage.error('请上传图片文件!')
      return
    }
    sourceFile.value = uploadFile.raw
    previewUrl.value = URL.createObjectURL(uploadFile.raw)

    // 默认不转换为自己的格式
    if (uploadFile.raw.type === 'image/png') {
      targetFormat.value = 'image/jpeg'
    } else if (uploadFile.raw.type === 'image/jpeg') {
      targetFormat.value = 'image/png'
    }
  }
}

const handleConvert = async (e: Event) => {
  e.preventDefault()
  e.stopPropagation()

  if (!sourceFile.value || !previewUrl.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  isConverting.value = true

  try {
    const image = new Image()
    image.src = previewUrl.value
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
    })

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建 Canvas 上下文')

    // 对于不支持透明度的格式，填充白色背景
    if (targetFormat.value === 'image/jpeg' || targetFormat.value === 'image/bmp') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // 计算文件扩展名和默认文件名
    let ext = targetFormat.value.split('/')[1]
    if (targetFormat.value === 'image/x-icon') ext = 'ico'
    else if (targetFormat.value === 'image/jpeg') ext = 'jpg'

    const originalName =
      sourceFile.value.name.substring(0, sourceFile.value.name.lastIndexOf('.')) || 'image'
    const newFileName = `${originalName}_converted.${ext}`

    let outputPath = ''
    if (settingsStore.outputDir) {
      outputPath = await window.api.file.joinPath(settingsStore.outputDir, newFileName)
    } else {
      outputPath = await window.api.file.showSaveDialog({
        defaultPath: newFileName,
        filters: [{ name: 'Images', extensions: [ext] }]
      })
      if (!outputPath) {
        isConverting.value = false
        return
      }
    }

    let base64Data: string

    // 获取 Base64 数据
    const blobToBase64 = (blob: Blob) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

    if (targetFormat.value === 'image/bmp') {
      const blob = encodeBMP(canvas)
      base64Data = await blobToBase64(blob)
    } else if (targetFormat.value === 'image/x-icon') {
      const blob = await encodeICO(canvas)
      base64Data = await blobToBase64(blob)
    } else {
      base64Data = canvas.toDataURL(targetFormat.value, quality.value / 100)
    }

    // 写入文件
    const success = await window.api.file.saveFile(outputPath, base64Data)

    if (success) {
      ElMessage.success(`转换成功！文件已保存至：${outputPath}`)
    } else {
      ElMessage.error('文件保存失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('图片转换失败')
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
  }

  .single-uploader:hover .upload-icon {
    transform: translateY(-5px);
    color: var(--el-color-primary);
  }

  .preview-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);

    .preview-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
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
    }
  }

  .slider-container {
    display: flex;
    align-items: center;
    gap: 16px;

    .el-slider {
      flex: 1;
    }

    .slider-value {
      min-width: 44px;
      color: var(--el-text-color-regular);
      font-variant-numeric: tabular-nums;
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
