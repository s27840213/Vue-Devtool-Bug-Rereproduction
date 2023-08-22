<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar
  div(class="flex justify-center items-center" ref="editorContainerRef")
    div(class="w-full h-full box-border overflow-scroll flex justify-center items-center")
      div(
        class="wrapper"
        :style="wrapperStyles"
        ref="editorWrapperRef")
        transition(
          name="fade-right-in"
          mode="out-in")
          div(
            class="page bg-primary-white origin-top-left overflow-hidden flex items-center justify-center"
            :style="pageStyles")
            img(class="h-full object-contain" src="@/assets/img/test.jpg")
            canvas-section(
              v-if="showEditingOpstions"
              class="absolute top-0 left-0 w-full h-full"
              :containerDOM="editorContainerRef"
              :wrapperDOM="editorWrapperRef")
        div(
          v-if="isChangingBrushSize"
          class="demo-btn"
          :style="demoBrushSizeStyles")
</template>
<script setup lang="ts">
import useImageUtils from '@/composable/useImageUtils'
import useStateInfo from '@/composable/useStateInfo'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'

const editorContainerRef = ref<HTMLElement | null>(null)
const editorWrapperRef = ref<HTMLElement | null>(null)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementSize(editorContainerRef)

const { imgLoadHandler, getImageUrl } = useImageUtils()

onMounted(() => {
  imgLoadHandler(getImageUrl('test', 'jpg'), (img) => {
    console.log(img.width / img.height)
    setInitAspectRatio(img.width / img.height)
  })
})
// #region Stores
const { showEditingOpstions, showPromptArea, atEditor } = useStateInfo()
const editorStore = useEditorStore()
const { setPageScaleRatio, setInitAspectRatio } = editorStore
const { editingPage, pageSize, pageScaleRatio } = storeToRefs(editorStore)
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

  const aspectRatio = pageSize.value.width / pageSize.value.height
  const newWidth = aspectRatio > 1 ? 1600 : 1600 * aspectRatio
  const newHeight = aspectRatio > 1 ? 1600 / aspectRatio : 1600

  const widhtRatio = editorContainerWidth.value / newWidth
  const heightRatio = editorContainerHeight.value / newHeight

  const ratio = Math.min(widhtRatio, heightRatio) * 0.9

  return ratio
})

const wrapperStyles = computed(() => {
  return {
    width: `${editingPage.value.width * fitScaleRatio.value}px`,
    height: `${editingPage.value.height * fitScaleRatio.value}px`
  }
})

const pageStyles = computed(() => {
  return {
    width: `${editingPage.value.width}px`,
    height: `${editingPage.value.height}px`,
    transform: `scale(${pageScaleRatio.value})`
  }
})
// #endregion

// #region demo brush size section
const canvasStore = useCanvasStore()
const { brushSize, isChangingBrushSize } = storeToRefs(canvasStore)

const demoBrushSizeStyles = computed(() => {
  return {
    width: `${brushSize.value * pageScaleRatio.value}px`,
    height: `${brushSize.value * pageScaleRatio.value}px`
  }
})
// #endregion

/**
 * fitPage
 */
watchEffect(() => {
  if (atEditor.value) {
    setPageScaleRatio(fitScaleRatio.value)
  }
})
</script>
<style lang="scss">
.demo-btn {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-app-selection bg-opacity-30;
  @apply pointer-events-none rounded-full border border-solid border-8 border-primary-white;
}
</style>
