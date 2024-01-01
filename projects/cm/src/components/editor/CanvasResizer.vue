<template lang="pug">
div(ref="containerRef" class="canvas-resizer overflow-hidden relative select-none")
  page-content(
    class="absolute top-half left-half -translate-x-half -translate-y-half select-none"
    :config="pageState.config"
    :pageIndex="pageIndex"
    :contentScaleRatio="contentScaleRatio"
    :noBg="noBg")
  div(
    class="absolute top-half left-half -translate-x-half -translate-y-half select-none"
    :style="{ ...sizeStyles }"
    @touchstart.prevent)
    div(
      v-for="controller in controllers"
      :key="controller.key"
      class="absolute select-none"
      :class="controller.color"
      :style="controller.styles"
      @touchstart.prevent
      @pointerdown.prevent.stop="resizeStart($event, controller.params)")
  //- The following points are for resizing logic debugging, don't delete them!
  //- div(
  //-   class="fixed rounded-[50%] w-8 h-8 -translate-x-half -translate-y-half bg-red"
  //-   :style="{ top: `${currentPointerPos.y}px`, left: `${currentPointerPos.x}px` }")
  //- div(
  //-   class="fixed rounded-[50%] w-8 h-8 -translate-x-half -translate-y-half bg-yellow"
  //-   :style="{ top: `${anchorPos.y}px`, left: `${anchorPos.x}px` }")
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import vuex from '@/vuex'
import PageContent from '@nu/vivi-lib/components/editor/page/PageContent.vue'
import type { IPageState } from '@nu/vivi-lib/interfaces/page'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mouseUtils from '@nu/vivi-lib/utils/mouseUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import resizeUtils from '@nu/vivi-lib/utils/resizeUtils'
import { useElementBounding } from '@vueuse/core'

// #region data
const containerRef = ref<HTMLElement | null>(null)
const {
  width: containerWidth,
  height: containerHeight,
  x: containerX,
  y: containerY,
} = useElementBounding(containerRef)
const contentScaleRatio = computed(() => vuex.getters.getContentScaleRatio)
const editorStore = useEditorStore()
const { pageSize } = storeToRefs(editorStore)
const renderedSize = computed(() => {
  return {
    width: pageSize.value.width * contentScaleRatio.value,
    height: pageSize.value.height * contentScaleRatio.value,
  }
})
const MIN_PADDING_X = 24
const MIN_PADDING_Y = 24
const MAX_SIZE = 1600
// #endregion

const props = defineProps({
  pageState: {
    type: Object as PropType<IPageState>,
    required: true,
  },
  pageIndex: {
    type: Number,
    required: true,
  },
  noBg: {
    type: Boolean,
    default: false,
  },
})

// #region controllers
const CONTROLLER_CONFIG = {
  width: 4,
  length: 40,
  margin: 1,
  color: 'bg-white',
}

type direction = 1 | 0 | -1

interface IControllerConfig {
  key: string
  styles: Record<string, string>
  params: {
    vertical: direction
    horizontal: direction
  }
  color: string
}

