import { defineStore } from 'pinia'

export const useImgSelectorStore = defineStore('imgSelector', () => {
  const requireImgNum = ref(0)
  const replaceImgFlag = ref(false)
  const tabIndex = ref(0)

  const setRequireImgNum = (value: number, { replace = false } = {}) => {
    if (replace && value !== 1) {
      console.warn('Value should be 1 when replace is true.')
    }
    requireImgNum.value = value
    replaceImgFlag.value = replace
  }

  const showImgSelector = computed(() => requireImgNum.value > 0)

  return {
    tabIndex,
    requireImgNum,
    replaceImgFlag,
    showImgSelector,
    setRequireImgNum,
  }
})
