<template lang="pug">
div(class="canvas-section absolute top-0 left-0")
  canvas(
    v-show="!isDuringCopy"
    class="canvas-section w-full h-full opacity-30"
    ref="canvasRef")
  div(
    v-if="showBrush"
    class="absolute top-0 left-0 pointer-events-none rounded-full opacity-60"
    :style="brushStyle")
</template>
<script setup lang="ts">
import useCanvasUtilsCm from '@/composable/useCanvasUtilsCm'
import { useEditorStore } from '@/stores/editor'
import { generalUtils } from '@nu/shared-lib'
import { storeToRefs } from 'pinia'
import { useStore } from 'vuex'
// #region data section
const props = defineProps<{
  containerDOM: HTMLElement | null
  wrapperDOM: HTMLElement | null
}>()

const { containerDOM, wrapperDOM } = toRefs(props)
const editorStore = useEditorStore()
const { setMaskCanvas } = editorStore
const { pageSize } = storeToRefs(editorStore)
// #endregion

// #region Canvas feature section
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { brushStyle, showBrush } = useCanvasUtilsCm(canvasRef, wrapperDOM, containerDOM)
// #endregion

// #region WebView feature section
const store = useStore()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
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
