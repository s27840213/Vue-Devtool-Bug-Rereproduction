<template lang="pug">
div(class="absolute top-0 left-0")
  canvas(class="canvas-section w-full h-full opacity-30" ref="canvasRef")
  div(
    v-if="showBrush"
    class="absolute top-0 left-0 pointer-events-none rounded-full opacity-60"
    :style="brushStyle")
</template>
<script setup lang="ts">
import useCanvasUtils from '@/composable/useCanvasUtils'
import { useEditorStore } from '@/stores/editor'
import { generalUtils } from '@nu/shared-lib'
import { storeToRefs } from 'pinia'
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
const { brushStyle, showBrush } = useCanvasUtils(canvasRef, wrapperDOM, containerDOM)
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
