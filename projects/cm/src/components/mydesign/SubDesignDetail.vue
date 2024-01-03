<template lang="pug">
div(
  v-show="currOpenSubDesign && thumbLoaded"
  class="grid grid-rows-[minmax(0,1fr),auto] justify-items-center gap-20 w-full h-full bg-dark-6 z-5 px-24 box-border py-16"
  ref="rootRef")
  div(
    v-if="currOpenSubDesign"
    class="w-full h-full relative"
    v-touch
    @swipeleft="handleSwipeLeft"
    @swiperight="handleSwipeRight")
    div(
      class="w-full h-full grid justify-items-center items-center gap-8 overflow-hidden"
      :class="atEditor ? 'grid-rows-[minmax(0,1fr),auto]' : 'grid-rows-1'")
      div(
        class="result-showcase flex-center"
        ref="resultShowcase"
        :class="currOpenSubDesign.width >= currOpenSubDesign.height ? 'w-full' : 'h-full'"
        :style="{ aspectRatio: `${currOpenSubDesign.width}/${currOpenSubDesign.height}` }")
        img(
          class="result-showcase__card result-showcase__card--back w-full h-full"
          :class="{ 'is-flipped': !showVideo }"
          v-if="currOpenSubDesign"
          @load="handleThumbLoaded"
          :src="atEditor ? generatedResults[currGenResultIndex].url : getSubDesignThumbUrl(currOpenSubDesign.type, currOpenSubDesign.id, currOpenSubDesign.subId)")
        div(
          v-if="atEditor"
          class="result-showcase__card result-showcase__card--front w-full h-full absolute flex-center"
          :class="{ 'is-flipped': showVideo }")
          img(
            v-show="!isVideoLoaded"
            class="w-full h-full absolute inset-0"
            :src="initImgSrc")
          video(
            v-show="isVideoLoaded"
            class="w-full h-full absolute inset-0"
            ref="video"
            webkit-playsinline
            playsinline
            loop
            autoplay
            mutes
            @loadeddata="() => { isVideoLoaded = true }"
            :src="generatedResults[currGenResultIndex].video")
          div(v-if="!isVideoLoaded && !isExportingVideo" class="result-showcase__dim-cover")
            loading-brick(class="z-median")
      div(
        v-if="atEditor"
        class="flex-between-center gap-10"
        @click="() => (showVideo = !showVideo)")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="!showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'")
    div(v-if="isExportingVideo" class="result-showcase__dim-cover")
      loading-brick(class="z-median")
  div(class="flex flex-col gap-8 text-white w-full h-fit")
    div(class="flex items-center gap-4 w-full")
      svg-icon(
        iconName="prompt"
        iconWidth="24px"
        @click="copyPrompt")
      span(class="typo-h6") {{ `${$t('CM0126')} :` }}
    div(
      class="h-full w-full grid grid-rows-1 grid-cols-[auto,auto] box-border items-end"
      ref="promptContainerRef")
      div(
        v-if="currOpenSubDesign"
        class="text-left typo-body-sm line-clamp-base"
        :ref="'promptRef'"
        :style="{ '-webkit-line-clamp': promptContainerLineClamp }") {{ `${currOpenSubDesign.prompt}` }}
      svg-icon(
        v-if="isExpandable"
        iconColor="white"
        iconName="chevron-down"
        iconWidth="24px"
        :style="isPromptExapnded ? 'transition: transform linear 0.1s; transform: scaleY(-1)' : ''"
        @click="togglePrompt")
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import { useVideoRcordStore } from '@/stores/videoRecord'
import { notify } from '@kyvg/vue3-notification'
import LoadingBrick from '@nu/vivi-lib/components/global/LoadingBrick.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import type { AnyTouchEvent } from 'any-touch'

const { t } = useI18n()

const { atEditor, inSavingState } = useStateInfo()

const userStore = useUserStore()
const { getSubDesignThumbUrl, getSubDesignConfig, setCurrOpenSubDesign } = userStore
const { currOpenSubDesign } = storeToRefs(userStore)

