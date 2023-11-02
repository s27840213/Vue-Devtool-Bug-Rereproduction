<template lang="pug">
div(class="editing-options w-full")
  div(
    class="grid grid-rows-1 grid-cols-[auto,minmax(0,1fr)] items-center mb-16 pl-24 pr-8")
    span(class="typo-btn-sm text-app-text-secondary mr-12") {{ $t('CM0015') }}
    scrollable-container(:gap="20")
      cm-svg-icon(
        v-for="shape in shapeTypes"
        :key="shape"
        icon-color="primary-light-active"
        :icon-name="shape"
        icon-height="32px"
        :same-size="false"
        @click="chooseSelectionOption(shape)")
</template>
<script setup lang="ts">
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm';
import { useCanvasStore } from '@/stores/canvas';
import assetUtils from '@nu/vivi-lib/utils/assetUtils';
import imageUtils from '@nu/vivi-lib/utils/imageUtils';
import layerUtils from '@nu/vivi-lib/utils/layerUtils';

const canvasStore = useCanvasStore()
const {canvasCtx} = storeToRefs(canvasStore)
const { drawImageToCtx } = useCanvasUtilsCm()

const shapeTypes = ['square', 'rectangle', 'circle', 'triangle', 'pentagon', 'hexagon']

const chooseSelectionOption = (icon: string) => {
  const src = require(`shape/${icon}.svg`)

  imageUtils.imgLoadHandler(src, async (img: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = img
    const photoAspectRatio = naturalWidth / naturalHeight

    nextTick(() => {
      assetUtils.addImage(src, photoAspectRatio, {
        styles: {
          opacity: 30,
        },
        hideResizer: true,
        ctrlUnmountCb: (pageIndex: number, layerIndex: number, config?: any ) => {
          const target = document.querySelector(`[data-nu-image="nu-image-${config.id}"]`) as HTMLImageElement
          drawImageToCtx(target, {
            x: config.styles.x,
            y: config.styles.y,
            width: config.styles.width,
            height: config.styles.height,
            rotate: config.styles.rotate,
          })

          layerUtils.deleteLayer(pageIndex, layerIndex)
        },
      })
    })
  })
}
</script>
<style lang="scss"></style>
