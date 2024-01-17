import { defineStore } from 'pinia'

export const useMediaStore = defineStore('media', () => {
  const mediaParams = reactive({
    action: 'save',
    media: 'photo'
  })

  const setMediaParams = (params: any) => {
    Object.assign(mediaParams, params)
  }

  const inMediaOptions = ref(false)

  const setInMediaOptions = (value: boolean) => {
    inMediaOptions.value = value
  }

  return { mediaParams, setMediaParams, inMediaOptions, setInMediaOptions }
})
