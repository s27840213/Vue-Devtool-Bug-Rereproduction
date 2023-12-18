<template lang="pug">
div(ref="containerRef"
    class="canvas-resizer overflow-hidden relative select-none"
    v-touch
    @panstart.stop="panStart"
    @panmove.stop="panMove")
  page-content(class="absolute select-none"
              :style="translateStyles"
              :config="pageState.config"
              :pageIndex="pageIndex"
              :contentScaleRatio="contentScaleRatio"
              :noBg="noBg")
  div(class="absolute select-none"
      :style="{...sizeStyles, ...translateStyles}"
      @touchstart.prevent)
    div(v-for="controller in controllers"
        :key="controller.key"
        class="absolute select-none"
        :class="controller.color"
        :style="controller.styles"
        @touchstart.prevent
        @pointerdown.prevent.stop="resizeStart($event, controller.params)")
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import vuex from '@/vuex'
import PageContent from '@nu/vivi-lib/components/editor/page/PageContent.vue'
import type { IPageState } from '@nu/vivi-lib/interfaces/page'
import mouseUtils from '@nu/vivi-lib/utils/mouseUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { useElementBounding } from '@vueuse/core'
import type { AnyTouchEvent } from 'any-touch'

// #region data
const containerRef = ref<HTMLElement | null>(null)
const { width: containerWidth, height: containerHeight, x: containerX, y: containerY } = useElementBounding(containerRef)
const contentScaleRatio = computed(() => vuex.getters.getContentScaleRatio)
const editorStore = useEditorStore()
const { pageSize } = storeToRefs(editorStore)

const pos = reactive({
  x: 0,
  y: 0,
})
const offset = reactive({
  x: 0,
  y: 0,
})
const translates = computed(() => {
  return {
    x: pos.x + offset.x,
    y: pos.y + offset.y
  }
})
const renderedSize = computed(() => {
  return {
    width: pageSize.value.width * contentScaleRatio.value,
    height: pageSize.value.height * contentScaleRatio.value,
  }
})
const MIN_PADDING_X = 16
const MIN_PADDING_Y = 16
const paddings = computed(() => {
  return {
    x: Math.max(pos.x, MIN_PADDING_X),
    y: Math.max(pos.y, MIN_PADDING_Y),
  }
})
// #endregion

