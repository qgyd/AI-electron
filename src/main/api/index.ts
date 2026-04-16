import { dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import log, { getLogPath, openLogFolder, setLogPath } from '../logger'
import { setupMediaIPC } from '../media'
import { setupUploadIPC } from '../upload'
import { setupWechatIPC } from '../wechat'
import { setupAboutIPC } from '../about'
import { ipcHandleWithLog, ipcOnWithLog } from './ipc'

/**
 * 统一注册主进程的所有 IPC API
 */
export async function setupAllAPIs() {
  // 0. 通用工具 API (处理跨域等)
  ipcHandleWithLog('util:fetchText', async (_, url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // 自动识别 UTF-8 与 GBK
      try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
      } catch (err) {
        return new TextDecoder('gbk').decode(buffer)
      }
    } catch (err: any) {
      log.error('fetchText error:', err.message)
      throw err
    }
  })

  // 1. 系统与日志 API
  ipcOnWithLog('ping', () => log.info('pong'))
  ipcHandleWithLog('log:getPath', () => getLogPath())
  ipcHandleWithLog('log:openFolder', () => openLogFolder())
  ipcHandleWithLog('log:changePath', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择日志存储目录',
      properties: ['openDirectory', 'createDirectory']
    })

    if (!canceled && filePaths.length > 0) {
      return setLogPath(filePaths[0])
    }
    return getLogPath()
  })

  // 2. 本地文件系统 API
  ipcHandleWithLog('file:selectFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择文件夹',
      properties: ['openDirectory', 'createDirectory']
    })
    if (!canceled && filePaths.length > 0) {
      return filePaths[0]
    }
    return ''
  })

  ipcHandleWithLog('file:showSaveDialog', async (_, options) => {
    const { canceled, filePath } = await dialog.showSaveDialog(options)
    if (!canceled) {
      return filePath
    }
    return ''
  })

  ipcHandleWithLog('file:saveFile', async (_, filePath, base64Data) => {
    try {
      const data = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(data, 'base64')
      fs.writeFileSync(filePath, buffer)
      return true
    } catch (e) {
      log.error('Save file error:', e)
      return false
    }
  })

  ipcHandleWithLog('path:join', (_, ...args) => join(...args))

  // 3. 多媒体转换、云端上传、微信助手、关于页面 API
  setupMediaIPC()
  setupUploadIPC()
  setupWechatIPC()
  setupAboutIPC()

  // 4. SQLite 数据库 API
  // 必须在 app.whenReady 之后再 require db，因此在此处动态引入
  try {
    const { noteService } = await import('../db/services/note')
    const { userService } = await import('../db/services/user')

    // 触发 DB 初始化（只要引入了 '../db/index'，就会执行 db 初始化）
    await import('../db/index')

    ipcHandleWithLog('db:addNote', async (_, note) => await noteService.addNote(note))
    ipcHandleWithLog('db:updateNote', async (_, note) => await noteService.updateNote(note))
    ipcHandleWithLog('db:getNotes', async () => await noteService.getNotes())
    ipcHandleWithLog('db:getNoteById', async (_, id) => await noteService.getNoteById(id))
    ipcHandleWithLog('db:deleteNote', async (_, id) => await noteService.deleteNote(id))

    ipcHandleWithLog('db:login', async (_, params) => await userService.login(params))
    ipcHandleWithLog(
      'db:updateUserInfo',
      async (_, params) => await userService.updateUserInfo(params)
    )
    ipcHandleWithLog(
      'db:updatePassword',
      async (_, params) => await userService.updatePassword(params)
    )
  } catch (err) {
    log.error('Failed to load db module:', err)
  }
}
