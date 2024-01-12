<template lang="pug">
div(
  v-show="currOpenSubDesign && thumbLoaded"
  class="grid grid-rows-[minmax(0,1fr),auto] justify-items-center gap-20\ w-full h-full bg-dark-6 z-5 px-24 box-border py-16"
  ref="rootRef")
  div(
    v-if="currOpenSubDesign"
    ref="containerRef"
    class="w-full h-full relative"
    v-touch
    @swipeleft="handleSwipe($event, 'left')"
    @swiperight="handleSwipe($event, 'right')")
    div(
      class="w-full h-full grid justify-items-center items-center gap-8 overflow-hidden"
      :class="atEditor ? 'grid-rows-[minmax(0,1fr),auto]' : 'grid-rows-1'")
      div(
        class="result-showcase flex-center"
        :class="contentClass"
        :style="{ aspectRatio: `${currOpenSubDesign.width}/${currOpenSubDesign.height}` }")
        img(
          class="result-showcase__card result-showcase__card--back w-full h-full"
          :class="{ 'is-flipped': !showVideo }"
          v-if="currOpenSubDesign"
          @load="handleThumbLoaded"
          :src="showcaseImg")
        div(
          v-if="atEditor"
          class="result-showcase__card result-showcase__card--front w-full h-full absolute flex-center"
          :class="{ 'is-flipped': showVideo }")
          img(
            v-show="!isVideoLoaded"
            class="w-full h-full absolute top-0"
            :src="initImgSrc")
          video(
            v-if="!isExportingVideo"
            class="w-full h-full absolute top-0"
            ref="video"
            webkit-playsinline
            playsinline
            loop
            autoplay
            muted
            @loadeddata="videoOnload"
            :src="videoSrc")
      div(v-if="atEditor" class="flex-between-center gap-10 relative")
        div(
          class="w-8 h-8 rounded-full transition-colors pointer-events-none"
          :class="showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'")
        div(
          class="w-8 h-8 rounded-full transition-colors pointer-events-none"
          :class="!showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'")
        div(
          class="w-[100vh] h-[200%] absolute top-half left-half -translate-x-half -translate-y-half"
          @click="() => (showVideo = !showVideo)")
    div(
      v-if="isExportingVideo || (!showVideo && !isVideoLoaded)"
      class="result-showcase__dim-cover pointer-events-none")
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
import vuex from '@/vuex'
import { notify } from '@kyvg/vue3-notification'
import LoadingBrick from '@nu/vivi-lib/components/global/LoadingBrick.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import type { AnyTouchEvent } from 'any-touch'

const { t } = useI18n()

const { atEditor, inSavingState } = useStateInfo()

const userStore = useUserStore()
const {
  getSubDesignThumbUrl,
  getSubDesignConfig,
  setCurrOpenSubDesign,
  setRemoveWatermark,
  setHighResolutionPhoto,
  getInitialImg
} = userStore
const { currOpenSubDesign, removeWatermark } = storeToRefs(userStore)

if (!vuex.getters['payment/getPayment'].subscribe) {
  setRemoveWatermark(false)
  setHighResolutionPhoto(false)
  // don't record to localStorage, so that the preference can be restored if subscription is restored.
}

const editorStore = useEditorStore()
const {
  currDesignId,
  currSubDesignId,
  myDesignSavedType,
  initImgSrc,
  generatedResults,
  currGenResultIndex,
} = storeToRefs(editorStore)

const videoRecordStore = useVideoRcordStore()
const { addImage, genVideo } = videoRecordStore
const { isExportingVideo, isGeningVideo } = storeToRefs(videoRecordStore)
const { currGeneratedResult } = storeToRefs(editorStore)

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
        type: myDesignSavedType.value,
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

  // if the video is udf generate it
  const currGenResult = currGeneratedResult.value
  if (!currGenResult.video?.src && !isGeningVideo.value) {
    await addImage(getInitialImg(), imageUtils.appendRandomQuery(currGeneratedResult.value.url))
      .catch(async () => {
        await addImage(initImgSrc.value, currGeneratedResult.value.url)
      })
    genVideo()
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
const isExpandable = ref(true)

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

let checkTimer = -1

const checkExpandable = () => {
  if (
    promptRef.value?.scrollHeight ||
    promptRef.value?.clientHeight ||
    !currOpenSubDesign.value ||
    currOpenSubDesign.value.prompt === ''
  ) {
    isExpandable.value = promptRef.value?.scrollHeight !== promptRef.value?.clientHeight
    return
  }
  checkTimer = window.setTimeout(checkExpandable, 100)
}

checkExpandable()

watch(currOpenSubDesign, (newVal) => {
  if (newVal) checkExpandable()
})

onBeforeUnmount(() => {
  clearTimeout(checkTimer)
})

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
const containerRef = ref<HTMLElement | null>(null)
const containerSize = useElementBounding(containerRef)
const contentClass = computed(() => {
  if (
    !currOpenSubDesign.value ||
    containerSize.width.value === 0 ||
    containerSize.height.value === 0
  )
    return ''
  return currOpenSubDesign.value.width / currOpenSubDesign.value.height >
    containerSize.width.value / containerSize.height.value
    ? 'w-full'
    : 'h-full'
})

const video = ref<HTMLVideoElement | null>(null)
const isVideoLoaded = ref(false)
const showVideo = ref(true)

const videoSrc = computed(() => {
  if (currGeneratedResult.value.video) {
    return currGeneratedResult.value.video.src
  } else return ''
})
const videoOnload = () => {
  isVideoLoaded.value = true
}

watch(
  () => videoSrc.value,
  () => {
    isVideoLoaded.value = false
  },
)

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

const handleSwipe = (e: AnyTouchEvent, dir: 'left' | 'right') => {
  e.stopImmediatePropagation()
  if (!atEditor.value) return
  showVideo.value = dir === 'right'
}

const watermarkReady = ref(false)
const showcaseWatermarkImgUrl = ref('')

const showcaseImgUrl = computed(() => {
  if (atEditor.value) {
    return imageUtils.appendQuery(
      generatedResults.value[currGenResultIndex.value].url,
      'rand_ver',
      `${generalUtils.serialNumber}`,
    )
  }
  if (currOpenSubDesign.value) {
    // Always true due to the v-if condition.
    return getSubDesignThumbUrl(
      currOpenSubDesign.value.type,
      currOpenSubDesign.value.id,
      currOpenSubDesign.value.subId,
      1000,
    )
  }
  return ''
})

const showcaseImg = computed(() => {
  return watermarkReady.value && !removeWatermark.value
    ? showcaseWatermarkImgUrl.value
    : showcaseImgUrl.value
})

const genWatermarkUrl = (url: string) => {
  if (!url) return
  watermarkReady.value = false
  cmWVUtils.addWaterMark2Img(url, 'jpg', 100).then((dataURL) => {
    showcaseWatermarkImgUrl.value = dataURL
    watermarkReady.value = true
  })
}

watch(showcaseImgUrl, (newVal) => {
  genWatermarkUrl(newVal)
})

genWatermarkUrl(showcaseImgUrl.value)
// #endregion
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
