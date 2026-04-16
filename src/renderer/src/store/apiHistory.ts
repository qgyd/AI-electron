import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { HttpMethod, KeyValueRow, BodyState } from '../views/ApiTest/composables/useApiTester'

export interface ApiHistoryItem {
  id: string
  url: string
  method: HttpMethod
  queryParams: KeyValueRow[]
  headers: KeyValueRow[]
  body: BodyState
  timestamp: number
}

export const useApiHistoryStore = defineStore(
  'apiHistory',
  () => {
    const historyList = ref<ApiHistoryItem[]>([])

    const addHistory = (item: Omit<ApiHistoryItem, 'id' | 'timestamp'>) => {
      const newItem: ApiHistoryItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now()
      }
      // 头插法，保证最新的在前面
      historyList.value.unshift(newItem)
      // 最多保留 50 条历史记录
      if (historyList.value.length > 50) {
        historyList.value.pop()
      }
    }

    const clearHistory = () => {
      historyList.value = []
    }

    const removeHistory = (id: string) => {
      const idx = historyList.value.findIndex((item) => item.id === id)
      if (idx !== -1) {
        historyList.value.splice(idx, 1)
      }
    }

    return {
      historyList,
      addHistory,
      clearHistory,
      removeHistory
    }
  },
  {
    persist: true
  }
)
