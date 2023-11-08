import { defineStore } from 'pinia'

export const useImgSelectorStore = defineStore('imgSelector', () => {
  const requireImgNum = ref(0)

  const setRequireImgNum = (value: number) => {
    console.log(value)
    requireImgNum.value = value
  }

  const showImgSelector = computed(() => requireImgNum.value > 0)

  return {
    requireImgNum,
    setRequireImgNum,
    showImgSelector,
  }
})
