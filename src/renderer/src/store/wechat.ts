import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWechatStore = defineStore(
  'wechat',
  () => {
    const enabled = ref(true)
    const width = ref(320)
    const height = ref(90)
    const bgColor = ref('#ffffff')
    const textColor = ref('#333333')
    const borderRadius = ref(8)
    const opacity = ref(0.95)
    const duration = ref(5000)

    const resetSettings = () => {
      enabled.value = true
      width.value = 320
      height.value = 90
      bgColor.value = '#ffffff'
      textColor.value = '#333333'
      borderRadius.value = 8
      opacity.value = 0.95
      duration.value = 5000
    }

    return {
      enabled,
      width,
      height,
      bgColor,
      textColor,
      borderRadius,
      opacity,
      duration,
      resetSettings
    }
  },
  {
    persist: true
  }
)
