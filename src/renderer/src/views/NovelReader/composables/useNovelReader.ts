import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/store/settings'
import type { ReaderTheme } from '@/store/settings'

// 重新导出类型，保持与组件导入路径兼容
export type { ReaderTheme }

export function useNovelReader() {
  const content = ref('')
  const title = ref('未命名小说')
  const loading = ref(false)

  // 阅读器设置状态 — 从持久化 Store 读取
  const settingsStore = useSettingsStore()
  const fontSize = ref(18)
  const theme = ref<ReaderTheme>(settingsStore.readerTheme)

  // 当用户手动切换阅读器主题时，持久化到 Store
  watch(theme, (val) => {
    settingsStore.readerTheme = val
  })

  // 同步全局深色模式：当全局 darkMode 开启时，如果阅读器不是 dark 则自动切换
  watch(
    () => settingsStore.darkMode,
    (isDark) => {
      if (isDark && theme.value !== 'dark') {
        theme.value = 'dark'
      } else if (!isDark && theme.value === 'dark') {
        // 退出深色模式时，恢复到上次保存的主题
        theme.value = settingsStore.readerTheme === 'dark' ? 'light' : settingsStore.readerTheme
      }
    }
  )

  // 本地文件导入 (支持 UTF-8 和 GBK 编码自动识别)
  const loadLocalFile = (file: File) => {
    loading.value = true
    const reader = new FileReader()

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      if (!buffer) return

      let text = ''
      try {
        // 尝试用 UTF-8 解码，如果包含非法字符则抛出错误
        const decoderUtf8 = new TextDecoder('utf-8', { fatal: true })
        text = decoderUtf8.decode(buffer)
      } catch (err) {
        // UTF-8 解码失败，大概率是国内常见的 GBK 编码小说
        const decoderGbk = new TextDecoder('gbk')
        text = decoderGbk.decode(buffer)
      }

      content.value = text
      title.value = file.name.replace(/\.txt$/i, '')
      loading.value = false
      ElMessage.success('小说加载成功')
    }

    reader.onerror = () => {
      ElMessage.error('读取文件失败')
      loading.value = false
    }

    reader.readAsArrayBuffer(file)
  }

  // 在线地址导入 (通过主进程代理解决 CORS 跨域问题)
  const loadOnlineUrl = async (url: string) => {
    if (!url.trim()) {
      ElMessage.warning('请输入有效的小说文本链接')
      return
    }

    loading.value = true
    try {
      if (window.api && window.api.util) {
        const text = await window.api.util.fetchText(url)
        content.value = text
        // 尝试从 URL 提取文件名作为标题
        const urlParts = url.split('/')
        const lastPart = urlParts.pop() || '在线小说'
        title.value = lastPart.includes('.txt') ? lastPart.replace(/\.txt$/i, '') : '在线小说'
        ElMessage.success('在线小说加载成功')
      } else {
        ElMessage.error('主进程接口未挂载')
      }
    } catch (err: any) {
      ElMessage.error(`获取在线小说失败: ${err.message}`)
    } finally {
      loading.value = false
    }
  }

  const clearContent = () => {
    content.value = ''
    title.value = '未命名小说'
  }

  return {
    content,
    title,
    loading,
    fontSize,
    theme,
    loadLocalFile,
    loadOnlineUrl,
    clearContent
  }
}
