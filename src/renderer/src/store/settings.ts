import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const sysName = ref('My Tool')
    const sysLogo = ref('') // 系统Logo base64
    const theme = ref('#1677ff') // 默认高级极客蓝
    const darkMode = ref(false)
    const lockTime = ref('30')
    const notify = ref(true)
    const outputDir = ref('')

    // AI 设置
    const aiBaseUrl = ref('https://api.siliconflow.cn/v1')
    const aiApiKey = ref('')
    const aiModel = ref('Qwen/Qwen2.5-7B-Instruct')

    const resetSettings = () => {
      sysName.value = 'My Tool'
      sysLogo.value = ''
      theme.value = '#1677ff'
      darkMode.value = false
      lockTime.value = '30'
      notify.value = true
      outputDir.value = ''
      aiBaseUrl.value = 'https://api.siliconflow.cn/v1'
      aiApiKey.value = ''
      aiModel.value = 'Qwen/Qwen2.5-7B-Instruct'
    }

    return {
      sysName,
      sysLogo,
      theme,
      darkMode,
      lockTime,
      notify,
      outputDir,
      aiBaseUrl,
      aiApiKey,
      aiModel,
      resetSettings
    }
  },
  {
    persist: true
  }
)
