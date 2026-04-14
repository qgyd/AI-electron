import { useSettingsStore } from '@/store/settings'

export function useFileSave() {
  const settingsStore = useSettingsStore()

  const getOutputPath = async (
    defaultName: string,
    filters: { name: string; extensions: string[] }[]
  ) => {
    if (settingsStore.outputDir) {
      return await window.api.file.joinPath(settingsStore.outputDir, defaultName)
    } else {
      return await window.api.file.showSaveDialog({
        defaultPath: defaultName,
        filters
      })
    }
  }

  return { getOutputPath }
}
