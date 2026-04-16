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
  <div class="custom-titlebar"></div>
  <router-view></router-view>
</template>

<style>
.custom-titlebar {
  height: 38px;
  width: 100%;
  background-color: var(--el-bg-color);
  -webkit-app-region: drag;
  flex-shrink: 0;
  z-index: 1000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-light);
}

/* 调整全局根节点，防止出现滚动条 */
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
</style>