const getControllers = (isTouchArea = false): IControllerConfig[] => {
  return Array(12)
    .fill(0)
    .map((_, index) => {
      const isResizer = index < 4
      const isScalerX = index < 8 && !isResizer
      const subIndex = index % 4
      const equivalentIndex = isScalerX ? (subIndex < 2 ? 0 : 2) : subIndex < 2 ? 1 : 3
      const resizerXs = [50, 100, 50, 0]
      const resizerYs = [0, 50, 100, 50]
      const scalerPs = [0, 100, 100, 0]
      const marginY = (subIndex: number) => (subIndex % 2 === 0 ? subIndex - 1 : 0)
      const marginX = (subIndex: number) => (subIndex % 2 !== 0 ? 2 - subIndex : 0)
      return isResizer
        ? {
            key: `controller-${subIndex}`,
            styles: {
              width: `${subIndex % 2 === 0 ? CONTROLLER_CONFIG.length : CONTROLLER_CONFIG.width}px`,
              height: `${
                subIndex % 2 === 0 ? CONTROLLER_CONFIG.width : CONTROLLER_CONFIG.length
              }px`,
              top: `calc(${resizerYs[subIndex]}% + ${
                marginY(subIndex) * CONTROLLER_CONFIG.margin
              }px)`,
              left: `calc(${resizerXs[subIndex]}% + ${
                marginX(subIndex) * CONTROLLER_CONFIG.margin
              }px)`,
              transform: `translate(${resizerXs[subIndex] - 100}%, ${resizerYs[subIndex] - 100}%)${
                isTouchArea ? ` scale${subIndex % 2 === 0 ? 'Y' : 'X'}(8)` : ''
              }`,
            },
            color: isTouchArea ? 'bg-transparent' : CONTROLLER_CONFIG.color,
            params: {
              vertical: (subIndex % 2 === 0 ? subIndex - 1 : 0) as direction,
              horizontal: (subIndex % 2 !== 0 ? 2 - subIndex : 0) as direction,
            },
          }
        : isScalerX
        ? {
            key: `controller-${subIndex}`,
            styles: {
              width: `${CONTROLLER_CONFIG.length}px`,
              height: `${CONTROLLER_CONFIG.width}px`,
              top: `calc(${resizerYs[equivalentIndex]}% + ${
                marginY(equivalentIndex) * CONTROLLER_CONFIG.margin
              }px)`,
              left: `calc(${scalerPs[subIndex]}% + ${
                (scalerPs[subIndex] / 50 - 1) * (CONTROLLER_CONFIG.margin + CONTROLLER_CONFIG.width)
              }px)`,
              transform: `translate(-${scalerPs[subIndex]}%, ${resizerYs[equivalentIndex] - 100}%)${
                isTouchArea ? ' scaleY(8)' : ''
              }`,
            },
            color: isTouchArea ? 'bg-transparent' : CONTROLLER_CONFIG.color,
            params: {
              vertical: (equivalentIndex - 1) as direction,
              horizontal: (subIndex > 0 && subIndex < 3 ? 1 : -1) as direction,
            },
          }
        : {
            key: `controller-${subIndex}`,
            styles: {
              width: `${CONTROLLER_CONFIG.width}px`,
              height: `${CONTROLLER_CONFIG.length}px`,
              top: `calc(${scalerPs[subIndex]}% + ${
                (scalerPs[subIndex] / 50 - 1) * (CONTROLLER_CONFIG.margin + CONTROLLER_CONFIG.width)
              }px)`,
              left: `calc(${resizerXs[equivalentIndex]}% + ${
                marginX(equivalentIndex) * CONTROLLER_CONFIG.margin
              }px)`,
              transform: `translate(${resizerXs[equivalentIndex] - 100}%, -${scalerPs[subIndex]}%)${
                isTouchArea ? ' scaleX(8)' : ''
              }`,
            },
            color: isTouchArea ? 'bg-transparent' : CONTROLLER_CONFIG.color,
            params: {
              vertical: (subIndex > 0 && subIndex < 3 ? 1 : -1) as direction,
              horizontal: (2 - equivalentIndex) as direction,
            },
          }
    })
}

const controllers = ref<IControllerConfig[]>([...getControllers(), ...getControllers(true)])
// #endregion

// #region styles
const sizeStyles = computed(() => {
  return {
    width: `${renderedSize.value.width}px`,
    height: `${renderedSize.value.height}px`,
  }
})
// #endregion

