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
      }
    }
  }
}
