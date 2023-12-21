<template lang="pug">
div(class="gen-result w-full px-24 flex flex-col gap-16 border-box")
  div(class="grid grid-rows-1 grid-cols-[auto,auto,auto,minmax(0,1fr)] gap-x-16 items-center box-border")
    div(
      class="gen-result__block rounded-8 bg-white overflow-hidden"
      @pointerdown="toggleOriginalImg(true)"
      @pointerup="toggleOriginalImg(false)")
      img(
        class="w-full h-full object-cover"
        draggable="false"
        :src="initImgSrc")
    div(class="bg-lighter w-2 h-4/5")
    scrollable-container(
      :px="4"
      :py="4")
      div(
        v-if="editorStore.editorType === 'powerful-fill'"
        class="gen-result__block rounded-8 bg-dark-6 flex-center flex-col"
        :class="{ 'pointer-events-none': isGenerating }"
        @click="showMoreRes")
        svg-icon(
          iconName="crown"
          :iconColor="isGenerating ? 'lighter' : 'yellow-cm'"
          iconWidth="24px")
        span(
          class="typo-btn-sm transition-colors duration-[0.4s]"
          :class="[isGenerating ? 'text-lighter' : 'text-white']") {{ $t('CM0068') }}
      transition-group(name="list")
        div(
          v-for="(genResult, index) in generatedResults"
          :key="genResult.id"
          class="gen-result__block flex rounded-8 relative"
          @click="genResult.url.length && setCurrGenResultIndex(index)")
          div(
            class="box-border outline-2 outline rounded-8 w-full h-full transition-all duration-300 z-2"
            :class="[index === currGenResultIndex && genResult.url.length ? 'outline-yellow-cm' : 'outline-transparent']")
            div(class="overflow-hidden rounded-8 w-full h-full")
              img(
                v-if="genResult.url.length"
                class="w-full h-full object-cover"
                draggable="false"
                :src="appendSizeQuery(genResult.url)")
          div(v-if="!genResult.url.length" class="loading-block")
          div(class="absolute top-0 left-0 rounded-8 w-full h-full bg-dark-3 z-1")
  div(class="flex-between-center flex-col gap-8")
    nubtn(
      v-if="editorStore.editorType === 'powerful-fill'"
      size="mid-full"
      :disabled="!generatedResults[currGenResultIndex] || generatedResults[currGenResultIndex].url.length === 0"
      @click="handleKeepEditing") {{ $t('CM0067') }}
    nubtn(
      v-else
      size="mid-full"
      :disabled="isGenerating"
      @click="showMoreRes") {{ $t('CM0068') }}
    span(class="text-white typo-btn-md") {{ `${$t('CM0066')}: ${100}` }}
</template>

<script setup lang="ts">
import useGenImageUtils from '@/composable/useGenImageUtils'
import { useEditorStore } from '@/stores/editor'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'

const editorStore = useEditorStore()
const { setCurrGenResultIndex, keepEditingInit } = editorStore
const {
  generatedResults,
  currGenResultIndex: _currGenResultIndex,
  initImgSrc,
  isGenerating,
} = storeToRefs(editorStore)

const currGenResultIndex = computed(() => {
  return _currGenResultIndex.value > -1 ? _currGenResultIndex.value : tempGenResultIndex
})

let tempGenResultIndex = -1
const toggleOriginalImg = (show: boolean) => {
  if (show) {
    tempGenResultIndex = currGenResultIndex.value
    setCurrGenResultIndex(-1)
  } else {
    setCurrGenResultIndex(tempGenResultIndex)
    tempGenResultIndex = -1
  }
}

const { genImageFlow } = useGenImageUtils()
const showMoreRes = async () => {
  await genImageFlow({ prompt: '', action: 'powerful-fill' }, true, 2)
}

const appendSizeQuery = (url: string, size = 200) => {
  return imageUtils.appendQuery(url, 'lsize', `${size}`)
}

const handleKeepEditing = () => {
  keepEditingInit()
}
</script>
<style lang="scss" scoped>
$loading-padding: 4px;
.gen-result__block {
  height: 80px;
  aspect-ratio: 50/80;
}

.loading-block {
  @apply absolute top-0 left-0 w-full h-full box-border overflow-hidden;
  transform: scaleX(1.132) scaleY(1.06);
  border-radius: 10px;
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    height: 100%;
    aspect-ratio: 1/1;
    background: linear-gradient(0deg, rgba(255, 255, 255, 0.4) 40%, #e4b61f 100%);
    transform: translateX(-50%) rotate(90deg) scale(1.2);
    animation: rotate 1.2s linear infinite;
    // bcz loading-block has transform, so the stacking context is different, make z-index won't work
    // z-index: -1;
  }
}

@keyframes rotate {
  0% {
    transform: translateX(-50%) scale(1.2) rotate(0deg);
  }
  100% {
    transform: translateX(-50%) scale(1.2) rotate(360deg);
  }
}

.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
