<template lang="pug">
div(class="gen-result w-full px-24 flex flex-col gap-16 border-box")
  div(class="grid grid-rows-1 grid-cols-[auto,auto,auto,minmax(0,1fr)] gap-x-16 items-center box-border")
    div(class="gen-result__block flex rounded-lg bg-app-btn-primary-text" @click="setGenResultIndex(-1)")
      div(
        class="box-border outline-2 outline rounded-lg w-full h-full transition-all duration-300"
        :class="[currGenResultIndex === -1 ? 'outline-primary-normal' : 'outline-transparent']")
        div(class="overflow-hidden rounded-lg w-full h-full px-2 py-4 box-border")
          img(class="w-full h-full object-contain" :src="initImgSrc")
    div(class="bg-app-tab-disable w-2 h-4/5")
    scrollable-container(
      :px="4"
      :py="4")
      div(
        class="gen-result__block rounded-md bg-neutral-dark-active flex flex-col justify-center items-center"
        @click="showMoreRes")
        svg-icon(
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
      transition-group(name="list")
        div(
          v-for="(genResult, index) in generatedResults"
          :key="genResult.id"
          class="gen-result__block flex rounded-lg relative"
          @click="genResult.url.length && setGenResultIndex(index)")
          div(
            class="box-border outline-2 outline rounded-lg w-full h-full transition-all duration-300 z-2"
            :class="[index === currGenResultIndex ? 'outline-primary-normal' : 'outline-transparent']")
            div(class="overflow-hidden rounded-lg w-full h-full")
              img(
                v-if="genResult.url.length"
                class="w-full h-full object-cover"
                :src="appendSizeQuery(genResult.url)")
          div(v-if="!genResult.url.length" class="loading-block")
          div(class="absolute top-0 left-0 rounded-lg w-full h-full bg-app-tab-bg z-1")
  div(class="flex flex-col gap-8 justify-between items-center")
    nubtn(
      size="mid-full"
      @clickBtn="handleKeepEditing"
      :disabled="true") {{ $t('CM0067') }}
    span(class="text-app-text-secondary typo-btn-md") {{ `${$t('CM0066')}: ${100}` }}
</template>
<script setup lang="ts">
import useGenImageUtils from '@/composable/useGenImageUtils'
import i18n from '@/i18n'
import { useEditorStore } from '@/stores/editor'
import { notify } from '@kyvg/vue3-notification'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import logUtils from '@nu/vivi-lib/utils/logUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import useI18n from '@nu/vivi-lib/i18n/useI18n'

const editorStore = useEditorStore()
const {
  setGenResultIndex,
  unshiftGenResults,
  removeGenResult,
  updateGenResult,
  changeEditorState,
  keepEditingInit,
} = editorStore
const { generatedResults, currGenResultIndex, initImgSrc, inGenResultState, generatedResultsNum } =
  storeToRefs(editorStore)

const { genImage } = useGenImageUtils()
const { t } = useI18n()

const showMoreRes = async () => {
  const genNum = 2
  const ids: string[] = []
  for (let i = 0; i < genNum; i++) {
    ids.push(generalUtils.generateRandomString(4))
    unshiftGenResults('', ids[i])
  }
  try {
    await genImage('', true, genNum, {
      onSuccess: (index, imgSrc) => {
        updateGenResult(ids[index], { url: imgSrc })
      },
      onError: (index, url, reason) => {
        logUtils.setLogAndConsoleLog(`${reason} for ${ids[index]}: ${url}`)
        modalUtils.setModalInfo(
          `${t('CM0087')} ${t('CM0089')}`,
          t('CM0088'),
          { msg: t('STK0023') },
        )
        removeGenResult(ids[index])
        if (generatedResultsNum.value === 0 && inGenResultState.value) {
          changeEditorState('prev')
        }
      },
    })
  } catch (error) {
    logUtils.setLogForError(error as Error)
    modalUtils.setModalInfo(
      t('CM0087'),
      t('CM0088'),
      { msg: t('STK0023') },
    )
    for (const id of ids) {
      removeGenResult(id)
    }
    if (generatedResultsNum.value === 0 && inGenResultState.value) {
      changeEditorState('prev')
    }
  }
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
    background: linear-gradient(0deg, #ffffff 40%, #e4b61f 100%);
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
