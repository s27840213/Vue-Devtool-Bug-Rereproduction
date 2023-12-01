<template lang="pug">
div(class="w-full box-border pl-24")
  div(class="typo-btn-lg text-app-text-secondary") {{ $t('CM0013') }}
  scrollable-container(:px="0")
    div(
      v-for="aspectRatio in aspectRatioTypes"
      :key="aspectRatio"
      class="w-56 flex flex-col justify-center items-center gap-4"
      @click="selectAspectRatio(aspectRatio)")
      svg-icon(
        :iconColor="selectedType === aspectRatio ? 'primary-light-active' : aspectRatio === 'original' ? 'app-text-secondary' : 'transparent'"
        :strokeColor="aspectRatio === 'original' ? undefined : selectedType === aspectRatio ? 'app-tab-active' : 'app-text-secondary'"
        iconWidth="32px"
        iconHeight="32px"
        :iconName="'ratio-' + aspectRatio.replace(':', '-')")
      span(
        class="typo-btn-sm transition-colors duration-300 capitalize"
        :class="selectedType === aspectRatio ? 'text-app-tab-active' : 'text-app-tab-default'") {{ aspectRatio }}
</template>
<script setup lang="ts">
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm'
import { useEditorStore } from '@/stores/editor'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { storeToRefs } from 'pinia'
const editorStore = useEditorStore()
const { imgAspectRatio, pageAspectRatio, pageSize } = storeToRefs(editorStore)
const { updateCanvasSize } = useCanvasUtilsCm()

const aspectRatioTypes = ['9:16', 'original', '16:9', '1:1', '2:3', '3:2', '4:5', '5:4']
const selectedType = ref('9:16')

const bus = useEventBus('editor')

const updateEditingSectionSize = (width: number, height: number) => {
  pageUtils.setPageSize(0, width, height)
  updateCanvasSize()
}

const selectAspectRatio = (type: string) => {
  selectedType.value = type

  if (type === 'original') {
    if (imgAspectRatio.value > 1) {
      updateEditingSectionSize(1600, 1600 / imgAspectRatio.value)
    } else {
      updateEditingSectionSize(1600 * imgAspectRatio.value, 1600)
      layerUtils.updateLayerStyles(0, 0, {
        width: 1600 * imgAspectRatio.value,
        height: 1600,
      })
    }
  } else {
    const [w, h] = type.split(':')
    const width = parseInt(w)
    const height = parseInt(h)
    const pageAspectRatio = width / height

    if (pageAspectRatio >= 1) {
      updateEditingSectionSize(1600, (1600 * height) / width)
    } else {
      updateEditingSectionSize((1600 * width) / height, 1600)
    }
  }

  bus.emit('fitPage', {})
  updateLayerStyleToFitPage()

  /**
   * @Note - width > height -> aspectRatio > 1
   * We have inner content and outer content
   * if inner content's aspectRatio > outer content's aspectRatio -> fit inner content's width
   * means the innter content and outer content's width are the same
   *
   * else fit inner content's height, and the inner content and outer content's height are the same
   *
   */
}

const updateLayerStyleToFitPage = () => {
  if (imgAspectRatio.value > pageAspectRatio.value) {
    layerUtils.updateLayerStyles(0, 0, {
      width: pageSize.value.width,
      height: pageSize.value.width / imgAspectRatio.value,
      imgWidth: pageSize.value.width,
      imgHeight: pageSize.value.width / imgAspectRatio.value,
      initWidth: pageSize.value.width,
      initHeight: pageSize.value.width / imgAspectRatio.value,
      // to page center
      x: (pageSize.value.width - pageSize.value.width) / 2,
      y: (pageSize.value.height - pageSize.value.width / imgAspectRatio.value) / 2,
    })
  } else {
    layerUtils.updateLayerStyles(0, 0, {
      width: pageSize.value.height * imgAspectRatio.value,
      height: pageSize.value.height,
      imgWidth: pageSize.value.height * imgAspectRatio.value,
      imgHeight: pageSize.value.height,
      initWidth: pageSize.value.height * imgAspectRatio.value,
      initHeight: pageSize.value.height,
      // to page center
      x: (pageSize.value.width - pageSize.value.height * imgAspectRatio.value) / 2,
      y: (pageSize.value.height - pageSize.value.height) / 2,
    })
  }
}

onMounted(() => {
  editorUtils.setDisableLayerAction(true)
})
onBeforeUnmount(() => {
  editorUtils.setDisableLayerAction(false)
})
</script>
<style lang="scss"></style>
