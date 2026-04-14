import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    const id = ref<number | null>(null)
    const username = ref<string>('')
    const avatar = ref<string>('')

    const setUser = (user: any) => {
      id.value = user.id
      username.value = user.username
      avatar.value = user.avatar
    }

    const logout = () => {
      id.value = null
      username.value = ''
      avatar.value = ''
    }

    return {
      id,
      username,
      avatar,
      setUser,
      logout
    }
  },
  {
    persist: true
  }
)
