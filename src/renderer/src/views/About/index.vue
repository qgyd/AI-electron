<template>
  <div class="tool-container about-container">
    <div class="page-header">
      <h2>关于</h2>
    </div>

    <div class="content-card about-card">
      <div class="app-hero">
        <div class="app-logo">
          <el-icon><Monitor /></el-icon>
        </div>
        <h1 class="app-name">{{ systemInfo.appName || 'MyTool' }}</h1>
        <p class="app-version">Version {{ systemInfo.appVersion || '1.0.0' }}</p>

        <div class="action-buttons">
          <el-button type="primary" :loading="checkingUpdate" @click="handleCheckUpdate">
            检查更新
          </el-button>
          <el-button v-if="updateReady" type="success" @click="handleInstallUpdate">
            <el-icon><Download /></el-icon> 立即重启并安装更新
          </el-button>
          <el-button @click="openRepo">
            <el-icon><Link /></el-icon> 项目主页
          </el-button>
        </div>
      </div>

      <el-divider border-style="dashed" />

      <div class="info-section">
        <h3 class="section-title">设备信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作系统">
            {{ systemInfo.osType }} {{ systemInfo.osRelease }}
          </el-descriptions-item>
          <el-descriptions-item label="系统架构">
            {{ systemInfo.osArch }}
          </el-descriptions-item>
          <el-descriptions-item label="CPU 核心数">
            {{ systemInfo.cpus }} 核心
          </el-descriptions-item>
          <el-descriptions-item label="物理内存">
            {{ systemInfo.totalMem }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="info-section">
        <h3 class="section-title">运行环境</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Electron">
            v{{ systemInfo.electronVersion }}
          </el-descriptions-item>
          <el-descriptions-item label="Chromium">
            v{{ systemInfo.chromeVersion }}
          </el-descriptions-item>
          <el-descriptions-item label="Node.js">
            v{{ systemInfo.nodeVersion }}
          </el-descriptions-item>
          <el-descriptions-item label="V8 引擎"> v{{ systemInfo.v8Version }} </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="footer-text">Powered by Electron, Vue 3, Vite & Element Plus</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Link, Download } from '@element-plus/icons-vue'

const systemInfo = ref<any>({})
const checkingUpdate = ref(false)
const updateReady = ref(false)

const loadInfo = async () => {
  if (window.api && window.api.about) {
    try {
      systemInfo.value = await window.api.about.getSystemInfo()
    } catch (e) {
      console.error('获取系统信息失败', e)
    }
  }
}

const handleCheckUpdate = async () => {
  if (!window.api || !window.api.about) {
    ElMessage.warning('环境不支持检查更新')
    return
  }

  checkingUpdate.value = true
  try {
    const result = await window.api.about.checkForUpdates()
    if (result.success) {
      if (result.hasUpdate) {
        ElMessage.success(
          result.message ||
            `发现新版本: v${result.version}，正在后台静默下载，下载完成后会通知您...`
        )
      } else {
        ElMessage.success(result.message || '当前已经是最新版本')
      }
    } else {
      ElMessage.warning(result.message || '检查更新失败')
    }
  } catch (e: any) {
    ElMessage.error(`检查更新异常: ${e.message}`)
  } finally {
    checkingUpdate.value = false
  }
}

const handleInstallUpdate = async () => {
  try {
    await window.api.about.installUpdate()
  } catch (e: any) {
    ElMessage.error(`请求安装更新失败: ${e.message}`)
  }
}

const openRepo = () => {
  if (window.api && window.api.about) {
    window.api.about.openExternal('https://github.com/qgyd/AI-electron')
  }
}

onMounted(() => {
  loadInfo()

  if (window.api && window.api.about) {
    window.api.about.onUpdateDownloaded(() => {
      updateReady.value = true
      ElMessageBox.confirm(
        '新版本已在后台下载完成。您可以选择立即重启并安装更新，或者稍后在关闭软件时自动安装。',
        '更新准备就绪',
        {
          confirmButtonText: '立即重启并安装',
          cancelButtonText: '稍后安装',
          type: 'success',
          center: true
        }
      )
        .then(() => {
          handleInstallUpdate()
        })
        .catch(() => {
          // 用户选择稍后，无操作，依赖主进程 app.on('will-quit') 自动安装
          ElMessage.info('已选择稍后安装。将在您退出软件时自动执行更新。')
        })
    })
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/tool-layout.scss';

.about-container {
  max-width: 800px;
  margin: 0 auto;

  .about-card {
    padding: 40px;
  }

  .app-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;

    .app-logo {
      width: 80px;
      height: 80px;
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      margin-bottom: 16px;
      box-shadow: var(--el-box-shadow-light);
    }

    .app-name {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .app-version {
      margin: 0 0 24px 0;
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }

    .action-buttons {
      display: flex;
      gap: 16px;
    }
  }

  .info-section {
    margin-top: 32px;

    .section-title {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-left: 4px solid var(--el-color-primary);
      padding-left: 12px;
    }

    :deep(.el-descriptions__label) {
      width: 140px;
      color: var(--el-text-color-secondary);
      background-color: var(--el-fill-color-light);
    }
  }

  .footer-text {
    margin-top: 40px;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
