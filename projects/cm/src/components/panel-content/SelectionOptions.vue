<template lang="pug">
div(class="editing-options w-full")
  div(class="grid grid-rows-1 grid-cols-[auto,minmax(0,1fr)] items-center mb-16 box-border pl-24 pr-8")
    span(class="typo-btn-sm text-white mr-12") {{ $t('CM0015') }}
    scrollable-container(:gap="20")
      svg-icon(
        v-for="shape in shapeTypes"
        :key="shape"
        iconColor="yellow-2"
        :iconName="shape"
        iconHeight="32px"
        :sameSize="false"
        @click="chooseSelectionOption(shape)")
  footer-bar(
    class="box-border px-24"
    :title="$t('CM0051')"
    @cancel="cancel"
    @apply="apply")
</template>
<script setup lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue'
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm'
import useSteps from '@/composable/useSteps'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import type { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import type { AllLayerTypes } from '@nu/vivi-lib/interfaces/layer'
import assetUtils from '@nu/vivi-lib/utils/assetUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'

const canvasStore = useCanvasStore()
const { steps, checkPointStep } = storeToRefs(canvasStore)
const { drawImageToCtx, setCheckPointStep } = useCanvasUtilsCm()
const editorStore = useEditorStore()
const { setCurrActiveFeature } = editorStore
const { currActiveFeature } = storeToRefs(editorStore)
const { goToCheckpoint, canvasRecord, setCheckpoint } = useSteps()
const shapeTypes = ['square', 'rectangle', 'circle', 'triangle', 'pentagon', 'hexagon']
const enableResizerTypes = ['square', 'rectangle']

const chooseSelectionOption = (icon: string) => {
  const src = require(`shape/${icon}.svg`)

  imageUtils.imgLoadHandler(src, async (img: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = img
    const photoAspectRatio = naturalWidth / naturalHeight

    nextTick(() => {
      const currLayer = layerUtils.getCurrLayer

      if (
        layerUtils.hasSelectedLayer &&
        currLayer.type === 'image' &&
        imageUtils.getSrcType(imageUtils.getSrc(currLayer)) === 'local-img'
      ) {
        const srcObj: SrcObj = {
          type: 'local-img',
          assetId: src,
          userId: '',
        }

        const srcSize = {
          width: currLayer.styles.width,
          height: currLayer.styles.height,
        }

        const targetSize = {
          width: currLayer.styles.width,
          height: currLayer.styles.width / photoAspectRatio,
        }

        layerUtils.updateLayerProps(0, layerUtils.currSelectedInfo.index, {
          srcObj,
          hideResizer: !enableResizerTypes.includes(icon),
        })

        layerUtils.updateLayerStyles(0, layerUtils.currSelectedInfo.index, {
          width: srcSize.width,
          height: targetSize.height,
          imgWidth: srcSize.width,
          imgHeight: targetSize.height,
          initWidth: srcSize.width,
          initHeight: targetSize.height,
          y: currLayer.styles.y + (srcSize.height - targetSize.height) / 2,
        })
      } else {
        groupUtils.deselect()
        assetUtils.addImage(src, photoAspectRatio, {
          styles: {
            opacity: 30,
            ctrlrPadding: 6,
          },
          record: true,
          hideResizer: !enableResizerTypes.includes(icon),
          ctrlUnmountCb: (pageIndex: number, layerIndex: number, config?: AllLayerTypes) => {
            if (config) {
              const target = document.querySelector(
                `[data-nu-image="nu-image-${config.id}"]`,
              ) as HTMLImageElement
              drawImageToCtx(target, {
                x: config.styles.x,
                y: config.styles.y,
                width: config.styles.width,
                height: config.styles.height,
                rotate: config.styles.rotate,
              })

              // prevent the record when click cancel button
              if (currActiveFeature.value === 'cm_brush') {
                canvasRecord()
              }

              layerUtils.deleteLayer(pageIndex, layerIndex)
            }
          },
        })
      }
    })
  })
}

const cancel = () => {
  setCurrActiveFeature('none')
  goToCheckpoint()
  groupUtils.deselect()
}

const apply = () => {
  setCurrActiveFeature('none')
  groupUtils.deselect()
  setCheckpoint(true)
}
</script>
<style lang="scss"></style>
