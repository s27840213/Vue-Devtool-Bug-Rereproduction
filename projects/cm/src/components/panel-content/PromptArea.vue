<template lang="pug">
div(class="flex flex-col justify-center items-center w-full px-24 gap-16")
  div(class="relative w-full")
    span(class="text-app-tab-default typo-btn-lg") {{ $t('CM0022') }}
    cm-svg-icon(v-if="false" iconName="settings" class="text-app-tab-default absolute right-0 top-1/2 -translate-y-1/2")
  div(class="w-full relative")
    textarea(
      class="w-full p-10 rounded-[10px] bg-primary-light-active typo-body-sm h-64 tutorial-powerful-fill-4--clickable"
      :placeholder="$t('CM0024')"
      :autofocus="!isDuringTutorial"
      v-model="promptText")
    transition(name="clear-btn-transition")
      div(
        v-if="promptLen > 0"
        class="absolute bottom-10 right-10 text-app-text-primary typo-body-sm"
        @click="clearPromt")
        span {{ $t('CM0029') }}
  cm-btn(
    theme="primary"
    size="md"
    :full="true"
    :disabled="isGenerating"
    @click="handleGenerate") {{ isGenerating ? 'Generating...' : $t('CM0023') }}
</template>
<script setup lang="ts">
import useGenImageUtils from '@/composable/useGenImageUtils';
import { useEditorStore } from '@/stores/editor';
import tutorialUtils from '@/utils/tutorialUtils';
import logUtils from '@nu/vivi-lib/utils/logUtils';

const editorStore = useEditorStore()
const router = useRouter()
const {setIsGenerating, setGeneratedResult, setShowGenResult} = editorStore
const { isGenerating } = storeToRefs(editorStore)
const promptText = ref('')
const promptLen = computed(() => promptText.value.length)
const isDuringTutorial = tutorialUtils.isDuringTutorial
const { genImage } = useGenImageUtils()

const handleGenerate = () => {
  setIsGenerating(true)
  // setGeneratedResult('https://asset.vivipic.com/charmix/HVDSrQpG4iRTDHkqvU3Y/output/231030115145557ftqnuIbG.png?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1699242747&Signature=E8P5c%2B3fO9b%2BvF%2BhCi1IJdT79ik%3D&X-Amzn-Trace-Id=Root%3D1-653f287b-585cd2fd4f2337005d01b2fd%3BParent%3D78c0465c20c9e530%3BSampled%3D0%3BLineage%3Dee147589%3A0')
  // setShowGenResult(true)
  genImage(promptText.value).then(url => {
    setGeneratedResult(url)
    setShowGenResult(true)
    setIsGenerating(false)
    console.log(url)
  }).catch(error => {
    logUtils.setLogForError(error as Error)
    setIsGenerating(false)
  })
}
const clearPromt = () => {
  promptText.value = ''
}
</script>
<style lang="scss">
.clear-btn-transition {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from {
    opacity: 0;
    transform: translateX(50%);
  }
  &-leave-to {
    opacity: 0;
    transform: translateX(-50%);
  }
}
</style>
