<template lang="pug">
div(ref="containerRef"
    class="canvas-resizer overflow-hidden relative")
  page-content(class="z-page absolute"
              :style="translateStyles"
              :config="pageState.config"
              :pageIndex="pageIndex"
              :contentScaleRatio="contentScaleRatio"
              :noBg="noBg")
  div(class="absolute"
      :style="{...sizeStyles, ...translateStyles}")
    div(v-for="controller in controllers"
        :key="controller.key"
        class="absolute"
        :class="CONTROLLER_CONFIG.color"
        :style="controller.styles"
        @click="handleResize(controller.params)")
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor';
import vuex from '@/vuex';
import PageContent from '@nu/vivi-lib/components/editor/page/PageContent.vue';
import type { IPageState } from '@nu/vivi-lib/interfaces/page';
import { useElementBounding } from '@vueuse/core';

// #region data
const containerRef = ref<HTMLElement | null>(null)
const { width: containerWidth, height: containerHeight } = useElementBounding(containerRef)
const contentScaleRatio = computed(() => vuex.getters.getContentScaleRatio)
const editorStore = useEditorStore()
const { pageSize } = editorStore

const pos = reactive({
  x: 0,
  y: 0,
})
const offsets = reactive({
  x: 0,
  y: 0,
})
const translates = computed(() => {
  return {
    x: pos.x + offsets.x,
    y: pos.y + offsets.y
  }
})
const renderedSize = computed(() => {
  return {
    width: pageSize.width * contentScaleRatio.value,
    height: pageSize.height * contentScaleRatio.value,
  }
})
// #endregion

const props = defineProps({
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

interface IControllerConfig {
  key: string
  styles: Record<string, string>
  params: {
    vertical: 1 | -1
    horizontal: 1 | -1
  }
}

const controllers = ref<IControllerConfig[]>(Array(12).fill(0).map((_, index) => {
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
      transform: `translate(${resizerXs[subIndex] - 100}%, ${resizerYs[subIndex] - 100}%)`,
    },
    params: {
      vertical: (subIndex % 2 === 0 ? (subIndex - 1) : 0) as 1 | -1,
      horizontal: (subIndex % 2 !== 0 ? (2 - subIndex) : 0) as 1 | -1,
    },
  } : isScalerX ? {
    key: `controller-${subIndex}`,
    styles: {
      width: `${CONTROLLER_CONFIG.length}px`,
      height: `${CONTROLLER_CONFIG.width}px`,
      top: `calc(${resizerYs[equivalentIndex]}% + ${marginY(equivalentIndex) * CONTROLLER_CONFIG.margin}px)`,
      left: `calc(${scalerPs[subIndex]}% + ${(scalerPs[subIndex] / 50 - 1) * (CONTROLLER_CONFIG.margin + CONTROLLER_CONFIG.width)}px)`,
      transform: `translate(-${scalerPs[subIndex]}%, ${resizerYs[equivalentIndex] - 100}%)`,
    },
    params: {
      vertical: (equivalentIndex - 1) as 1 | -1,
      horizontal: ((subIndex > 0 && subIndex < 3) ? 1 : -1) as 1 | -1,
    },
  } : {
    key: `controller-${subIndex}`,
    styles: {
      width: `${CONTROLLER_CONFIG.width}px`,
      height: `${CONTROLLER_CONFIG.length}px`,
      top: `calc(${scalerPs[subIndex]}% + ${(scalerPs[subIndex] / 50 - 1) * (CONTROLLER_CONFIG.margin + CONTROLLER_CONFIG.width)}px)`,
      left: `calc(${resizerXs[equivalentIndex]}% + ${marginX(equivalentIndex) * CONTROLLER_CONFIG.margin}px)`,
      transform: `translate(${resizerXs[equivalentIndex] - 100}%, -${scalerPs[subIndex]}%)`,
    },
    params: {
      vertical: ((subIndex > 0 && subIndex < 3) ? 1 : -1) as 1 | -1,
      horizontal: (2 - equivalentIndex) as 1 | -1,
    },
  }
}))
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
watch([containerWidth, containerHeight], (_, [newWidth, newHeight]) => {
  calculatePos(newWidth, newHeight)
})

onMounted(() => {
  calculatePos(containerWidth.value, containerHeight.value)
})

const calculatePos = (width: number, height: number) => {
  if (width === 0 && height === 0) return
  pos.x = (width - renderedSize.value.width) / 2
  pos.y = (height - renderedSize.value.height) / 2
}
// #endregion

const handleResize = ({ vertical, horizontal }: { vertical: (1 | -1), horizontal: (1 | -1) }) => {
  console.log(vertical, horizontal)
}

</script>
