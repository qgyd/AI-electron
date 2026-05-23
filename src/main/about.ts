import { app, shell, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import os from 'os'
import { ipcHandleWithLog } from './api/ipc'
import log from './logger'
import { createAutoUpdateScheduler } from './update-scheduler'

export function setupAboutIPC() {
  // 配置日志输出，方便排查更新问题
  autoUpdater.logger = log
  // 开启自动下载
  autoUpdater.autoDownload = true

  let updateDownloaded = false
  let hasNotifiedUpdateAvailable = false

  const sendToAllWindows = (channel: string, payload?: string) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel, payload)
    })
  }

  const performUpdateCheck = async ({ notifyRenderer = false } = {}) => {
    try {
      if (!app.isPackaged) {
        return { success: false, message: '开发环境不支持检查更新，请打包后测试' }
      }

      const result = await autoUpdater.checkForUpdates()
      const version = result?.updateInfo?.version
      const hasUpdate = Boolean(version && version !== app.getVersion())

      if (hasUpdate && notifyRenderer && !hasNotifiedUpdateAvailable) {
        hasNotifiedUpdateAvailable = true
        sendToAllWindows('about:update-available', version)
      }

      if (hasUpdate) {
        return {
          success: true,
          hasUpdate: true,
          version,
          message: '发现新版本，正在后台下载，下载完成后将自动重启安装'
        }
      }

      return { success: true, hasUpdate: false, message: '当前已经是最新版本' }
    } catch (e: any) {
      log.error('Check update failed:', e)
      return { success: false, message: e.message || String(e) }
    }
  }

  // 监听下载完成事件，通知渲染进程
  autoUpdater.on('update-downloaded', () => {
    log.info('新版本下载完成，等待用户决定或关闭应用时安装...')
    updateDownloaded = true

    // 通知所有窗口更新已下载完毕
    sendToAllWindows('about:update-downloaded')
  })

  // 当应用准备退出时，如果有更新，静默安装
  app.on('will-quit', () => {
    if (updateDownloaded) {
      log.info('应用正在关闭，开始安装更新...')
      autoUpdater.quitAndInstall(true, true)
    }
  })

  createAutoUpdateScheduler({
    isPackaged: app.isPackaged,
    runCheck: async () => {
      const result = await performUpdateCheck({ notifyRenderer: true })
      if (!result.success) {
        log.warn('自动检查更新失败:', result.message)
      }
    }
  }).start()

  ipcHandleWithLog('about:getSystemInfo', async () => {
    return {
      appName: '工具助手', // 将前端关于页面的显示名称改回工具助手
      appVersion: app.getVersion(),
      osType: os.type(),
      osRelease: os.release(),
      osArch: os.arch(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      v8Version: process.versions.v8,
      cpus: os.cpus().length,
      totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    }
  })

  ipcHandleWithLog('about:openExternal', async (_, url: string) => {
    await shell.openExternal(url)
  })

  ipcHandleWithLog('about:checkForUpdates', async () => {
    return performUpdateCheck()
  })

  ipcHandleWithLog('about:installUpdate', async () => {
    if (updateDownloaded) {
      log.info('用户手动触发安装更新...')
      autoUpdater.quitAndInstall(true, true)
      return { success: true }
    }
    return { success: false, message: '更新尚未下载完成' }
  })
}
