<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useSettingsStore } from '@/store/settings'
import { setPrimaryColor, toggleDarkTheme } from '@/utils/theme'

const settingsStore = useSettingsStore()

onMounted(() => {
  // 首次进入时，从持久化 Store 中获取配置并应用
  setPrimaryColor(settingsStore.theme)
  toggleDarkTheme(settingsStore.darkMode)
  document.title = settingsStore.sysName
})

// 监听系统名称变动，同步修改窗口标题
watch(
  () => settingsStore.sysName,
  (newName) => {
    document.title = newName || 'My Tool'
  }
)

// 监听主题色的变动
watch(
  () => settingsStore.theme,
  (newColor) => {
    setPrimaryColor(newColor)
  }
)

// 监听暗黑模式的变动
watch(
  () => settingsStore.darkMode,
  (isDark) => {
    toggleDarkTheme(isDark)
  }
)
</script>

<template>
  <router-view></router-view>
</template>

<style>
/* 这里可以放全局样式 */
</style>
