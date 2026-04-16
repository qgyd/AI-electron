<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { useSettingsStore } from '@/store/settings'
import { setPrimaryColor, toggleDarkTheme } from '@/utils/theme'

const settingsStore = useSettingsStore()

onMounted(() => {
  // 首次进入时，从持久化 Store 中获取配置并应用
  setPrimaryColor(settingsStore.theme)
  toggleDarkTheme(settingsStore.darkMode)
  document.title = settingsStore.sysName

  // 启动后台轮询更新检查
  startUpdatePolling()
})

const startUpdatePolling = () => {
  // 每隔 1 小时 (3600000 毫秒) 检查一次更新
  const ONE_HOUR = 60 * 60 * 1000

  // 封装检查更新的逻辑
  const doCheckUpdate = async () => {
    if (!window.api || !window.api.about) return
    try {
      const result = await window.api.about.checkForUpdates()
      // 如果检测到新版本，弹出优雅的通知
      if (result.success && result.hasUpdate) {
        ElNotification({
          title: '发现新版本',
          message: `新版本 v${result.version} 已准备就绪。您可以前往官网下载，或者等待自动更新。`,
          type: 'success',
          duration: 0, // 不自动关闭，等待用户看到
          position: 'bottom-right'
        })
      }
    } catch (e) {
      console.error('后台轮询更新失败:', e)
    }
  }

  // 初次启动后延迟 5 分钟做一次检查，避免刚打开就卡顿
  setTimeout(
    () => {
      doCheckUpdate()
      // 之后每小时循环检查
      setInterval(doCheckUpdate, ONE_HOUR)
    },
    5 * 60 * 1000
  )
}

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
