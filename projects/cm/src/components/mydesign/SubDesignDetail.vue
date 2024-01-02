<template lang="pug">
div(
  v-show="currOpenSubDesign && thumbLoaded"
  class="flex flex-col items-center gap-20 w-full h-full bg-dark-6 z-5 px-24 box-border py-16")
  //- :style="{ 'aspect-ratio': `${currOpenSubDesign.width}/${currOpenSubDesign.height}` }"
  div(v-if="currOpenSubDesign" class="w-fit h-full relative")
    template(v-if="!atEditor")
      img(
        class="object-contain rounded-8"
        :class="currOpenSubDesign.width >= currOpenSubDesign.height ? 'w-full' : 'h-full'"
        v-if="currOpenSubDesign"
        @load="handleThumbLoaded"
        :src="getSubDesignThumbUrl(currOpenSubDesign.type, currOpenSubDesign.id, currOpenSubDesign.subId)")
    div(v-else class="w-full h-full flex-center flex-col gap-8 overflow-hidden p-16 box-border")
      div(
        class="result-showcase w-full h-full overflow-hidden flex-center abosolute top-0"
        ref="resultShowcase")
        img(
          class="result-showcase__card result-showcase__card--back rounded-8"
          :class="{ 'is-flipped': !showVideo }"
          @load="handleThumbLoaded"
          :src="getSubDesignThumbUrl(currOpenSubDesign.type, currOpenSubDesign.id, currOpenSubDesign.subId)")
        div(
          class="result-showcase__card result-showcase__card--front w-full h-full absolute flex-center"
          :class="{ 'is-flipped': showVideo }")
          img(
            v-show="!isVideoLoaded"
            class="w-full h-full absolute top-0 left-0 object-contain"
            :src="initImgSrc")
          video(
            v-show="isVideoLoaded"
            class="w-full h-full absolute top-0 left-0"
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
      div(class="flex-between-center gap-10")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'"
          @click="() => (showVideo = true)")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="!showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'"
          @click="() => (showVideo = false)")
    div(v-if="isExportingVideo" class="result-showcase__dim-cover")
      loading-brick(class="z-median")
  div(class="flex flex-col gap-8 text-white w-full h-fit flex-1")
    div(class="flex items-center gap-4 w-full")
      svg-icon(
        iconName="prompt"
        iconWidth="24px"
        @click="copyPrompt")
      span(class="typo-h6") {{ `${$t('CM0126')} :` }}
    div(class="h-full w-full grid grid-rows-1 grid-cols-[auto,auto] box-border" ref="promptContainerRef")
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

// const promptContainerSize = useElementSize(promptContainerRef)
const promptContainerLineClamp = computed(() => {
  if (isPromptExapnded.value) return 999

  if (promptContainerRef.value) {
    // return Math.max(3, Math.floor(promptContainerSize.height.value / 19.2))
    return 3
  }
  return 99
})

const checkExpandable = () => {
  if (
    promptRef.value?.scrollHeight ||
    promptRef.value?.clientHeight ||
    currOpenSubDesign.value?.prompt === ''
  ) {
    isExpandable.value = promptRef.value?.scrollHeight !== promptRef.value?.clientHeight
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
</script>
<style lang="scss">
.result-showcase {
  transform-style: preserve-3d;

  &__card {
    @apply max-h-full object-contain;
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
