import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import icon from '../../resources/icon.png?asset'
import log, { getLogPath, openLogFolder, setLogPath } from './logger'
import { setupMediaIPC } from './media'

log.info('Starting application...')

// 这里先不要直接引入 db，因为在 app.whenReady 之前调用 app.getPath 可能会报错
let dbOperations: any

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => log.info('pong'))

  ipcMain.handle('log:getPath', () => getLogPath())
  ipcMain.handle('log:openFolder', () => openLogFolder())
  ipcMain.handle('log:changePath', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择日志存储目录',
      properties: ['openDirectory', 'createDirectory']
    })

    if (!canceled && filePaths.length > 0) {
      return setLogPath(filePaths[0])
    }
    return getLogPath()
  })

  // File operations
  ipcMain.handle('file:selectFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: '选择文件夹',
      properties: ['openDirectory', 'createDirectory']
    })
    if (!canceled && filePaths.length > 0) {
      return filePaths[0]
    }
    return ''
  })

  ipcMain.handle('file:showSaveDialog', async (_, options) => {
    const { canceled, filePath } = await dialog.showSaveDialog(options)
    if (!canceled) {
      return filePath
    }
    return ''
  })

  ipcMain.handle('file:saveFile', async (_, filePath, base64Data) => {
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

  ipcMain.handle('path:join', (_, ...args) => join(...args))

  // 必须在 app.whenReady 之后再 require db，否则 userData 目录可能还没准备好
  import('./db')
    .then((module) => {
      dbOperations = module.dbOperations

      // 注册 SQLite 数据库操作相关的 IPC 监听
      ipcMain.handle('db:addNote', async (_, note) => await dbOperations.addNote(note))
      ipcMain.handle('db:updateNote', async (_, note) => await dbOperations.updateNote(note))
      ipcMain.handle('db:getNotes', async () => await dbOperations.getNotes())
      ipcMain.handle('db:getNoteById', async (_, id) => await dbOperations.getNoteById(id))
      ipcMain.handle('db:deleteNote', async (_, id) => await dbOperations.deleteNote(id))

      setupMediaIPC()

      createWindow()
    })
    .catch((err) => {
      log.error('Failed to load db module:', err)
      createWindow() // 就算 db 挂了，也把窗口弹出来
    })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
