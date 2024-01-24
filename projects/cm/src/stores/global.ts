import vuex from '@/vuex'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => {
  const debugMode = ref(false)

  const prevScreenshotUrl = ref('')
  let prevScreenshotUrlTimerId = -1

  cmWVUtils.detectIfInApp()
  cmWVUtils.getState('debugMode').then((data) => {
    debugMode.value = data?.debugMode ?? false // if debugMode not written before, set to false
    vuex.commit('cmWV/SET_debugMode', data.debugMode)
  })

  const setDebugMode = (value: boolean) => {
    debugMode.value = value
    cmWVUtils.setState('debugMode', { debugMode: debugMode.value })
    vuex.commit('cmWV/SET_debugMode', value)
  }

  const setPrevScreenshotUrl = (url: string) => {
    prevScreenshotUrl.value = url
    if (prevScreenshotUrlTimerId !== -1) {
      window.clearTimeout(prevScreenshotUrlTimerId)
    }

    prevScreenshotUrlTimerId = window.setTimeout(() => {
      prevScreenshotUrl.value = ''
    }, 3000)
  }

  return {
    debugMode,
    prevScreenshotUrl,
    setDebugMode,
    setPrevScreenshotUrl,
  }
})
