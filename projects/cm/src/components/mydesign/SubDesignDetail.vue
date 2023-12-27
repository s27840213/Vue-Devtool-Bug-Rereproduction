<template lang="pug">
div(
  v-show="currOpenSubDesign && subDesignThumbLoaded"
  class="absolute top-0 left-0 flex flex-col items-center gap-20 w-full h-full bg-dark-6 z-5 px-24 box-border py-16")
  div(v-if="currOpenSubDesign" class="w-fit h-fit overflow-hidden rounded-8")
    img(
      class="object-contain"
      :class="currOpenSubDesign.width >= currOpenSubDesign.height ? 'w-full' : 'h-full'"
      :style="{ 'aspect-ratio': `${currOpenSubDesign.width}/${currOpenSubDesign.height}` }"
      v-if="currOpenSubDesign"
      @load="handleThumbLoaded"
      :src="getSubDesignThumbUrl(currOpenSubDesign.type, currOpenSubDesign.id, currOpenSubDesign.subId)")
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
        v-if="promptRef?.scrollHeight !== promptRef?.clientHeight"
        iconColor="white"
        iconName="chevron-down"
        iconWidth="24px"
        @click="togglePrompt")
</template>
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'

const { t } = useI18n()

const userStore = useUserStore()
const { getSubDesignThumbUrl } = userStore
const { currMyDesignType, currOpenSubDesign } = storeToRefs(userStore)

const subDesignThumbLoaded = ref(false)
// use to prevent the UI shift when the thumb is loaded
const handleThumbLoaded = () => {
  setTimeout(() => {
    subDesignThumbLoaded.value = true
  }, 0)
}

// #region prompt related when sub desgin is open
// used to dynamically calculate the line-clamp size of the prompt
const isPromptExapnded = ref(false)

const promptContainerRef = ref<HTMLElement | null>(null)
const promptRef = ref<HTMLElement | null>(null)

const promptContainerSize = useElementSize(promptContainerRef)
const promptContainerLineClamp = computed(() => {
  if (isPromptExapnded.value) return 999

  if (promptContainerRef.value) {
    return Math.max(3, Math.floor(promptContainerSize.height.value / 19.2))
  }
  return 99
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
</script>
<style lang="scss"></style>
