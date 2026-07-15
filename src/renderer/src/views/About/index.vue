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
          <el-button
            v-if="downloadStatus !== 'downloaded'"
            type="primary"
            :loading="checkingUpdate || downloadStatus === 'downloading'"
            @click="handleCheckUpdate"
          >
            {{ downloadStatus === 'downloading' ? '下载中...' : '检查更新' }}
          </el-button>
          <el-button v-else type="success" @click="handleInstallUpdate">
            <el-icon><Upload /></el-icon> 立即安装更新
          </el-button>
          <el-button @click="openRepo">
            <el-icon><Link /></el-icon> 项目主页
          </el-button>
        </div>

        <!-- 下载进度卡片 -->
        <div v-if="downloadStatus === 'downloading' && downloadProgress" class="download-progress-card">
          <el-card shadow="hover">
            <div class="progress-header">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span class="progress-title">
                正在下载 v{{ updateVersion }}...
              </span>
              <span class="progress-percent">{{ downloadProgress.percent.toFixed(1) }}%</span>
            </div>
            <el-progress
              :percentage="downloadProgress.percent"
              :stroke-width="12"
              :show-text="false"
              style="margin: 12px 0"
            />
            <div class="progress-details">
              <span>{{ formatFileSize(downloadProgress.transferred) }} / {{ formatFileSize(downloadProgress.total) }}</span>
              <span>{{ formatSpeed(downloadProgress.bytesPerSecond) }}</span>
            </div>
          </el-card>
        </div>

        <!-- 下载完成提示 -->
        <div v-if="downloadStatus === 'downloaded'" class="download-done-card">
          <el-card shadow="hover">
            <div class="done-content">
              <el-icon color="#67c23a" :size="20"><CircleCheck /></el-icon>
              <span>新版本已下载完成，点击上方按钮立即安装</span>
            </div>
          </el-card>
        </div>

        <!-- 下载错误提示 -->
        <div v-if="downloadStatus === 'error'" class="download-error-card">
          <el-card shadow="hover">
            <div class="error-content">
              <el-icon color="#f56c6c" :size="20"><WarningFilled /></el-icon>
              <span>下载失败: {{ downloadError }}</span>
              <el-button size="small" type="primary" @click="handleCheckUpdate">重试</el-button>
            </div>
          </el-card>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, Link, Upload, Loading, CircleCheck, WarningFilled } from '@element-plus/icons-vue'

const systemInfo = ref<any>({})
const checkingUpdate = ref(false)

// 下载状态
const downloadStatus = ref<'idle' | 'checking' | 'downloading' | 'downloaded' | 'error'>('idle')
const downloadProgress = ref<{
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
} | null>(null)
const updateVersion = ref('')
const downloadError = ref('')

const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i]
}

const formatSpeed = (bytesPerSec: number): string => {
  if (bytesPerSec <= 0) return ''
  return formatFileSize(bytesPerSec) + '/s'
}

const loadInfo = async () => {
  if (window.api && window.api.about) {
    try {
      systemInfo.value = await window.api.about.getSystemInfo()
    } catch (e) {
      console.error('获取系统信息失败', e)
    }
  }
}

const syncDownloadState = async () => {
  if (!window.api?.about) return
  try {
    const state = await window.api.about.getDownloadState()
    if (state && state.status !== 'idle') {
      downloadStatus.value = state.status
      updateVersion.value = state.version || ''
      if (state.progress) {
        downloadProgress.value = state.progress
      }
      if (state.error) {
        downloadError.value = state.error
      }
    }
  } catch {
    // ignore
  }
}

const handleCheckUpdate = async () => {
  if (!window.api || !window.api.about) {
    ElMessage.warning('环境不支持检查更新')
    return
  }

  checkingUpdate.value = true
  downloadStatus.value = 'checking'
  try {
    const result = await window.api.about.checkForUpdates()
    if (result.success) {
      if (result.hasUpdate) {
        downloadStatus.value = 'downloading'
        updateVersion.value = result.version || ''
        ElMessage.success(
          result.message ||
            `发现新版本: v${result.version}，正在后台静默下载，下载完成后会在顶部通知您...`
        )
      } else {
        downloadStatus.value = 'idle'
        ElMessage.success(result.message || '当前已经是最新版本')
      }
    } else {
      downloadStatus.value = 'error'
      downloadError.value = result.message || '检查更新失败'
      ElMessage.warning(result.message || '检查更新失败')
    }
  } catch (e: any) {
    downloadStatus.value = 'error'
    downloadError.value = e.message
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
  syncDownloadState()

  // 监听下载进度
  if (window.api?.about) {
    window.api.about.onDownloadProgress((progress) => {
      downloadStatus.value = 'downloading'
      downloadProgress.value = progress
    })

    // 监听下载完成
    window.api.about.onUpdateDownloaded(() => {
      downloadStatus.value = 'downloaded'
    })

    // 监听更新错误
    window.api.about.onUpdateError((error) => {
      downloadStatus.value = 'error'
      downloadError.value = error
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

    .download-progress-card {
      margin-top: 24px;
      width: 100%;
      max-width: 420px;

      .progress-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .progress-title {
          flex: 1;
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .progress-percent {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-color-primary);
        }
      }

      .progress-details {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }

    .download-done-card {
      margin-top: 24px;
      width: 100%;
      max-width: 420px;

      .done-content {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    .download-error-card {
      margin-top: 24px;
      width: 100%;
      max-width: 420px;

      .error-content {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--el-text-color-primary);
        flex-wrap: wrap;
      }
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
