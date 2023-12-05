<template lang="pug">
div(
  class="flex flex-col justify-center items-center w-full box-border px-24 gap-16"
  :class="{'pointer-events-none': preview}")
  div(class="relative w-full")
    span(class="text-app-tab-default typo-btn-lg") {{ $t('CM0022') }}
    svg-icon(
      v-if="false"
      iconName="cm_settings"
      class="text-app-tab-default absolute right-0 top-1/2 -translate-y-1/2")
  div(class="w-full relative")
    textarea(
      class="w-full box-border p-10 rounded-[10px] bg-primary-light-active typo-body-sm h-64 tutorial-powerful-fill-4--clickable tutorial-hidden-message-4--clickable"
      :placeholder="$t('CM0024')"
      :autofocus="!isDuringTutorial"
      v-model="promptText")
    transition(name="clear-btn-transition")
      div(
        v-if="promptLen > 0"
        class="absolute bottom-10 right-10 text-app-text-primary typo-body-sm"
        @click="clearPromt")
        span {{ $t('CM0029') }}
  nubtn(
    v-if="!preview"
    size="mid-full"
    :disabled="isGenerating"
    @click="handleGenerate") {{ isGenerating ? 'Generating...' : $t('CM0023') }}
</template>
<script setup lang="ts">
import useCanvasUtils from '@/composable/useCanvasUtilsCm'
import useGenImageUtils from '@/composable/useGenImageUtils'
import useTutorial from '@/composable/useTutorial'
import { useEditorStore } from '@/stores/editor'
import { useGlobalStore } from '@/stores/global'
import vuex from '@/vuex'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'

const props = defineProps({
  // for panelDescription
  preview: {
    type: Boolean,
    default: false,
  },
})
const { preview } = toRefs(props)

// #region states, composables, and vars
const globalStore = useGlobalStore()
const { setShowSpinner, setSpinnerText, debugMode } = globalStore

const editorStore = useEditorStore()
const { setIsGenerating, unshiftGenResults, changeEditorState, setCurrPrompt } = editorStore
const { isGenerating, currPrompt } = storeToRefs(editorStore)
const promptText = computed({
  // getter
  get() {
    return currPrompt.value
  },
  set(newValue) {
    setCurrPrompt(newValue)
  },
})

const promptLen = computed(() => currPrompt.value.length)
const { isDuringTutorial } = useTutorial()
const { genImageFlow } = useGenImageUtils()
const { checkCanvasIsEmpty } = useCanvasUtils()
const { t } = useI18n()
// #endregion

const handleGenerate = async () => {
  if (vuex.state.user.token === '' && !debugMode) {
    // Open PanelLogin
    vuex.commit('user/setShowForceLogin', true)
    return
  }
  const debugSkipGenarate = false

  if (debugSkipGenarate) {
    unshiftGenResults(
      'https://asset.vivipic.com/charmix/HVDSrQpG4iRTDHkqvU3Y/output/231030115145557ftqnuIbG.png?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1699242747&Signature=E8P5c%2B3fO9b%2BvF%2BhCi1IJdT79ik%3D&X-Amzn-Trace-Id=Root%3D1-653f287b-585cd2fd4f2337005d01b2fd%3BParent%3D78c0465c20c9e530%3BSampled%3D0%3BLineage%3Dee147589%3A0',
      generalUtils.generateRandomString(4),
    )
    changeEditorState('next')
  } else if (checkCanvasIsEmpty()) {
    notify({
      group: 'error',
      text: `${t('CM0085')}`,
    })
  } else {
    setSpinnerText(`${t('CM0086')}`)
    setShowSpinner(true)
    setIsGenerating(true)
    await genImageFlow(promptText.value, false, 2, {
      onApiResponded: () => {
        changeEditorState('next')
        setIsGenerating(false)
        setShowSpinner(false)
      },
    })
  }
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
