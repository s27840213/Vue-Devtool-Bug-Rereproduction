<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar
  div(class="flex justify-center items-center" ref="editorContainerRef")
    div(class="w-full h-full box-border overflow-scroll flex justify-center items-center")
      div(:style="wrapperStyles")
        transition(
          name="fade-right-in"
          mode="out-in")
          div(
            class="page bg-primary-white origin-top-left overflow-hidden flex items-center justify-center"
            :style="pageStyles")
            img(class="h-full object-contain" src="@/assets/img/test.jpg")
</template>
<script setup lang="ts">
import useImageUtils from '@/composable/useImageUtils'
import { useEditorStore } from '@/stores/editor'
import { useElementSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'

const editorContainerRef = ref<HTMLElement | null>(null)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementSize(editorContainerRef)

const { imgLoadHandler, getImageUrl } = useImageUtils()

onMounted(() => {
  imgLoadHandler(getImageUrl('test', 'jpg'), (img) => {
    console.log(img.width / img.height)
    setInitAspectRatio(img.width / img.height)
  })
})

// #region Editor Store
const editorStore = useEditorStore()
const { setPageScaleRatio, setInitAspectRatio } = editorStore
const { editingPage, pageSize, pageScaleRatio } = storeToRefs(editorStore)
// #endregion

onBeforeRouteLeave((to, from) => {
  if (from.name === 'Editor') {
    editorStore.$reset()
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
/**
 * fitPage
 */
watchEffect(() => {
  setPageScaleRatio(fitScaleRatio.value)
})
</script>
<style lang="scss"></style>
