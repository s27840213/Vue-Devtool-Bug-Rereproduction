import { EditorType } from '@/types/editor'
import { defineStore } from 'pinia'

export const useImgSelectorStore = defineStore('imgSelector', () => {
  const tabIndex = ref(0)
  const requireImgNum = ref(0)
  const replaceImgFlag = ref(false)
  const _targetEditorType = ref(null) as Ref<EditorType | null>

  const openImgSelecotr = ({ replace = false, targetEditorType }: { replace?: boolean; targetEditorType?: EditorType } = {}) => {
    requireImgNum.value = 
      targetEditorType === 'magic-combined' ? 2 : 1
    replaceImgFlag.value = replace
    if (targetEditorType) _targetEditorType.value = targetEditorType
  }

  const closeImageSelector = () => {
    requireImgNum.value = 0
    replaceImgFlag.value = false
    _targetEditorType.value = null
  }

  const showImgSelector = computed(() => requireImgNum.value > 0)

  return {
    tabIndex,
    requireImgNum,
    replaceImgFlag,
    targetEditorType: _targetEditorType,
    showImgSelector,
    openImgSelecotr,
    closeImageSelector
  }
})
