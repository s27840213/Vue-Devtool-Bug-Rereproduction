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
import useStateInfo from '@/composable/useStateInfo'
import { useImgSelectorStore } from '@/stores/imgSelector'
import { useModalStore } from '@/stores/modal'
import { storeToRefs } from 'pinia'

const { toTarget, customCallback } = withDefaults(
  defineProps<{ toTarget?: string; customCallback?: () => void }>(),
  {
    toTarget: '/',
  },
)
const { showPromptArea, showEditingOpstions, atSettings } = useStateInfo()

// #region modal
const modalStore = useModalStore()
const { closeModal, openModal, setNormalModalInfo } = modalStore
// #endregion

// #region img selector
const imgSelectorStore = useImgSelectorStore()
const { setShowImgSelector } = imgSelectorStore
const { showImgSelector } = storeToRefs(imgSelectorStore)
// #endregion

const { t } = useI18n()

const handleBackAction = (navagate: () => void) => {
  if (customCallback) {
    customCallback()
    return
  }
  if (showImgSelector.value) {
    setShowImgSelector(false)
    return
  }

  if (showEditingOpstions.value || showPromptArea.value) {
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
