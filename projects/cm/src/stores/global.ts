import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => {
  const debugMode = ref(true)
  const showSpinner = ref(false)
  const spinnerText = ref('')
  const setDebugMode = (value: boolean) => {
    debugMode.value = value
  }

  const setShowSpinner = (value: boolean) => {
    showSpinner.value = value
  }

  const setSpinnerText = (text: string) => {
    spinnerText.value = text
  }
  return {
    debugMode,
    showSpinner,
    spinnerText,
    setDebugMode,
    setShowSpinner,
    setSpinnerText,
  }
})
