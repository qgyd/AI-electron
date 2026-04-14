import { dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import log, { getLogPath, openLogFolder, setLogPath } from '../logger'
import { setupMediaIPC } from '../media'
import { setupUploadIPC } from '../upload'
import { ipcHandleWithLog, ipcOnWithLog } from './ipc'

/**
 * 统一注册主进程的所有 IPC API
 */
export async function setupAllAPIs() {
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

  // 3. 多媒体转换与云端上传 API
  setupMediaIPC()
  setupUploadIPC()

  // 4. SQLite 数据库 API
  // 必须在 app.whenReady 之后再 require db，因此在此处动态引入
  try {
    const module = await import('../db')
    const dbOperations = module.dbOperations

    ipcHandleWithLog('db:addNote', async (_, note) => await dbOperations.addNote(note))
    ipcHandleWithLog('db:updateNote', async (_, note) => await dbOperations.updateNote(note))
    ipcHandleWithLog('db:getNotes', async () => await dbOperations.getNotes())
    ipcHandleWithLog('db:getNoteById', async (_, id) => await dbOperations.getNoteById(id))
    ipcHandleWithLog('db:deleteNote', async (_, id) => await dbOperations.deleteNote(id))
  } catch (err) {
    log.error('Failed to load db module:', err)
  }
}