const editorStore = useEditorStore()
const {
  currDesignId,
  currSubDesignId,
  editorType,
  initImgSrc,
  generatedResults,
  currGenResultIndex,
} = storeToRefs(editorStore)

const videoRecordStore = useVideoRcordStore()
const { isExportingVideo } = storeToRefs(videoRecordStore)

const thumbLoaded = ref(false)
// use to prevent the UI shift when the thumb is loaded
const handleThumbLoaded = () => {
  setTimeout(() => {
    thumbLoaded.value = true
  }, 0)
}
onMounted(async () => {
  if (atEditor.value) {
    const data = await getSubDesignConfig(
      {
        type: editorType.value,
        id: currDesignId.value,
      },
      currSubDesignId.value,
    )
    if (data) {
      const { flag, content } = data

      if (flag === '0') {
        setCurrOpenSubDesign(content)
      }
    }
  }
})

onBeforeUnmount(() => {
  if (atEditor.value) {
    setCurrOpenSubDesign(undefined)
  }
})

// #region prompt related when sub desgin is open
// used to dynamically calculate the line-clamp size of the prompt
const isPromptExapnded = ref(false)
const isExpandable = ref(false)

const promptContainerRef = ref<HTMLElement | null>(null)
const promptRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)

// const promptContainerSize = useElementSize(promptContainerRef)
const promptContainerLineClamp = computed(() => {
  if (isPromptExapnded.value) {
    if (!rootRef.value) return 999
    return Math.floor((rootRef.value.clientHeight * 0.4) / 19.2)
  }

  if (promptContainerRef.value) {
    return 3
  }
  return 99
})

const checkExpandable = () => {
  logUtils.setLogAndConsoleLog(
    'SubDesignDetail.vue:169',
    promptRef.value?.scrollHeight,
    promptRef.value?.clientHeight,
    currOpenSubDesign.value?.prompt,
  )
  if (
    promptRef.value?.scrollHeight ||
    promptRef.value?.clientHeight ||
    currOpenSubDesign.value?.prompt === ''
  ) {
    isExpandable.value = promptRef.value?.scrollHeight !== promptRef.value?.clientHeight
    logUtils.setLogAndConsoleLog('SubDesignDetail.vue:176', isExpandable.value)
    return
  }
  setTimeout(checkExpandable, 100)
}

checkExpandable()

const togglePrompt = () => {
  isPromptExapnded.value = !isPromptExapnded.value
}

const copyPrompt = () => {
  if (currOpenSubDesign.value === undefined) return
  generalUtils.copyText(currOpenSubDesign.value?.prompt).then(() => {
    notify({ group: 'success', text: `${t('CM0128')}` })
  })
}
// #endregion

// #region result showcase
const video = ref<HTMLVideoElement | null>(null)
const resultShowcase = ref<HTMLElement | null>(null)
const isVideoLoaded = ref(false)
const showVideo = ref(true)

watch(
  () => inSavingState.value,
  (val) => {
    if (val) {
      showVideo.value = true
      isVideoLoaded.value = false
    }
  },
)

watch(showVideo, (newVal) => {
  if (video.value) {
    if (!newVal) {
      video.value.currentTime = 0
    }
  }
})
// #endregion

const handleSwipeLeft = (e: AnyTouchEvent) => {
  e.stopImmediatePropagation()
  showVideo.value = false
}

const handleSwipeRight = (e: AnyTouchEvent) => {
  e.stopImmediatePropagation()
  showVideo.value = true
}
</script>
<style lang="scss">
.result-showcase {
  transform-style: preserve-3d;

  &__card {
    @apply max-h-full overflow-hidden rounded-8;
    backface-visibility: hidden;
    transition: transform 0.6s;
  }

  &__dim-cover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.631372549);
  }
}

.is-flipped {
  transform: rotateY(180deg);
}
</style>
