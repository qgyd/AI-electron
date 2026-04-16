import { app } from 'electron'
import { startMacosWechatNotificationWatch } from './macos'
import { startWindowsWechatNotificationWatch } from './windows'

export interface WechatNotificationWatchOptions {
  pollIntervalMs: number
  keywords: string[]
  onMessage: (message: string) => void
}

export type WechatNotificationWatchStopper = () => void

export function startWechatNotificationWatch(
  options: WechatNotificationWatchOptions
): WechatNotificationWatchStopper {
  const userDataDir = app.getPath('userData')

  if (process.platform === 'darwin') {
    return startMacosWechatNotificationWatch({ ...options, userDataDir })
  }

  if (process.platform === 'win32') {
    return startWindowsWechatNotificationWatch({ ...options, userDataDir })
  }

  return () => undefined
}
