import { app, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import os from 'os'
import { ipcHandleWithLog } from './api/ipc'
import log from './logger'

export function setupAboutIPC() {
  // 配置日志输出，方便排查更新问题
  autoUpdater.logger = log
  // 开启自动下载
  autoUpdater.autoDownload = true

  // 监听下载完成事件，自动安装
  autoUpdater.on('update-downloaded', () => {
    log.info('新版本下载完成，准备安装...')
    // 延迟一秒执行，确保日志写入和其他清理工作完成
    setTimeout(() => {
      autoUpdater.quitAndInstall()
    }, 1000)
  })

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

      const result = await autoUpdater.checkForUpdates()
      if (result && result.updateInfo && result.updateInfo.version !== app.getVersion()) {
        return { 
          success: true, 
          hasUpdate: true, 
          version: result.updateInfo.version,
          message: '发现新版本，正在后台下载，下载完成后将自动重启安装' 
        }
      }
      return { success: true, hasUpdate: false, message: '当前已经是最新版本' }
    } catch (e: any) {
      log.error('Check update failed:', e)
      return { success: false, message: e.message || String(e) }
    }
  })
}
