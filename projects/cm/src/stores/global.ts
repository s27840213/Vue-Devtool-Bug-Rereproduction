import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => {
  const debugMode = ref(false)

  cmWVUtils.getState('debugMode').then((data) => {
    debugMode.value = data.debugMode
  })

  const setDebugMode = (value: boolean) => {
    debugMode.value = value
    cmWVUtils.setState('debugMode', { debugMode: debugMode.value })
  }

  return {
    debugMode,
    setDebugMode,
  }
})
