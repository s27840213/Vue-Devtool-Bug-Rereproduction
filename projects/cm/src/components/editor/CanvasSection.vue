<template lang="pug">
div(class="canvas-section absolute top-0 left-0 z-canvas")
  canvas(
    v-show="showCanvas"
    id="canvas-section-canvas"
    class="canvas-section absolute top-0 left-0"
    :class="isBiColorEditor || noOpacity ? 'opacity-100' : 'opacity-30'"
    ref="canvasRef"
    :style="canvasStyle")
  div(
    v-if="showBrush"
    class="absolute top-0 left-0 pointer-events-none rounded-full opacity-60"
    :style="brushStyle")
</template>
<script setup lang="ts">
import useBiColorEditor from '@/composable/useBiColorEditor'
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm'
import { useEditorStore } from '@/stores/editor'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { toRefs } from 'vue'; // Workaround for https://github.com/vuejs/eslint-plugin-vue/issues/2322
import { useStore } from 'vuex'

// #region data section
const props = withDefaults(
  defineProps<{
    containerDOM: HTMLElement | null
    wrapperDOM: HTMLElement | null
    noOpacity?: boolean
    width?: number
    height?: number
  }>(),
  {
    noOpacity: false,
  },
)

const { containerDOM, wrapperDOM, noOpacity, width, height } = toRefs(props)

const contentScaleRatio = computed(() => store.getters.getContentScaleRatio)
const editorStore = useEditorStore()
const { pageSize } = storeToRefs(editorStore)

const canvasStyle = computed(() => {
  return {
    // width: `${pageSize.value.width * contentScaleRatio.value * pageUtils.scaleRatio * 0.01}px`,
    // height: `${pageSize.value.height * contentScaleRatio.value * pageUtils.scaleRatio * 0.01}px`,
    width: `${
      width?.value || pageSize.value.width * contentScaleRatio.value * pageUtils.scaleRatio * 0.01
    }px`,
    height: `${
      height?.value || pageSize.value.height * contentScaleRatio.value * pageUtils.scaleRatio * 0.01
    }px`,
    transformOrigin: '0 0',
  }
})

const { isBiColorEditor } = useBiColorEditor()
// #endregion

// #region Canvas feature section
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { brushStyle, showBrush, restoreCanvas } = useCanvasUtilsCm(
  canvasRef,
  wrapperDOM,
  containerDOM,
)

// #endregion

// #region WebView feature section
const store = useStore()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const showCanvas = computed(() => {
  if (editorStore.editorType === 'hidden-message') return true
  return !isDuringCopy.value
})
// #endregion

const getCanvasDataUrl = () => {
  if (!canvasRef.value) return ''
  const dataURL = canvasRef.value.toDataURL('image/png')
  return dataURL
}

const downloadCanvas = () => {
  if (!canvasRef.value) return ''

  generalUtils.downloadImage(getCanvasDataUrl(), 'test.png')
}

defineExpose({
  getCanvasDataUrl,
  downloadCanvas,
})
</script>
<style lang="scss"></style>