defineProps({
  pageState: {
    type: Object as PropType<IPageState>,
    required: true
  },
  pageIndex: {
    type: Number,
    required: true
  },
  noBg: {
    type: Boolean,
    default: false
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
  return Array(12).fill(0).map((_, index) => {
    const isResizer = index < 4
    const isScalerX = index < 8 && !isResizer
    const subIndex = index % 4
    const equivalentIndex = isScalerX ? (subIndex < 2 ? 0 : 2) : (subIndex < 2 ? 1 : 3)
    const resizerXs = [50, 100, 50, 0]
    const resizerYs = [0, 50, 100, 50]
    const scalerPs = [0, 100, 100, 0]
    const marginY = (subIndex: number) => (subIndex % 2 === 0 ? (subIndex - 1) : 0)
    const marginX = (subIndex: number) => (subIndex % 2 !== 0 ? (2 - subIndex) : 0)
    return isResizer ? {
      key: `controller-${subIndex}`,
      styles: {
        width: `${subIndex % 2 === 0 ? CONTROLLER_CONFIG.length : CONTROLLER_CONFIG.width}px`,
        height: `${subIndex % 2 === 0 ? CONTROLLER_CONFIG.width : CONTROLLER_CONFIG.length}px`,
        top: `calc(${resizerYs[subIndex]}% + ${marginY(subIndex) * CONTROLLER_CONFIG.margin}px)`,
        left: `calc(${resizerXs[subIndex]}% + ${marginX(subIndex) * CONTROLLER_CONFIG.margin}px)`,
        transform: `translate(${resizerXs[subIndex] - 100}%, ${resizerYs[subIndex] - 100}%)${isTouchArea ? ` scale${subIndex % 2 === 0 ? 'Y' : 'X'}(4)` : ''}`,
      },
      color: isTouchArea ? 'bg-transparent' : CONTROLLER_CONFIG.color,
      params: {
        vertical: (subIndex % 2 === 0 ? (subIndex - 1) : 0) as direction,
        horizontal: (subIndex % 2 !== 0 ? (2 - subIndex) : 0) as direction,
      },
    } : isScalerX ? {
      key: `controller-${subIndex}`,
      styles: {
        width: `${CONTROLLER_CONFIG.length}px`,
        height: `${CONTROLLER_CONFIG.width}px`,
        top: `calc(${resizerYs[equivalentIndex]}% + ${marginY(equivalentIndex) * CONTROLLER_CONFIG.margin}px)`,
        left: `calc(${scalerPs[subIndex]}% + ${(scalerPs[subIndex] / 50 - 1) * (CONTROLLER_CONFIG.margin + CONTROLLER_CONFIG.width)}px)`,
        transform: `translate(-${scalerPs[subIndex]}%, ${resizerYs[equivalentIndex] - 100}%)${isTouchArea ? ' scaleY(4)' : ''}`,
      },
      color: isTouchArea ? 'bg-transparent' : CONTROLLER_CONFIG.color,
      params: {
        vertical: (equivalentIndex - 1) as direction,
        horizontal: ((subIndex > 0 && subIndex < 3) ? 1 : -1) as direction,
      },
    } : {
      key: `controller-${subIndex}`,
      styles: {
        width: `${CONTROLLER_CONFIG.width}px`,
        height: `${CONTROLLER_CONFIG.length}px`,
        top: `calc(${scalerPs[subIndex]}% + ${(scalerPs[subIndex] / 50 - 1) * (CONTROLLER_CONFIG.margin + CONTROLLER_CONFIG.width)}px)`,
        left: `calc(${resizerXs[equivalentIndex]}% + ${marginX(equivalentIndex) * CONTROLLER_CONFIG.margin}px)`,
        transform: `translate(${resizerXs[equivalentIndex] - 100}%, -${scalerPs[subIndex]}%)${isTouchArea ? ' scaleX(4)' : ''}`,
      },
      color: isTouchArea ? 'bg-transparent' : CONTROLLER_CONFIG.color,
      params: {
        vertical: ((subIndex > 0 && subIndex < 3) ? 1 : -1) as direction,
        horizontal: (2 - equivalentIndex) as direction,
      },
    }
  })
}

const controllers = ref<IControllerConfig[]>([
  ...getControllers(),
  ...getControllers(true)
])
// #endregion

// #region styles
const translateStyles = computed(() => {
  return {
    top: `${translates.value.y}px`,
    left: `${translates.value.x}px`
  }
})
const sizeStyles = computed(() => {
  return {
    width: `${renderedSize.value.width}px`,
    height: `${renderedSize.value.height}px`
  }
})
// #endregion

// #region pos
watchEffect(() => {
  if (containerWidth.value === 0 && containerHeight.value === 0) return
  pos.x = (containerWidth.value - renderedSize.value.width) / 2
  pos.y = (containerHeight.value - renderedSize.value.height) / 2
})
// #endregion

// #region offset
watchEffect(() => {
  const limits = {
    x: [paddings.value.x, containerWidth.value - paddings.value.x - renderedSize.value.width],
    y: [paddings.value.y, containerHeight.value - paddings.value.y - renderedSize.value.height],
  }
  const minTranslates = { x: Math.min(...limits.x), y: Math.min(...limits.y) }
  const maxTranslates = { x: Math.max(...limits.x), y: Math.max(...limits.y) }
  const clampedTranlates = {
    x: Math.min(Math.max(translates.value.x, minTranslates.x), maxTranslates.x),
    y: Math.min(Math.max(translates.value.y, minTranslates.y), maxTranslates.y),
  }
  offset.x = clampedTranlates.x - pos.x
  offset.y = clampedTranlates.y - pos.y
})

const lastPointerPos = reactive({
  x: 0,
  y: 0,
})

const panStart = (event: AnyTouchEvent) => {
  lastPointerPos.x = event.x
  lastPointerPos.y = event.y
}

const panMove = (event: AnyTouchEvent) => {
  if (isResizing.value) return
  offset.x += event.x - lastPointerPos.x
  offset.y += event.y - lastPointerPos.y
  lastPointerPos.x = event.x
  lastPointerPos.y = event.y
}
// #endregion

// #region resize
vuex.commit('canvasResize/SET_initSize', { width: pageSize.value.width, height: pageSize.value.height })
const MIN_SIZE = 512
const MAX_SIZE = 2048

const isResizing = ref(false)
const controllingParams = ref({ vertical: 0, horizontal: 0 } as IControllerConfig['params'])
let initPointerPos = { x: 0, y: 0 }
let initSize = { width: 0, height: 0 }
let initLayerOffset = { x: 0, y: 0 }
let pressingTimer = -1

const resizeStart = (event: PointerEvent, params: IControllerConfig['params']) => {
  controllingParams.value = params
  isResizing.value = true
  initPointerPos = mouseUtils.getMouseAbsPoint(event)
  initSize = { width: pageSize.value.width, height: pageSize.value.height }
  initLayerOffset = vuex.getters['canvasResize/getLayerOffset']
  window.addEventListener('pointermove', resizing)
  window.addEventListener('pointerup', resizeEnd)
  pressingTimer = window.setTimeout(() => resizing(event), 100)
}

const resizing = (event: PointerEvent) => {
  window.clearTimeout(pressingTimer)
  const { horizontal, vertical } = controllingParams.value

  // START: special handler for edging
  const wider = renderedSize.value.width > containerWidth.value - 2 * MIN_PADDING_X
  const higher = renderedSize.value.height > containerHeight.value - 2 * MIN_PADDING_Y
  if (wider) {
    if (horizontal < 0) {
      initPointerPos.x = containerX.value + MIN_PADDING_X
      initSize.width = pageSize.value.width
      initLayerOffset.x = vuex.getters['canvasResize/getLayerOffset'].x
    }
    if (horizontal > 0) {
      initPointerPos.x = containerX.value + containerWidth.value - MIN_PADDING_X
      initSize.width = pageSize.value.width
      initLayerOffset.x = vuex.getters['canvasResize/getLayerOffset'].x
    }
  }
  if (higher) {
    if (vertical < 0) {
      initPointerPos.y = containerY.value + MIN_PADDING_Y
      initSize.height = pageSize.value.height
      initLayerOffset.y = vuex.getters['canvasResize/getLayerOffset'].y
    }
    if (vertical > 0) {
      initPointerPos.y = containerY.value + containerHeight.value - MIN_PADDING_Y
      initSize.height = pageSize.value.height
      initLayerOffset.y = vuex.getters['canvasResize/getLayerOffset'].y
    }
  }
  // END

  const pointerPos = mouseUtils.getMouseAbsPoint(event)
  const diff = {
    x: pointerPos.x - initPointerPos.x,
    y: pointerPos.y - initPointerPos.y,
  }
  const sizeDiff = { width: 0, height: 0 }
  const layerOffset = { x: 0, y: 0 }

  if (horizontal !== 0) {
    const amount = diff.x * horizontal * 2
    sizeDiff.width = Math.trunc(amount / contentScaleRatio.value)
  }

  if (vertical !== 0) {
    const amount = diff.y * vertical * 2
    sizeDiff.height = Math.trunc(amount / contentScaleRatio.value)
  }

  const newWidth = initSize.width + sizeDiff.width
  const newHeight = initSize.height + sizeDiff.height
  const finalWidth = Math.max(Math.min(newWidth, MAX_SIZE), MIN_SIZE)
  const finalHeight = Math.max(Math.min(newHeight, MAX_SIZE), MIN_SIZE)
  if (horizontal < 0) {
    layerOffset.x = finalWidth - initSize.width
  }
  if (vertical < 0) {
    layerOffset.y = finalHeight - initSize.height
  }

  pageUtils.updatePageProps({
    width: finalWidth,
    height: finalHeight,
  })
  vuex.commit('canvasResize/SET_layerOffset', {
    x: initLayerOffset.x + layerOffset.x,
    y: initLayerOffset.y + layerOffset.y
  })
  nextTick(() => {
    if (horizontal < 0 && diff.x < 0 && translates.value.x < MIN_PADDING_X) {
      offset.x = MIN_PADDING_X - pos.x
    }
    if (vertical < 0 && diff.y < 0 && translates.value.y < MIN_PADDING_Y) {
      offset.y = MIN_PADDING_Y - pos.y
    }
    if (horizontal > 0 && diff.x > 0 && translates.value.x > containerWidth.value - renderedSize.value.width - MIN_PADDING_X) {
      offset.x = containerWidth.value - renderedSize.value.width - MIN_PADDING_X - pos.x
    }
    if (vertical > 0 && diff.y > 0 && translates.value.y > containerHeight.value - renderedSize.value.height - MIN_PADDING_Y) {
      offset.y = containerHeight.value - renderedSize.value.height - MIN_PADDING_Y - pos.y
    }
  })
  pressingTimer = window.setTimeout(() => resizing(event), 100)
}

const resizeEnd = (event: PointerEvent) => {
  window.clearTimeout(pressingTimer)
  isResizing.value = false
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
