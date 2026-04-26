import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    addNote: (note: { title: string; content: string; user_id: number }) => ipcRenderer.invoke('db:addNote', note),
    updateNote: (note: { id: number; title: string; content: string; user_id: number }) =>
      ipcRenderer.invoke('db:updateNote', note),
    getNotes: (userId: number) => ipcRenderer.invoke('db:getNotes', userId),
    getNoteById: (id: number, userId: number) => ipcRenderer.invoke('db:getNoteById', id, userId),
    deleteNote: (id: number, userId: number) => ipcRenderer.invoke('db:deleteNote', id, userId),

    register: (params: any) => ipcRenderer.invoke('db:register', params),
    login: (params: any) => ipcRenderer.invoke('db:login', params),
    updateUserInfo: (params: any) => ipcRenderer.invoke('db:updateUserInfo', params),
    updatePassword: (params: any) => ipcRenderer.invoke('db:updatePassword', params)
  },
  log: {
    getPath: () => ipcRenderer.invoke('log:getPath'),
    openFolder: () => ipcRenderer.invoke('log:openFolder'),
    changePath: () => ipcRenderer.invoke('log:changePath')
  },
  media: {
    convert: (options: any) => ipcRenderer.invoke('media:convert', options),
    getInfo: (inputPath: string) => ipcRenderer.invoke('media:getInfo', inputPath),
    onProgress: (callback: (progress: any) => void) => {
      // Remove any existing listeners first to avoid duplicate calls
      ipcRenderer.removeAllListeners('media:progress')
      ipcRenderer.on('media:progress', (_event, progress) => callback(progress))
    },
    getFilePath: (file: File) => {
      try {
        if (typeof webUtils !== 'undefined' && webUtils.getPathForFile) {
          return webUtils.getPathForFile(file)
        }
      } catch (e) {
        console.error('webUtils.getPathForFile failed:', e)
      }
      return (file as any).path || ''
    }
  },
  file: {
    selectFolder: () => ipcRenderer.invoke('file:selectFolder'),
    showSaveDialog: (options: any) => ipcRenderer.invoke('file:showSaveDialog', options),
    saveFile: (filePath: string, base64Data: string) =>
      ipcRenderer.invoke('file:saveFile', filePath, base64Data),
    joinPath: (...args: string[]) => ipcRenderer.invoke('path:join', ...args),
    upload: (options: any) => ipcRenderer.invoke('file:upload', options),
    onUploadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.removeAllListeners('file:upload-progress')
      ipcRenderer.on('file:upload-progress', (_event, progress) => callback(progress))
    }
  },
  wechat: {
    showPopup: (config: any, message: any) =>
      ipcRenderer.send('wechat:show-popup', config, message),
    startWatch: (config: any, watchOptions: any) =>
      ipcRenderer.send('wechat:watch-start', config, watchOptions),
    stopWatch: () => ipcRenderer.send('wechat:watch-stop')
  },
  util: {
    fetchText: (url: string) => ipcRenderer.invoke('util:fetchText', url)
  },
  about: {
    getSystemInfo: () => ipcRenderer.invoke('about:getSystemInfo'),
    openExternal: (url: string) => ipcRenderer.invoke('about:openExternal', url),
    checkForUpdates: () => ipcRenderer.invoke('about:checkForUpdates'),
    installUpdate: () => ipcRenderer.invoke('about:installUpdate'),
    onUpdateDownloaded: (callback: () => void) => {
      ipcRenderer.removeAllListeners('about:update-downloaded')
      ipcRenderer.on('about:update-downloaded', () => callback())
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
