<template lang="pug">
div(ref="containerRef" class="canvas-resizer overflow-hidden relative select-none")
  page-content(
    class="absolute select-none"
    :style="offsetStyles"
    :config="pageState.config"
    :pageIndex="pageIndex"
    :contentScaleRatio="contentScaleRatio"
    :noBg="noBg")
  div(
    class="absolute select-none"
    :style="{ ...sizeStyles, ...offsetStyles }"
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
const offset = reactive({
  x: 0,
  y: 0,
})
const MIN_PADDING_X = 24
const MIN_PADDING_Y = 24
const MAX_SCALE = 3
// #endregion

defineProps({
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
  length: 20,
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
const offsetStyles = computed(() => {
  return {
    left: `${offset.x}px`,
    top: `${offset.y}px`,
  }
})
const sizeStyles = computed(() => {
  return {
    width: `${renderedSize.value.width}px`,
    height: `${renderedSize.value.height}px`,
  }
})
// #endregion

// #region pos and contentScaleRatio
watch([containerWidth, containerHeight], ([newWidth, newHeight]) => {
  const ratio = Math.min(
    (newWidth - MIN_PADDING_X * 2) / pageSize.value.width / MAX_SCALE,
    (newHeight - MIN_PADDING_Y * 2) / pageSize.value.height / MAX_SCALE,
  )
  vuex.commit('SET_contentScaleRatio4Page', {
    pageIndex: layerUtils.pageIndex,
    contentScaleRatio: ratio,
  })
  offset.x = (newWidth - pageSize.value.width * ratio) / 2
  offset.y = (newHeight - pageSize.value.height * ratio) / 2
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

const resizeStart = (event: PointerEvent, params: IControllerConfig['params']) => {
  controllingParams.value = params
  window.addEventListener('pointermove', resizing)
  window.addEventListener('pointerup', resizeEnd)
}

const resizing = (event: PointerEvent) => {
  const { horizontal, vertical } = controllingParams.value

  const pointerPos = mouseUtils.getMouseAbsPoint(event)
  Object.assign(currentPointerPos, pointerPos)

  // #region anchor pos
  anchorPos.x = containerX.value + offset.x + (renderedSize.value.width / 2) * (horizontal + 1)
  anchorPos.y = containerY.value + offset.y + (renderedSize.value.height / 2) * (vertical + 1)
  // #endregion

  const diff = {
    x: pointerPos.x - anchorPos.x,
    y: pointerPos.y - anchorPos.y,
  }
  const sizeDiff = { width: 0, height: 0 }
  const initSize = vuex.getters['canvasResize/getInitSize']
  const currSize = pageSize.value
  const currLayerOffset = vuex.getters['canvasResize/getLayerOffset']

  if (horizontal !== 0) {
    const amount = diff.x * horizontal
    sizeDiff.width = Math.trunc(amount / contentScaleRatio.value)
  }

  if (vertical !== 0) {
    const amount = diff.y * vertical
    sizeDiff.height = Math.trunc(amount / contentScaleRatio.value)
  }

  let newWidth = currSize.width + sizeDiff.width
  let newHeight = currSize.height + sizeDiff.height
  let newLayerOffsetX = currLayerOffset.x
  let newLayerOffsetY = currLayerOffset.y
  if (horizontal < 0) {
    newLayerOffsetX = currLayerOffset.x + newWidth - currSize.width
  }
  if (vertical < 0) {
    newLayerOffsetY = currLayerOffset.y + newHeight - currSize.height
  }
  if (horizontal < 0) {
    const clippedLayerOffsetX = Math.min(
      Math.max(newLayerOffsetX, -0.25 * initSize.width),
      ((MAX_SCALE - 1) / 2) * initSize.width,
    )
    newWidth += clippedLayerOffsetX - newLayerOffsetX
    newLayerOffsetX = clippedLayerOffsetX
  } else {
    newWidth = Math.min(
      Math.max(newWidth, newLayerOffsetX + 0.75 * initSize.width),
      newLayerOffsetX + ((MAX_SCALE + 1) / 2) * initSize.width,
    )
  }
  if (vertical < 0) {
    const clippedLayerOffsetY = Math.min(
      Math.max(newLayerOffsetY, -0.25 * initSize.height),
      ((MAX_SCALE - 1) / 2) * initSize.height,
    )
    newHeight += clippedLayerOffsetY - newLayerOffsetY
    newLayerOffsetY = clippedLayerOffsetY
  } else {
    newHeight = Math.min(
      Math.max(newHeight, newLayerOffsetY + 0.75 * initSize.height),
      newLayerOffsetY + ((MAX_SCALE + 1) / 2) * initSize.height,
    )
  }

  pageUtils.updatePageProps({
    width: newWidth,
    height: newHeight,
  })
  vuex.commit('canvasResize/SET_layerOffset', {
    x: newLayerOffsetX,
    y: newLayerOffsetY,
  })
  offset.x -= (newLayerOffsetX - currLayerOffset.x) * contentScaleRatio.value
  offset.y -= (newLayerOffsetY - currLayerOffset.y) * contentScaleRatio.value
}

const resizeEnd = (event: PointerEvent) => {
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
