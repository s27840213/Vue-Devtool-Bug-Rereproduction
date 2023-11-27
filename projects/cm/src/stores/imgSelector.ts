import { EditorType } from '@/types/editor'
import { defineStore } from 'pinia'

export const useImgSelectorStore = defineStore('imgSelector', () => {
  const tabIndex = ref(0)
  const _requireImgNum = ref(0)
  const replaceImgFlag = ref(false)
  const _targetEditorType = ref(null) as Ref<EditorType | null>

  const openImgSelecotr = ({ requireImgNum = 1, replace = false, targetEditorType }: { requireImgNum?: number, replace?: boolean; targetEditorType?: EditorType } = {}) => {
    requireImgNum = Math.max(requireImgNum, 1)
    if (replace && requireImgNum !== 1) {
      console.warn('requireImgNum should be 1 when replace is true.')
    }
    _requireImgNum.value = requireImgNum
    replaceImgFlag.value = replace
    if (targetEditorType) _targetEditorType.value = targetEditorType
  }

  const closeImageSelector = () => {
    _requireImgNum.value = 0
    replaceImgFlag.value = false
    tabIndex.value = 0
    _targetEditorType.value = null
  }

  const showImgSelector = computed(() => _requireImgNum.value > 0)

  return {
    tabIndex,
    requireImgNum: _requireImgNum,
    replaceImgFlag,
    targetEditorType: _targetEditorType,
    showImgSelector,
    openImgSelecotr,
    closeImageSelector
  }
})
