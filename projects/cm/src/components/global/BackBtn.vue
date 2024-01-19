<template lang="pug">
router-link(
  custom
  :to="toTarget"
  v-slot="{ navigate }")
  svg-icon(
    iconColor="yellow-0"
    iconName="cm_arrow-left"
    iconWidth="24px"
    @click="handleBackAction(() => navigate())")
</template>
<script setup lang="ts">
import useSteps from '@/composable/useSteps'
import { useEditorStore } from '@/stores/editor'
import { useImgSelectorStore } from '@/stores/imgSelector'
import { useModalStore } from '@/stores/modal'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import { storeToRefs } from 'pinia'
import { toRefs } from 'vue'
import { useStore } from 'vuex'

/**
 * @Note - how to use this component?
 * You have two options
 * 1. use toTarget props to determine the target route
 * 2. use customCallback to do your own callback
 *
 * Precedence: customCallback > toTarget
 */

const props = withDefaults(defineProps<{ toTarget?: string; customCallback?: () => void }>(), {
  toTarget: '/',
})
const { toTarget, customCallback } = toRefs(props)

// #region modal
const modalStore = useModalStore()
const { closeModal, openModal, setNormalModalInfo } = modalStore
// #endregion

// #region img selector
const imgSelectorStore = useImgSelectorStore()
const { closeImageSelector } = imgSelectorStore
const { showImgSelector } = storeToRefs(imgSelectorStore)
// #endregion

// #region editor
const editorStore = useEditorStore()
const { changeEditorState, changeToSpecificEditorState } = editorStore
const {
  inGenResultState,
  inSavingState,
  hasGeneratedResults,
  currDesignId,
  prevState,
  myDesignSavedRoot,
} = storeToRefs(editorStore)
const { hasUnsavedChanges } = useSteps()
// #endregion

const store = useStore()

const { t } = useI18n()

const handleBackAction = (navagate: () => void) => {
  if (customCallback?.value) {
    customCallback.value()
    return
  }

  if (inSavingState.value) {
    changeToSpecificEditorState(prevState.value)
    return
  }

  if (inGenResultState.value) {
    changeEditorState('prev')
    return
  }

  if (showImgSelector.value) {
    closeImageSelector()
    return
  }

  if (assetPanelUtils.currActiveTab !== 'none') {
    if (assetPanelUtils.currIsInCategory) {
      assetPanelUtils.setCurrIsInCategory(false)
      assetPanelUtils.setCurrShowAllRecently(false)
      switch (assetPanelUtils.currActiveTab) {
        case 'object':
          store.dispatch('objects/resetSearch', { resetCategoryInfo: true })
          store.dispatch('objects/resetFavoritesSearch')
          break
        case 'text':
          store.dispatch('textStock/resetSearch', { resetCategoryInfo: true })
          break
      }
      return
    }
    assetPanelUtils.setCurrActiveTab('none')
    return
  }

  if (hasUnsavedChanges.value) {
    setNormalModalInfo({
      title: t('CM0025'),
      content: t('CM0026'),
      confirmText: t('CM0028'),
      cancelText: t('NN0203'),
      confirm: () => {
        // if we used bg remove, we need to delete the asset, or it will cause memory leak
        if (!hasGeneratedResults.value) {
          cmWVUtils.deleteAsset(myDesignSavedRoot.value, `${currDesignId.value}`, undefined, false)
        }
        navagate()
        closeModal()
      },
      cancel: () => {
        closeModal()
      },
    })

    openModal()
  } else {
    navagate()
  }
}
</script>
<style lang="scss"></style>
