<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingsStore } from '@/store/settings'
import { setPrimaryColor, toggleDarkTheme } from '@/utils/theme'

const settingsStore = useSettingsStore()
const updateReady = ref(false)

onMounted(() => {
  // 首次进入时，从持久化 Store 中获取配置并应用
  setPrimaryColor(settingsStore.theme)
  toggleDarkTheme(settingsStore.darkMode)
  document.title = settingsStore.sysName

  // 全局监听更新下载完成事件
  if (window.api?.about) {
    window.api.about.onUpdateAvailable((version) => {
      void ElMessageBox.alert(
        `检测到${version ? ` v${version}` : ''}新版本，已开始后台下载。下载完成后会再次提示您安装更新。`,
        '发现新版本',
        {
          confirmButtonText: '知道了',
          type: 'info'
        }
      )
    })

    window.api.about.onUpdateDownloaded(() => {
      updateReady.value = true
    })
  }
})

const handleInstallUpdate = async () => {
  try {
    await window.api.about.installUpdate()
  } catch (e: any) {
    ElMessage.error(`请求安装更新失败: ${e.message}`)
  }
}

// 监听系统名称变动，同步修改窗口标题
watch(
  () => settingsStore.sysName,
  (newName) => {
    document.title = newName || '工具助手'
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
  <!-- 无感更新：顶部提示条 -->
  <div v-if="updateReady" class="global-update-banner">
    <el-alert
      title="新版本已在后台下载完成"
      type="success"
      show-icon
      :closable="true"
      @close="updateReady = false"
    >
      <template #default>
        <div class="update-actions">
          <span>您可以选择立即重启并安装更新，或者稍后在关闭软件时自动安装。</span>
          <el-button size="small" type="primary" @click="handleInstallUpdate">
            立即重启并安装
          </el-button>
        </div>
      </template>
    </el-alert>
  </div>
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

.global-update-banner {
  flex-shrink: 0;
}

.global-update-banner .update-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

/* 调整全局根节点，防止出现滚动条 */
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
</style>
