import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ReaderTheme = 'light' | 'sepia' | 'dark'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const sysName = ref('My Tool')
    const sysLogo = ref('') // 系统Logo base64
    const theme = ref('#1677ff') // 默认高级极客蓝
    const darkMode = ref(false)
    const readerTheme = ref<ReaderTheme>('light')
    const lockTime = ref('30')
    const notify = ref(true)
    const outputDir = ref('')

    // AI 设置
    const aiBaseUrl = ref('https://apihub.agnes-ai.com')
    const aiApiKey = ref('')
    const aiModel = ref('agnes-2.0-flash')
    const aiImageModel = ref('agnes-image-2.1-flash')
    const aiVideoModel = ref('agnes-video-v2.0')
    const aiTemperature = ref(0.7)
    const aiMaxTokens = ref(4096)
    const aiSystemPrompt = ref('你是一个有帮助的AI助手，请用中文回答。')
    const aiImageSize = ref('1024x768')
    const aiVideoNumFrames = ref(121)
    const aiVideoFrameRate = ref(24)

    const resetSettings = () => {
      sysName.value = 'My Tool'
      sysLogo.value = ''
      theme.value = '#1677ff'
      darkMode.value = false
      readerTheme.value = 'light'
      lockTime.value = '30'
      notify.value = true
      outputDir.value = ''
      aiBaseUrl.value = 'https://apihub.agnes-ai.com'
      aiApiKey.value = ''
      aiModel.value = 'agnes-2.0-flash'
      aiImageModel.value = 'agnes-image-2.1-flash'
      aiVideoModel.value = 'agnes-video-v2.0'
      aiTemperature.value = 0.7
      aiMaxTokens.value = 4096
      aiSystemPrompt.value = '你是一个有帮助的AI助手，请用中文回答。'
      aiImageSize.value = '1024x768'
      aiVideoNumFrames.value = 121
      aiVideoFrameRate.value = 24
    }

    return {
      sysName,
      sysLogo,
      theme,
      darkMode,
      readerTheme,
      lockTime,
      notify,
      outputDir,
      aiBaseUrl,
      aiApiKey,
      aiModel,
      aiImageModel,
      aiVideoModel,
      aiTemperature,
      aiMaxTokens,
      aiSystemPrompt,
      aiImageSize,
      aiVideoNumFrames,
      aiVideoFrameRate,
      resetSettings
    }
  },
  {
    persist: true
  }
)
