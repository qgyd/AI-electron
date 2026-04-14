import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const sysName = ref('My Tool')
    const theme = ref('#1677ff') // 默认高级极客蓝
    const darkMode = ref(false)
    const lockTime = ref('30')
    const notify = ref(true)
    const outputDir = ref('')

    const resetSettings = () => {
      sysName.value = 'My Tool'
      theme.value = '#1677ff'
      darkMode.value = false
      lockTime.value = '30'
      notify.value = true
      outputDir.value = ''
    }

    return {
      sysName,
      theme,
      darkMode,
      lockTime,
      notify,
      outputDir,
      resetSettings
    }
  },
  {
    persist: true
  }
)
