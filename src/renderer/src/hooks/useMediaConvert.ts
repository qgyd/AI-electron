import { ref, onMounted, onUnmounted } from 'vue'
import type { UploadFile, UploadInstance } from 'element-plus'

export function useMediaConvert() {
  const uploadRef = ref<UploadInstance>()
  const sourceFile = ref<any>(null)
  const sourceFilePath = ref<string>('')
  const previewUrl = ref<string>('')
  const mediaInfo = ref<any>(null)

  const isConverting = ref<boolean>(false)
  const progress = ref<number>(0)

  onMounted(() => {
    if (window.api && window.api.media) {
      window.api.media.onProgress((prog: any) => {
        if (prog && prog.percent) {
          progress.value = Math.min(100, Math.max(0, prog.percent))
        }
      })
    }
  })

  onUnmounted(() => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
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
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
  }

  const handleFileChange = async (uploadFile: UploadFile) => {
    if (uploadFile.raw) {
      sourceFile.value = uploadFile.raw
      previewUrl.value = URL.createObjectURL(uploadFile.raw)
      mediaInfo.value = null
      progress.value = 0

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

  return {
    uploadRef,
    sourceFile,
    sourceFilePath,
    previewUrl,
    mediaInfo,
    isConverting,
    progress,
    clearFile,
    handleFileChange
  }
}
