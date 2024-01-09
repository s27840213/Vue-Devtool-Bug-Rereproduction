import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => {
  const debugMode = ref(false)
  const setDebugMode = (value: boolean) => {
    debugMode.value = value
  }

  return {
    debugMode,
    setDebugMode,
  }
})
