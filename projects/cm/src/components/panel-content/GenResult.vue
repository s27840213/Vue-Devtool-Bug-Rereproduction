<template lang="pug">
div(class="gen-result w-full px-24 flex flex-col gap-16 border-box")
  div(class="flex-start-center gap-x-8")
    //- Original img
    div(
      class="gen-result__block bg-white overflow-hidden flex-shrink-0"
      @pointerdown="toggleOriginalImg(true)"
      @pointerup="toggleOriginalImg(false)")
      img(
        class="w-full h-full object-cover"
        draggable="false"
        :src="initImgSrc")
    div(class="bg-lighter w-2 h-56 flex-shrink-0")
    //- Show more btn
    div(
      v-if="editorStore.editorType === 'powerful-fill'"
      class="gen-result__block bg-dark-6 flex-center flex-col flex-shrink-0"
      :class="{ 'pointer-events-none': disableShowMoreBtn }"
      @click="showMoreRes")
      svg-icon(
        iconName="crown"
        :iconColor="disableShowMoreBtn ? 'lighter' : 'yellow-cm'"
        iconWidth="24px")
      span(
        class="typo-btn-sm transition-colors duration-[0.4s]"
        :class="[disableShowMoreBtn ? 'text-lighter' : 'text-white']") {{ $t('CM0068') }}
    scrollable-container(
      :px="0"
      :py="0"
      :gap="10"
      v-fade-scroller="{ fadeWidth: '24px', prev: false }")
      transition-group(name="list")
        //- Results
        div(
          v-for="(genResult, index) in generatedResults"
          :key="genResult.id"
          class="gen-result__block overflow-clip"
          :active="index === currGenResultIndex && !!genResult.url.length"
          @click="genResult.url.length && setCurrGenResultIndex(index)")
          img(
            v-if="genResult.url.length"
            class="w-full h-full object-cover"
            draggable="false"
            :src="appendSizeQuery(genResult.url)")
          div(v-else class="loading-block")
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
      icon="crown"
      @click="showMoreRes") {{ $t('CM0068') }}
    span(v-if="!isPro" class="text-white typo-btn-md") {{ `${$t('CM0066')}: ${aiCredit}` }}
</template>

<script setup lang="ts">
import useGenImageUtils from '@/composable/useGenImageUtils'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import vuex from '@/vuex'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'

const userStore = useUserStore()
const { prevGenParams, aiCredit } = storeToRefs(userStore)

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

const isPro = computed(() => vuex.getters['payment/getPayment'].subscribe)

const { genImageFlow } = useGenImageUtils()
const disableShowMoreBtn = computed(() => {
  return isGenerating.value || prevGenParams.value.requestId === ''
})

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
.gen-result__block {
  @apply relative h-80 w-45 rounded-8;
  &::after {
    // Highlight outline on the img.
    @apply absolute inset-0 w-full h-full box-border rounded-8;
    content: '';
    transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
    border: 0px solid setColor(yellow-cm);
  }
  &[active='true']::after {
    border-width: 2px;
  }
}

.loading-block {
  @apply relative w-full h-full overflow-hidden rounded-8;
  &::before {
    // Spinner animation.
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    height: 100%;
    aspect-ratio: 1/1;
    background: linear-gradient(0deg, rgba(255, 255, 255, 0.4) 40%, #e4b61f 100%);
    transform: translateX(-50%) rotate(90deg) scale(1.2);
    animation: rotate 1.2s linear infinite;
  }
  &::after {
    // Img placeholder on the spinner.
    @apply absolute inset-2 rounded-8 bg-dark-3;
    content: '';
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
