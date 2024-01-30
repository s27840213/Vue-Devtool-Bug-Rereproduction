<template lang="pug">
div(class="recognizing-check relative flex-center flex-col gap-16 px-16 pt-8")
  svg-icon(
    class="absolute -top-6 right-16"
    iconName="x-mark"
    iconColor="yellow-0"
    iconWidth="24px"
    @click="close")
  span(class="typo-h5 text-yellow-0") {{ $t('CM0168') }}
  div(class="typo-body-md text-white text-center") {{ $t('CM0169') }}
  div(class="w-80 h-80")
    img(v-if="imgLoaded" :src="imgSrc" class="w-full h-full object-contain" :style="{ filter: `blur(${blur}px)` }")
  div(v-if="debugMode" class="w-full grid grid-cols-[auto,1fr,35px] items-center gap-8 text-white")
    span blur
    range-slider(v-model="blur" :min="0" :max="8" :step="0.1")
    span {{ `${blur}px` }}
</template>
<script setup lang="ts">
import useCanvasCm from '@/composable/useCanvasCm'
import { useEditorStore } from '@/stores/editor'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import RangeSlider from '@nu/vivi-lib/components/editor/mobile/RangeSlider.vue'
import { useGlobalStore } from '@/stores/global'

const { setCurrActiveFeature } = useEditorStore()
const { getCanvasDataUrl } = useCanvasCm()
const imgSrc = ref('')
const imgLoaded = ref(false)
const close = ref(() => {
  setCurrActiveFeature('none')
})

const { debugMode } = storeToRefs(useGlobalStore())
const blur = ref(0)

onMounted(async () => {
  const maskUrl = getCanvasDataUrl()
  const { flag, imageId, cleanup } = await cmWVUtils.sendScreenshotUrl(cmWVUtils.createUrlForJSON({ noBg: false, maskUrl }), { outputType: 'png' })
  if (flag !== '0') {
    logUtils.setLogAndConsoleLog('Screenshot Failed')
    throw new Error('Screenshot Failed')
  }

  imgSrc.value = `chmix://screenshot/${imageId}?lsize=160`
  imageUtils.imgLoadHandler(imgSrc.value, async () => {
    imgLoaded.value = true
    nextTick(cleanup)
  })
})

</script>
<style lang="scss"></style>

