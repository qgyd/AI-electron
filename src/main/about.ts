import { app, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import os from 'os'
import { ipcHandleWithLog } from './api/ipc'
import log from './logger'

export function setupAboutIPC() {
  ipcHandleWithLog('about:getSystemInfo', async () => {
    return {
      appName: 'MyTool', // 使用自定义名字或者 app.getName()
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
    try {
      if (!app.isPackaged) {
        return { success: false, message: '开发环境不支持检查更新，请打包后测试' }
      }

      // 配置日志输出，方便排查更新问题
      autoUpdater.logger = log
      // 关闭自动下载，仅检查
      autoUpdater.autoDownload = false

      const result = await autoUpdater.checkForUpdates()
      if (result && result.updateInfo && result.updateInfo.version !== app.getVersion()) {
        return { success: true, hasUpdate: true, version: result.updateInfo.version }
      }
      return { success: true, hasUpdate: false, message: '当前已经是最新版本' }
    } catch (e: any) {
      log.error('Check update failed:', e)
      return { success: false, message: e.message || String(e) }
    }
  })
}
