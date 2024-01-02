<template lang="pug">
footer-bar(
  class="footer-options px-24 pt-8"
  :title="t('CM0053')"
  @cancel="handleCancel"
  @apply="handleApply")
</template>

<script setup lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue'
import useSteps from '@/composable/useSteps'
import { useEditorStore } from '@/stores/editor'
import vuex from '@/vuex'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import resizeUtils from '@nu/vivi-lib/utils/resizeUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'

const { t } = useI18n()

const editorStore = useEditorStore()
const { updateMaskParams } = editorStore
const { canvasRecord } = useSteps()

const handleCancel = () => {
  const initSize = vuex.state.canvasResize.initSize
  pageUtils.updatePageProps(initSize)
  vuex.commit('canvasResize/UPDATE_reset')
  vuex.commit('canvasResize/SET_isResizing', false)
}

const handleApply = () => {
  const initSize = vuex.state.canvasResize.initSize
  const layerOffset = vuex.state.canvasResize.layerOffset
  layerUtils.applyLayerOffset(layerOffset)
  const { pageIndex, getCurrPage: page } = layerUtils
  const longerSide = Math.max(page.width, page.height)
  let ratio = 1
  if (longerSide > 1600) {
    ratio = 1600 / longerSide
    resizeUtils.resizePage(pageIndex, page, {
      width: page.width * ratio,
      height: page.height * ratio,
    })
  }
  updateMaskParams({
    x: layerOffset.x * ratio,
    y: layerOffset.y * ratio,
    width: initSize.width * ratio,
    height: initSize.height * ratio,
  })
  vuex.commit('canvasResize/UPDATE_reset')
  vuex.commit('canvasResize/SET_isResizing', false)
  stepsUtils.record()
}
</script>
