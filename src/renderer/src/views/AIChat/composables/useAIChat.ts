import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/store/settings'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export function useAIChat() {
  const settings = useSettingsStore()
  const messages = ref<Message[]>([])
  const isGenerating = ref(false)
  const messagesContainer = ref<HTMLElement | null>(null)

  const scrollToBottom = () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }

  const clearHistory = () => {
    messages.value = []
  }

  const sendMessage = async (content: string) => {
    if (!content || isGenerating.value) return false

    if (!settings.aiApiKey) {
      ElMessage.warning('请先前往设置配置 AI API Key')
      return false
    }

    // Add user message
    messages.value.push({ role: 'user', content })
    scrollToBottom()

    isGenerating.value = true

    // Create a placeholder for AI response
    const aiMessageIndex = messages.value.length
    messages.value.push({ role: 'assistant', content: '' })

    try {
      const apiMessages = messages.value.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch(`${settings.aiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.aiApiKey}`
        },
        body: JSON.stringify({
          model: settings.aiModel,
          messages: apiMessages,
          stream: true
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`API 请求失败: ${response.status} ${errText}`)
      }

      if (!response.body) throw new Error('ReadableStream not supported in this browser.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let buffer = ''

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          // 加上 { stream: true } 是为了让 TextDecoder 能够正确处理被截断的多字节 UTF-8 字符（如中文）
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          
          const lines = buffer.split('\n')
          
          // 如果最后一行不是以换行符结尾，说明这个 JSON 块被截断了，保留到下一次循环再处理
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue

            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonStr = trimmedLine.substring(6)
                if (!jsonStr) continue
                
                const data = JSON.parse(jsonStr)
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  messages.value[aiMessageIndex].content += data.choices[0].delta.content
                  scrollToBottom()
                }
              } catch (e) {
                // 如果单行解析失败（比如 API 传回了非法格式），打印日志但不中断整个流
                console.warn('Failed to parse SSE line:', trimmedLine, e)
              }
            }
          }
        }
      }
      
      // 流结束时释放最后的内部缓冲区
      decoder.decode()
    } catch (error: any) {
      console.error('Chat API Error:', error)
      messages.value[aiMessageIndex].content =
        `**请求失败**\n\n\`\`\`text\n${error.message}\n\`\`\`\n\n请检查网络或前往设置检查 API Key 是否正确。`
    } finally {
      isGenerating.value = false
      scrollToBottom()
    }

    return true
  }

  return {
    messages,
    isGenerating,
    messagesContainer,
    scrollToBottom,
    clearHistory,
    sendMessage
  }
}
