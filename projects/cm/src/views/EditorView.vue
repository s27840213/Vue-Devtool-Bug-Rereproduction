<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar(class="px-24" :middGap="32")
    template(#left)
      back-btn
    template(
      v-if="isEditing"
      #middle)
      cm-svg-icon(
        iconName="undo"
        :iconColor="'app-btn-primary-text'"
        iconWidth="20px")
      cm-svg-icon(
        iconName="redo"
        :iconColor="'app-btn-primary-text'"
        iconWidth="20px")
    template(#right)
      cm-btn(
        v-if="isEditing"
        theme="primary"
        size="md"
        @click="downloadCanvas") 下載 Mask
      cm-btn(
        v-if="showAspectRatioSelector"
        theme="primary"
        size="md"
        @click="handleNextAction") {{ $t('CM0012') }}
  div(class="editor-container flex justify-center items-center relative" ref="editorContainerRef")
    div(class="w-full h-full box-border overflow-scroll flex justify-center items-center")
      div(
        class="wrapper relative tutorial-powerful-fill-3--highlight"
        :style="wrapperStyles"
        ref="editorWrapperRef")
        div(
          id="editor-page"
          class="page bg-primary-white origin-top-left overflow-hidden flex items-center justify-center"
          :style="pageStyles")
          img(class="h-full object-contain" src="@/assets/img/test.jpg")
          canvas-section(
            v-if="isEditing"
            class="absolute top-0 left-0 w-full h-full"
            :containerDOM="editorContainerRef"
            :wrapperDOM="editorWrapperRef"
            ref="canvasRef")
        div(
          v-if="isChangingBrushSize"
          class="demo-brush"
          :style="demoBrushSizeStyles")
    sidebar-tabs(
      v-if="isEditing"
      class="absolute top-1/2 right-0 z-10 -translate-y-1/2"
      ref="sidebarTabsRef")
</template>
<script setup lang="ts">
import useImageUtils from '@/composable/useImageUtils'
import useStateInfo from '@/composable/useStateInfo'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import tutorialUtils from '@/utils/tutorialUtils'
import mathUtils from '@nu/vivi-lib/utils/mathUtils'
import { useElementSize, useEventBus } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { VNodeRef } from 'vue'

const editorContainerRef = ref<HTMLElement | null>(null)
const editorWrapperRef = ref<HTMLElement | null>(null)
const sidebarTabsRef = ref<HTMLElement | null>(null)
const { width: sidebarTabsWidth } = useElementSize(sidebarTabsRef)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementSize(editorContainerRef)

const { imgLoadHandler, getImageUrl } = useImageUtils()

onMounted(() => {
  imgLoadHandler(getImageUrl('test', 'jpg'), (img) => {
    setImgAspectRatio(img.width / img.height)
  })
})
// #region Stores
const { isEditing, atEditor, showAspectRatioSelector } = useStateInfo()
const editorStore = useEditorStore()
const { setPageScaleRatio, setImgAspectRatio, setEditorState } = editorStore
const { editingPage, pageSize, pageScaleRatio, editorState } = storeToRefs(editorStore)

const handleNextAction = function () {
  if (editorState.value === 'aspectRatio') {
    setEditorState('editing')
    tutorialUtils.runTutorial('powerful-fill')
  } else if (editorState.value === 'editing') {
    setEditorState('prompt')
  }
}
// #endregion

onBeforeRouteLeave((to, from) => {
  if (from.name === 'Editor') {
    setTimeout(() => {
      /**
       * @NOTE - if we reset immediately, will see the editor from editing state to initial state bcz transition time
       */
      editorStore.$reset()
    }, 1000)
  }
})

// #region computed
const fitScaleRatio = computed(() => {
  if (
    editorContainerWidth.value === 0 ||
    editorContainerHeight.value === 0 ||
    pageSize.value.width === 0 ||
    pageSize.value.height === 0
  )
    return 1

  const pageAspectRatio = pageSize.value.width / pageSize.value.height
  const newWidth = pageAspectRatio > 1 ? 1600 : 1600 * pageAspectRatio
  const newHeight = pageAspectRatio > 1 ? 1600 / pageAspectRatio : 1600

  const widhtRatio = (editorContainerWidth.value - sidebarTabsWidth.value - 24) / newWidth
  const heightRatio = editorContainerHeight.value / newHeight

  const ratio = Math.min(widhtRatio, heightRatio) * 0.9

  return ratio
})

const wrapperStyles = computed(() => {
  return {
    width: `${editingPage.value.width * fitScaleRatio.value}px`,
    height: `${editingPage.value.height * fitScaleRatio.value}px`,
  }
})

const pageStyles = computed(() => {
  return {
    width: `${editingPage.value.width}px`,
    height: `${editingPage.value.height}px`,
    transform: `scale(${pageScaleRatio.value})`,
  }
})
// #endregion

// #region demo brush size section
const canvasStore = useCanvasStore()
const { brushSize, isChangingBrushSize } = storeToRefs(canvasStore)

const demoBrushSizeStyles = computed(() => {
  return {
    width: `${brushSize.value * pageScaleRatio.value}px`,
    height: `${brushSize.value * pageScaleRatio.value}px`,
  }
})
// #endregion

// #region Canvas functions
const bus = useEventBus<string>('generation')
const unsubcribe = bus.on((event: string, { callback }) => {
  if (event === 'genMaskUrl') {
    callback(getCanvasDataUrl())
  }
})
onBeforeUnmount(() => {
  unsubcribe()
})

const canvasRef = ref<VNodeRef | null>(null)
const downloadCanvas = () => {
  if (!canvasRef.value) return

  canvasRef.value.downloadCanvas()
}

const getCanvasDataUrl = () => {
  if (!canvasRef.value) return

  return canvasRef.value.getCanvasDataUrl()
}
// #endregion
/**
 * fitPage
 */

console.log(mathUtils.sin(800))
watch(
  () => fitScaleRatio.value,
  (newVal, oldVal) => {
    if (newVal === oldVal || !atEditor.value) return
    setPageScaleRatio(newVal)
  },
  // useDebounceFn((newVal, oldVal) => {
  //   if (newVal === oldVal || !atEditor.value) return
  //   setPageScaleRatio(newVal)
  //   setPageScaleRatio(newVal)
  // }, 300),
)
</script>
<style lang="scss">
.demo-brush {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-app-selection bg-opacity-30;
  @apply pointer-events-none rounded-full outline-4 outline-primary-white;
  outline-style: solid;
}
</style>
