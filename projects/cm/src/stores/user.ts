import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const userId = ref('')
  const setUserId = (id: string) => {
    userId.value = id
  }
  const prevGenParams = reactive({
    requestId: '',
    prompt: '',
  })

  const setPrevGenParams = (params: { requestId: string; prompt: string }) => {
    Object.assign(prevGenParams, params)
  }
  return { userId, prevGenParams, setUserId, setPrevGenParams }
})
