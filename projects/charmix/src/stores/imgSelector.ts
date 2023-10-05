import { defineStore } from 'pinia'

export const useImgSelectorStore = defineStore('imgSelector', () => {
  const showImgSelector = ref(true)

  const setShowImgSelector = (value: boolean) => {
    showImgSelector.value = value
  }

  return {
    showImgSelector,
    setShowImgSelector,
  }
})
