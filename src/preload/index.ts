import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    addNote: (note: { title: string; content: string }) => ipcRenderer.invoke('db:addNote', note),
    updateNote: (note: { id: number; title: string; content: string }) =>
      ipcRenderer.invoke('db:updateNote', note),
    getNotes: () => ipcRenderer.invoke('db:getNotes'),
    getNoteById: (id: number) => ipcRenderer.invoke('db:getNoteById', id),
    deleteNote: (id: number) => ipcRenderer.invoke('db:deleteNote', id)
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
    joinPath: (...args: string[]) => ipcRenderer.invoke('path:join', ...args)
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
