<template lang="pug">
footer-bar(class="footer-options px-24 pt-8"
          :title="t('CM0053')"
          @cancel="handleCancel"
          @apply="handleApply")
</template>

<script setup lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue';
import { useEditorStore } from '@/stores/editor';
import vuex from '@/vuex';
import useI18n from '@nu/vivi-lib/i18n/useI18n';
import layerUtils from '@nu/vivi-lib/utils/layerUtils';
import pageUtils from '@nu/vivi-lib/utils/pageUtils';

const { t } = useI18n()

const editorStore = useEditorStore()
const { setIsResizingCanvas } = editorStore

const handleCancel = () => {
  const initSize = vuex.getters['canvasResize/getInitSize']
  pageUtils.updatePageProps(initSize)
  vuex.commit('canvasResize/UPDATE_reset')
  setIsResizingCanvas(false)
}

const handleApply = () => {
  const layerOffset = vuex.getters['canvasResize/getLayerOffset']
  layerUtils.applyLayerOffset(layerOffset)
  vuex.commit('canvasResize/UPDATE_reset')
  setIsResizingCanvas(false)
}
</script>