// #region pos and contentScaleRatio
watchEffect(() => {
  if (containerWidth.value === 0 && containerHeight.value === 0) return
  const ratio = Math.min(
    (containerWidth.value - MIN_PADDING_X * 2) / pageSize.value.width,
    (containerHeight.value - MIN_PADDING_Y * 2) / pageSize.value.height,
  )
  vuex.commit('SET_contentScaleRatio4Page', {
    pageIndex: layerUtils.pageIndex,
    contentScaleRatio: ratio,
  })
})
// #endregion

// #region resize
vuex.commit('canvasResize/SET_initSize', {
  width: pageSize.value.width,
  height: pageSize.value.height,
})

const controllingParams = ref({ vertical: 0, horizontal: 0 } as IControllerConfig['params'])
const anchorPos = reactive({ x: 0, y: 0 })
const currentPointerPos = reactive({ x: 0, y: 0 })
let pressingTimer = -1

const resizeStart = (event: PointerEvent, params: IControllerConfig['params']) => {
  controllingParams.value = params
  window.addEventListener('pointermove', resizing)
  window.addEventListener('pointerup', resizeEnd)
}

const resizing = (event: PointerEvent) => {
  window.clearTimeout(pressingTimer)
  const { horizontal, vertical } = controllingParams.value

  const wider = renderedSize.value.width >= containerWidth.value - 2 * MIN_PADDING_X
  const higher = renderedSize.value.height >= containerHeight.value - 2 * MIN_PADDING_Y

  const pointerPos = mouseUtils.getMouseAbsPoint(event)
  Object.assign(currentPointerPos, pointerPos)

  // #region anchor pos
  const paddingX = (containerWidth.value - renderedSize.value.width) / 2
  const paddingY = (containerHeight.value - renderedSize.value.height) / 2

  anchorPos.x = containerX.value + paddingX + (renderedSize.value.width / 2) * (horizontal + 1)
  anchorPos.y = containerY.value + paddingY + (renderedSize.value.height / 2) * (vertical + 1)
  // #endregion

  const diff = {
    x: pointerPos.x - anchorPos.x,
    y: pointerPos.y - anchorPos.y,
  }
  const sizeDiff = { width: 0, height: 0 }
  const layerOffset = { x: 0, y: 0 }
  const initSize = pageSize.value
  const initLayerOffset = vuex.getters['canvasResize/getLayerOffset']

  if (horizontal !== 0) {
    const amount = diff.x * horizontal * (wider ? 0.5 : 2)
    sizeDiff.width = Math.trunc(amount / contentScaleRatio.value)
  }

  if (vertical !== 0) {
    const amount = diff.y * vertical * (higher ? 0.5 : 2)
    sizeDiff.height = Math.trunc(amount / contentScaleRatio.value)
  }

  const newWidth = initSize.width + sizeDiff.width
  const newHeight = initSize.height + sizeDiff.height
  if (horizontal < 0) {
    layerOffset.x = newWidth - initSize.width
  }
  if (vertical < 0) {
    layerOffset.y = newHeight - initSize.height
  }

  pageUtils.updatePageProps({
    width: newWidth,
    height: newHeight,
  })
  vuex.commit('canvasResize/SET_layerOffset', {
    x: initLayerOffset.x + layerOffset.x,
    y: initLayerOffset.y + layerOffset.y,
  })
  const { pageIndex, pageState } = toRefs(props)
  const longerSide = Math.max(newWidth, newHeight)
  if (longerSide > MAX_SIZE) {
    const ratio = 1600 / longerSide
    resizeUtils.resizePage(pageIndex.value, pageState.value.config, {
      width: newWidth * ratio,
      height: newHeight * ratio,
    })
  }
  pressingTimer = window.setTimeout(() => resizing(event), 50)
}

const resizeEnd = (event: PointerEvent) => {
  window.clearTimeout(pressingTimer)
  window.removeEventListener('pointermove', resizing)
  window.removeEventListener('pointerup', resizeEnd)
}
// #endregion
</script>

<style lang="scss">
.canvas-resizer {
  & * {
    -webkit-touch-callout: none;
  }
}
</style>
