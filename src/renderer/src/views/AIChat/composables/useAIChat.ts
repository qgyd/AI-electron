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

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  messages.value[aiMessageIndex].content += data.choices[0].delta.content
                  scrollToBottom()
                }
              } catch (e) {
                // ignore parse error on incomplete chunks
              }
            }
          }
        }
      }
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
