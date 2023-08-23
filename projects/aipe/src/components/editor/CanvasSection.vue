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
import { storeToRefs } from 'pinia'
// #region data section
const props = defineProps<{
  containerDOM: HTMLElement | null
  wrapperDOM: HTMLElement | null
}>()

const { containerDOM, wrapperDOM } = toRefs(props)
const editorStore = useEditorStore()
const { pageSize } = storeToRefs(editorStore)
// #endregion

// #region Canvas feature section
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { brushStyle, showBrush } = useCanvasUtils(canvasRef, wrapperDOM, containerDOM)
// #endregion
</script>
<style lang="scss"></style>
