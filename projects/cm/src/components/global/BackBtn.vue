<template lang="pug">
router-link(
  custom
  :to="toTarget"
  v-slot="{ navigate }")
  cm-svg-icon(
    icon-color="app-icon-light"
    icon-name="arrow-left"
    icon-width="24px"
    @click="handleBackAction(() => navigate())")
</template>
<script setup lang="ts">
import useAssetPanelUtils from '@/composable/useAssetPanelUtils';
import useStateInfo from '@/composable/useStateInfo';
import { useEditorStore } from '@/stores/editor';
import { useImgSelectorStore } from '@/stores/imgSelector';
import { useModalStore } from '@/stores/modal';
import useI18n from '@nu/vivi-lib/i18n/useI18n';
import { storeToRefs } from 'pinia';
import { useStore } from 'vuex';

/**
 * @Note - how to use this component?
 * You have two options
 * 1. use toTarget props to determine the target route
 * 2. use customCallback to do your own callback
 *
 * Precedence: customCallback > toTarget
 */

const { toTarget, customCallback } = withDefaults(
  defineProps<{ toTarget?: string; customCallback?: () => void }>(),
  {
    toTarget: '/',
  },
)
const { isEditing, atSettings, showAssetPanel, setAssetPanelType, assetPanelType } = useStateInfo()

// #region modal
const modalStore = useModalStore()
const { closeModal, openModal, setNormalModalInfo } = modalStore
// #endregion

// #region img selector
const imgSelectorStore = useImgSelectorStore()
const { setShowImgSelector } = imgSelectorStore
const { showImgSelector } = storeToRefs(imgSelectorStore)
// #endregion

// #region editor
const editorStore = useEditorStore()
const {setShowGenResult} = editorStore
const { showGenResult } = storeToRefs(editorStore)
// #endregion

const { isInCategory } = useAssetPanelUtils()

const store = useStore()

const { t } = useI18n()

const handleBackAction = (navagate: () => void) => {
  if (customCallback) {
    customCallback()
    return
  }

  if(showGenResult.value) {
    setShowGenResult(false)
    return
  }

  if (showImgSelector.value) {
    setShowImgSelector(false)
    return
  }

  if (showAssetPanel.value) {
    if (isInCategory.value) {
      store.commit('assetPanel/SET_isInCategory', { tab: assetPanelType.value, bool: false })
      store.commit('assetPanel/SET_showAllRecently', { tab: assetPanelType.value, bool: false })
      switch (assetPanelType.value) {
        case 'object':
          store.dispatch('objects/resetSearch', { resetCategoryInfo: true })
          store.dispatch('objects/resetFavoritesSearch')
          store.dispatch('giphy/resetCategoryContent')
          store.dispatch('giphy/resetTagContent')
          store.commit('assetPanel/SET_showAllRecently', { tab: 'giphy', bool: false })
          break
        case 'text':
          store.dispatch('textStock/resetSearch', { resetCategoryInfo: true })
          break
      }
      return
    }
    setAssetPanelType('none')
    return
  }

  if (isEditing.value) {
    setNormalModalInfo({
      title: t('CM0025'),
      content: t('CM0026'),
      confirmText: t('CM0027'),
      cancelText: t('CM0028'),
      confirm: () => {
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
