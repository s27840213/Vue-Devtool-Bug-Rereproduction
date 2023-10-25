import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const userId = ref('')
  const setUserId = (id: string) => {
    userId.value = id
  }
  return { userId, setUserId }
})
