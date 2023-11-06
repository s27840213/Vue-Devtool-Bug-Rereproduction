import { defineStore } from 'pinia'

export const useImgSelectorStore = defineStore('imgSelector', () => {
  const showImgSelector = ref(0)

  const setShowImgSelector = (value: number) => {
    showImgSelector.value = value
  }

  return {
    showImgSelector,
    setShowImgSelector,
  }
})
