import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => {
  const debugMode = ref(true)
  const setDebugMode = (value: boolean) => {
    debugMode.value = value
  }
  const standaloneMode = ref(false)
  const setStandaloneMode = (value: boolean) => {
    standaloneMode.value = value
  }
  return {
    debugMode,
    setDebugMode,
    standaloneMode,
    setStandaloneMode,
  }
})
