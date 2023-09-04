<template lang="pug">
router-link(
  custom
  to="/"
  v-slot="{ navigate }")
  nu-svg-icon(
    icon-color="app-icon-light"
    icon-name="arrow-left"
    icon-width="24px"
    @click="handleBackAction(() => navigate())")
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'
import { useModalStore } from '@/stores/modal'
import { storeToRefs } from 'pinia'

const { showPromptArea, showEditingOpstions } = useStateInfo()

// #region modal
const modalStore = useModalStore()
const { closeModal, openModal, setNormalModalInfo } = modalStore
const { isModalOpen } = storeToRefs(modalStore)
// #endregion

const { t } = useI18n()

const handleBackAction = (navagate: () => void) => {
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
