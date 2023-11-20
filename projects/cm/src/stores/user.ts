import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const prevGenParams = reactive({
    requestId: '',
    prompt: '',
  })

  const setPrevGenParams = (params: { requestId: string; prompt: string }) => {
    Object.assign(prevGenParams, params)
  }
  return { prevGenParams, setPrevGenParams }
})
