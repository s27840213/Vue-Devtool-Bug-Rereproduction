<template lang="pug">
div(class="editing-options w-full flex flex-col items-center gap-16")
  slide-toggle(
    :options="modes"
    v-model="currMode"
    :bgColor="'black-3-5'"
    :switchColor="'yellow-1'"
    :activeColor="'black-2'"
    :inActiveColor="'white'"
    :optionWidth="'80px'"
    :optionHeight="'32px'"
    textSize="caption-SM")
  div(class="w-full box-border px-24")
    props-slider(
      :title="`${$t('NN0815')}`"
      :borderTouchArea="true"
      :name="'brushSize'"
      :value="brushSize"
      :min="1"
      :max="500"
      :showSizeNum="false"
      @update="setBrushSize"
      @pointer-down="setIsChangingBrushSize(true)"
      @pointer-up="setIsChangingBrushSize(false)")
  footer-bar(
    class="w-full box-border px-24"
    :title="$t('CM0017')"
    :disableBtns="disableBtns"
    @cancel="cancel"
    @apply="apply")
</template>
<script setup lang="ts">
import FooterBar from '@/components/panel-content/FooterBar.vue'
import useSteps from '@/composable/useSteps'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import type { PowerfulFillCanvasMode } from '@/types/editor'
import SlideToggle from '@nu/vivi-lib/components/global/SlideToggle.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import type { SrcObj } from '@nu/vivi-lib/interfaces/gallery'
import type { IImageStyle } from '@nu/vivi-lib/interfaces/layer'
import store from '@nu/vivi-lib/store'
import bgRemoveUtils from '@nu/vivi-lib/utils/bgRemoveUtils'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import PagePinchUtils from '@nu/vivi-lib/utils/pagePinchUtils'
import stepsUtils from '@nu/vivi-lib/utils/stepsUtils'
import { storeToRefs } from 'pinia'

enum ControlMode {
  Brush = 'brush',
  Erase = 'erase',
  Move = 'move',
}

const { t } = useI18n()
const { saveDesignImageToDocument } = useUserStore()

// #region canvas related
const modes = [
  {
    label: t('CM0017'),
    value: ControlMode.Brush as string,
  },
  {
    label: t('CM0018'),
    value: ControlMode.Erase as string,
  },
  {
    label: t('CM0020'),
    value: ControlMode.Move as string,
  },
]

// const currMode = ref<PowerfulFillCanvasMode>(ControlMode.Brush as PowerfulFillCanvasMode)
const currMode = computed({
  get() {
    if (inBgRemoveMode.value) {
      return movingMode.value
        ? ControlMode.Move
        : clearMode.value
        ? ControlMode.Erase
        : ControlMode.Brush
    } else {
      return canvasMode.value
    }
  },
  set(newVal: PowerfulFillCanvasMode) {
    if (inBgRemoveMode.value) {
      if (newVal === ControlMode.Move) {
        setMovingMode(true)
      } else {
        setMovingMode(false)
        setClearMode(newVal === ControlMode.Erase)
      }
    } else {
      setCanvasMode(newVal)
    }
  },
})
// #region charmix mask canvas related
const canvasStore = useCanvasStore()
const {
  setBrushSize: setMaskBrushSize,
  setIsChangingBrushSize: setIsChangingMaskBrushSize,
  setCanvasMode,
} = canvasStore
const { brushSize: maskBrushSize, canvasMode } = storeToRefs(canvasStore)

const { goToCheckpoint } = useSteps()

const editorStore = useEditorStore()
const { setCurrActiveFeature } = editorStore
const { editorType, currDesignId } = storeToRefs(editorStore)
// #endregion

// #region bg remove canvas related
const inBgRemoveMode = computed(() => store.getters['bgRemove/getInBgRemoveMode'])
const isProcessing = computed(() => store.getters['bgRemove/getIsProcessing'])
const clearMode = computed(() => store.getters['bgRemove/getClearMode'])
const movingMode = computed(() => store.getters['bgRemove/getMovingMode'])
const bgRemoveBrushSize = computed(() => store.getters['bgRemove/getBrushSize'])

