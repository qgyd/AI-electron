import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export type ReaderTheme = 'light' | 'sepia' | 'dark'

export function useNovelReader() {
  const content = ref('')
  const title = ref('未命名小说')
  const loading = ref(false)

  // 阅读器设置状态
  const fontSize = ref(18)
  const theme = ref<ReaderTheme>('light')

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
