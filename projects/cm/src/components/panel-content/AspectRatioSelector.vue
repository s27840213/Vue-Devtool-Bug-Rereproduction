<template lang="pug">
div(class='aspect-ratio-selector grid gap-16')
  div(class="typo-btn-lg text-white") {{ $t('CM0013') }}
  scrollable-container(:px="24" :py="0" :gap="10" class="mx-auto w-fit max-w-screen box-border")
    div(
      v-for="asp in aspectRatioTypes"
      :key="asp.val"
      class="w-56 flex-center flex-col gap-4"
      @click="selectAspectRatio(asp.val)")
      svg-icon(
        :iconColor="selectedType === asp.val ? 'yellow-2' : asp.val === 'original' ? 'white' : 'transparent'"
        :strokeColor="asp.val === 'original' ? undefined : selectedType === asp.val ? 'yellow-cm' : 'white'"
        iconWidth="32px"
        iconHeight="32px"
        :iconName="'ratio-' + asp.val.replace(':', '-')")
      span(
        class="typo-btn-sm transition-colors duration-300 capitalize"
        :class="selectedType === asp.val ? 'text-yellow-cm' : 'text-yellow-0'") {{ asp.label }}
  div(class="w-full box-border px-24")
    nubtn(
      size="mid-full"
      @click="handleNextAction") {{ $t('CM0012') }}
</template>

<script setup lang="ts">
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm'
import useTutorial from '@/composable/useTutorial'
import i18n from '@/i18n'
import { useEditorStore } from '@/stores/editor'
import type { IImage } from '@nu/vivi-lib/interfaces/layer'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mathUtils from '@nu/vivi-lib/utils/mathUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { storeToRefs } from 'pinia'

const editorStore = useEditorStore()
const { imgAspectRatio, pageSize, editorType } = storeToRefs(editorStore)
const { updateCanvasSize } = useCanvasUtilsCm()

const _aspectRatioTypes = 
  ['9:16', 'original', '16:9', '1:1', '2:3', '3:2', '4:5', '5:4']
    .map(asp => ({ label: asp, val: asp }))
const aspectRatioTypes = computed(() => {
  switch (editorType.value) {
    case 'magic-combined':
      return [
        { val: '9:16', label: i18n.global.t('CM0129') },
        { val: '16:9', label: i18n.global.t('CM0130') }
      ]
    case 'hidden-message':
      return _aspectRatioTypes.filter(asp => asp.val !== 'original')
    default:
      return _aspectRatioTypes
  }
})
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
  if (!layerUtils.getCurrPage.layers.length) return

  if (editorType.value === 'magic-combined') {
    const imgs = [
      layerUtils.getLayer(0, 0), layerUtils.getLayer(0, 1)
    ] as IImage[]
    const portrait = selectedType.value === '9:16'

    const commonStyles = { ...pageSize.value }
    commonStyles[portrait ? 'height' : 'width'] /= 3 // Img occupy 1/3 editor.

    imgs.forEach((img, i) => {
      const { width: imgWidth, height: imgHeight, x: imgX, y: imgY }
        = mathUtils.calcFit('cover', {
        width: img.styles.initWidth,
        height: img.styles.initHeight,
      }, commonStyles)

      layerUtils.updateLayerStyles(0, i, {
        ...commonStyles,
        imgWidth,
        imgHeight,
        initWidth: imgWidth,
        initHeight: imgHeight,
        imgX,
        imgY,
        x: i === 1 && !portrait ? pageSize.value.width * (2 / 3) : 0,
        y: i === 1 && portrait ? pageSize.value.height * (2 / 3) : 0,
      })
    })
    return
  }

  // For other editor types.
  const img = layerUtils.getLayer(0, 0) as IImage
  const { width, height } = mathUtils.calcFit('contain', {
    width: img.styles.initWidth,
    height: img.styles.initHeight,
  }, pageSize.value)
  layerUtils.updateLayerStyles(0, 0, {
    width,
    height,
    imgWidth: width,
    imgHeight: height,
    initWidth: width,
    initHeight: height,
    // to page center
    x: (pageSize.value.width - width) / 2,
    y: (pageSize.value.height - height) / 2,
  })
}

const handleNextAction = function () { 
  editorStore.changeEditorState('next')
  useTutorial().runTutorial(editorType.value)
}

onMounted(() => {
  editorUtils.setDisableLayerAction('all')
  if (editorType.value === 'magic-combined') {
    // Init img position.
    updateLayerStyleToFitPage()
  }
})
onBeforeUnmount(() => {
  if (editorType.value === 'magic-combined') {
    editorUtils.setDisableLayerAction('moving')
  } else {
    editorUtils.setDisableLayerAction('')
  }
})
</script>
<style lang="scss"></style>