const setClearMode = (isClearMode: boolean) => {
  store.commit('bgRemove/SET_clearMode', isClearMode)
}

const setMovingMode = (isMovingMode: boolean) => {
  store.commit('bgRemove/SET_movingMode', isMovingMode)
}
const setInBgRemoveMode = (isInBgRemoveMode: boolean) => {
  store.commit('bgRemove/SET_inBgRemoveMode', isInBgRemoveMode)
}

const setBgRemoveBrushSize = (newVal: number) => {
  store.commit('bgRemove/SET_brushSize', newVal)
}
// #endregion

const brushSize = computed(() => {
  if (inBgRemoveMode.value) {
    return bgRemoveBrushSize.value
  }
  return maskBrushSize.value
})

const disableBtns = computed(() => {
  return isProcessing.value
})

watch(
  isProcessing,
  (newVal) => {
    if (newVal) {
      currMode.value = ControlMode.Erase
    }
  },
  { immediate: true },
)

const setBrushSize = (newVal: number) => {
  if (inBgRemoveMode.value) {
    setBgRemoveBrushSize(newVal)
  } else {
    setMaskBrushSize(newVal)
  }
}

const setIsChangingBrushSize = (isChangingBrushSize: boolean) => {
  if (inBgRemoveMode.value) {
    store.commit('bgRemove/SET_isChangingBrushSize', isChangingBrushSize)
  } else {
    setIsChangingMaskBrushSize(isChangingBrushSize)
  }
}
// #endregion

const cancel = () => {
  if (inBgRemoveMode.value) {
    setInBgRemoveMode(false)
    setCurrActiveFeature('none')
    editorUtils.setCurrActivePanel('none')

    return
  }

  setCurrActiveFeature('none')
  goToCheckpoint()
  groupUtils.deselect()
}

const apply = async () => {
  if (inBgRemoveMode.value) {
    const { index, pageIndex, layers } = layerUtils.currSelectedInfo
    const targetLayerStyle = layers[0].styles as IImageStyle
    const { src, trimmedCanvasInfo } = bgRemoveUtils.exportCanvasResultInfo(targetLayerStyle)

    const bgRemoveAssetId = generalUtils.generateAssetId()
    await saveDesignImageToDocument(src, bgRemoveAssetId, {
      subDesignId: 'bgRemove',
      thumbIndex: index,
      type: 'png',
    })

    const assetId = `mydesign-${editorType.value}/${currDesignId.value}/bgRemove/${bgRemoveAssetId}`
    const srcObj: SrcObj = {
      type: 'ios',
      assetId,
      userId: 'png',
    }

    const { remainingHeightPercentage, remainingWidthPercentage, xShift, yShift } =
      trimmedCanvasInfo
    // const { width, height } = targetLayerStyle
    const newImageWidth = targetLayerStyle.width * remainingWidthPercentage
    const newImageHeight = targetLayerStyle.height * remainingHeightPercentage
    layerUtils.updateLayerStyles(pageIndex, index, {
      x: targetLayerStyle.x + xShift,
      y: targetLayerStyle.y + yShift,
      width: newImageWidth,
      height: newImageHeight,
      imgWidth: newImageWidth,
      imgHeight: newImageHeight,
      imgX: 0,
      imgY: 0,
    })
    layerUtils.updateLayerProps(pageIndex, index, {
      srcObj,
    })

    setInBgRemoveMode(false)
    stepsUtils.record()
  }
  setCurrActiveFeature('none')
  PagePinchUtils.resetPageScale()
  groupUtils.deselect()
}

onMounted(async () => {
  if (inBgRemoveMode.value) return
  const brushSize = await cmWVUtils.getState('brushSize')
  if (brushSize !== undefined) {
    setMaskBrushSize(brushSize.brushSize)
  }
})

onUnmounted(() => {
  setCanvasMode(ControlMode.Brush as PowerfulFillCanvasMode)
})
</script>
<style lang="scss"></style>
