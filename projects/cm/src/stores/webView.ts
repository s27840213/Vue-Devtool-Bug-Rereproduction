import { defineStore } from 'pinia'

export const useWebViewStore = defineStore('webView', () => {
  const isDuringCopy = ref(false)
  const setDuringCopy = (value: boolean) => {
    isDuringCopy.value = value
  }
  return { isDuringCopy, setDuringCopy }
})
