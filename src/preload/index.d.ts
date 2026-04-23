import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      db: {
        addNote: (note: { title: string; content: string }) => Promise<any>
        updateNote: (note: { id: number; title: string; content: string }) => Promise<any>
        getNotes: () => Promise<any[]>
        getNoteById: (id: number) => Promise<any>
        deleteNote: (id: number) => Promise<boolean>
        login: (params: any) => Promise<{ success: boolean; user?: any; message?: string }>
        updateUserInfo: (params: any) => Promise<{ success: boolean; message?: string }>
        updatePassword: (params: any) => Promise<{ success: boolean; message?: string }>
      }
      log: {
        getPath: () => Promise<string>
        openFolder: () => Promise<void>
        changePath: () => Promise<string>
      }
      media: {
        convert: (options: any) => Promise<{ success: boolean; outputPath: string }>
        getInfo: (inputPath: string) => Promise<any>
        onProgress: (callback: (progress: any) => void) => void
        getFilePath: (file: File) => string
      }
      file: {
        selectFolder: () => Promise<string>
        showSaveDialog: (options: any) => Promise<string>
        saveFile: (filePath: string, base64Data: string) => Promise<boolean>
        joinPath: (...args: string[]) => Promise<string>
        upload: (options: {
          filePath: string
          bucketType: number
          fileType?: string
        }) => Promise<{ success: boolean; data: any }>
        onUploadProgress: (callback: (progress: { percent: number }) => void) => void
      }
      wechat: {
        showPopup: (config: any, message: string) => void
        startWatch: (
          config: any,
          watchOptions: { pollIntervalMs: number; keywords: string[] }
        ) => void
        stopWatch: () => void
      }
      util: {
        fetchText: (url: string) => Promise<string>
      }
      about: {
        getSystemInfo: () => Promise<any>
        openExternal: (url: string) => Promise<void>
        checkForUpdates: () => Promise<{
          success: boolean
          hasUpdate?: boolean
          version?: string
          message?: string
        }>
        installUpdate: () => Promise<{ success: boolean; message?: string }>
        onUpdateDownloaded: (callback: () => void) => void
      }
    }
  }
}
