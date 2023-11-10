<template lang="pug">
div(class="gen-result w-full px-24 flex flex-col gap-16 border-box")
  div(class="grid grid-rows-1 grid-cols-[auto,auto,auto,minmax(0,1fr)] gap-x-16 items-center box-border")
    div(class="gen-result__block flex rounded-lg bg-app-btn-primary-text" @click="setGenResultIndex(-1)")
      div(
        class="box-border outline-2 outline rounded-lg w-full h-full transition-all duration-300"
        :class="[currGenResultIndex === -1 ? 'outline-app-tab-active' : 'outline-transparent']")
        div(class="overflow-hidden rounded-lg w-full h-full px-2 py-4 box-border")
          img(class="w-full h-full object-contain" :src="initImgSrc")
    div(class="bg-app-tab-disable w-2 h-4/5")
    scrollable-container(
      :px="4"
      :py="4")
      div(
        class="gen-result__block rounded-md bg-neutral-dark-active flex flex-col justify-center items-center"
        @click="showMoreRes")
        cm-svg-icon(
          iconName="crown"
          iconColor="app-tab-active"
          iconWidth="24px")
        span(class="text-app-text-secondary typo-btn-sm") {{ $t('CM0068') }}
      //- div(
      //-   v-for="(genResult, index) in 10"
      //-   :key="index"
      //-   class="gen-result__block flex rounded-lg bg-app-btn-primary-text"
      //-   @click="setGenResultIndex(index)")
      //-   div(
      //-     class="box-border outline-2 outline rounded-lg w-full h-full"
      //-     :class="{ 'outline-app-tab-active': index === currGenResultIndex }")
      //-     div(class="overflow-hidden w-full h-full")
      //-       //- img(class="w-full h-full object-cover" src="@/assets/img/test.jpg")
      div(
        v-for="(genResult, index) in generatedResults"
        :key="index"
        class="gen-result__block flex rounded-lg bg-app-btn-primary-text"
        @click="setGenResultIndex(index)")
        div(
          class="box-border outline-2 outline rounded-lg w-full h-full transition-all duration-300"
          :class="[index === currGenResultIndex ? 'outline-app-tab-active' : 'outline-transparent']")
          div(class="overflow-hidden rounded-lg w-full h-full")
            img(
              v-if="genResult.url.length"
              class="w-full h-full object-cover"
              :src="apeendRandomQuery(genResult.url)")
  div(class="flex flex-col gap-8 justify-between items-center")
    cm-btn(
      theme="primary"
      size="md"
      :full="true"
      @clickBtn="handleKeepEditing"
      :disabled="true") {{ $t('CM0067') }}
    span(class="text-app-text-secondary typo-btn-md") {{ `${$t('CM0066')}: ${100}` }}
</template>
<script setup lang="ts">
import useGenImageUtils from '@/composable/useGenImageUtils'
import { useEditorStore } from '@/stores/editor'
import { notify } from '@kyvg/vue3-notification'
import { generalUtils } from '@nu/shared-lib'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'

const editorStore = useEditorStore()
const { setGenResultIndex, unshiftGenResults, updateGenResult, keepEditingInit } = editorStore
const { generatedResults, currGenResultIndex, initImgSrc } = storeToRefs(editorStore)

const { genImage } = useGenImageUtils()

const showMoreRes = () => {
  const id = generalUtils.generateRandomString(4)
  unshiftGenResults('', id)
  genImage('', true)
    .then((url) => {
      updateGenResult(id,  { url })
    })
    .catch((error) => {
      logUtils.setLogForError(error as Error)
      notify({
        group: 'error',
        text: `Generate Failed`,
      })
    })
}

const apeendRandomQuery = (url: string) => {
  return imageUtils.appendRandomQuery(url)
}

const handleKeepEditing = () => {
  keepEditingInit()
}
</script>
<style lang="scss" scoped>
.gen-result__block {
  height: 80px;
  aspect-ratio: 50/80;
}
</style>
