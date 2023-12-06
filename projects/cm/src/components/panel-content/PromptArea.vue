<template lang="pug">
div(
  class="flex flex-col justify-center items-center w-full box-border px-24 gap-16"
  :class="{ 'pointer-events-none': preview }")
  div(class="w-full grid grid-cols-3 justify-between relative")
    div(class="w-fit")
      svg-icon(
        v-if="isTypeSettings"
        iconColor="app-icon-light"
        iconName="cm_arrow-left"
        iconWidth="24px"
        @click="() => (isSettings = false)")
    span(class="text-app-tab-default typo-btn-lg") {{ title }}
    div(class="w-fit")
      svg-icon(
        v-if="showSettingsIcon"
        iconName="cm_settings"
        class="text-app-tab-default absolute right-0 top-1/2 -translate-y-1/2"
        @click="isGenSettings = !isGenSettings")
  template(v-if="!isTypeSettings")
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
    div(
      v-if="showTypeSelector && genTypes"
      class="w-full box-border grid grid-cols-[minmax(0,1fr),auto,auto] bg-app-tab-disable bg-opacity-20 rounded-[10px] p-8 gap-8 text-left typo-h5"
      @click="() => (isTypeSettings = true)")
      span(class="text-app-tab-default") {{ $t('CM0108') }}
      span(class="text-app-tab-disable") {{ genTypes.group[genTypes.value].text }}
      svg-icon(
        iconName="cm_chevron-right"
        iconWidth="24px"
        iconColor="app-text-secondary")
    nubtn(
      v-if="!preview"
      size="mid-full"
      :disabled="isGenerating"
      @click="handleGenerate") {{ isGenerating ? 'Generating...' : $t('CM0023') }}
    div(
      v-if="isGenSettings"
      class="w-full bg-app-tab-disable bg-opacity-20 rounded-[10px] px-8 py-16 flex flex-col text-left text-app-text-secondary")
      div(
        v-for="(option, idx) in genRangeOptions"
        :key="idx")
        div(class="w-full flex flex-col gap-8")
          div(class="w-full flex items-center justify-between typo-h6")
            div(class="flex items-center gap-4")
              svg-icon(
                v-if="option.icon"
                :iconName="option.icon"
                iconWidth="24px"
                iconColor="primary-light-active")
              span {{ option.title }}
            span(class="justify-self-end") {{ option.value }}
          span(
            v-if="option.subTitle"
            class="w-full text-app-tab-disable typo-body-sm"
            v-html="option.subTitle")
          input(
            class="panel-font-curve__range-input input__slider--range"
            v-progress
            v-model.number="option.value"
            :max="option.max"
            :min="option.min"
            :step="option.step"
            type="range")
          div(
            v-if="option.minDescription || option.maxDescription"
            class="w-full flex justify-between items-center text-app-text-secondary typo-btn-sm")
            span(class="typo-body-sm text-left" v-html="option.minDescription")
            span(class="typo-body-sm text-right" v-html="option.maxDescription")
        div(v-if="idx !== genRangeOptions.length - 1" class="w-full h-16 flex items-center")
          div(class="w-full h-1 bg-app-tab-disable bg-opacity-50")
  div(v-if="isTypeSettings && genTypes" class="w-full flex justify-center gap-16 typo-h5 text-app-text-secondary p-4")
    div(
      v-for="(genType, idx) in genTypes.group"
      :key="idx"
      class="flex flex-col gap-8 bg-app-tab-disable bg-opacity-20 rounded-2xl p-12 aspect-square w-full"
      :class="{ 'outline outline-4 outline-primary-normal': idx === genTypes.value }"
      @click="() => (genTypes && (genTypes.value = idx))")
      img(
        v-if="genType.img"
        class="w-full object-cover object-center rounded-2xl aspect-[148/116]"
        :src="require(genType.img)")
      span {{ genType.text }}
</template>
<script setup lang="ts">
import useCanvasUtils from '@/composable/useCanvasUtilsCm'
import useGenImageUtils from '@/composable/useGenImageUtils'
import useTutorial from '@/composable/useTutorial'
import { useEditorStore } from '@/stores/editor'
import { useGlobalStore } from '@/stores/global'
import type { GenHiddenMessageParams, GenImageParams, GenPowerfulFillParams } from '@/types/api'
import type { GenImageGroupOption, GenImageRangeOption } from '@/types/editor'
import vuex from '@/vuex'
import { notify } from '@kyvg/vue3-notification'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'

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
const { setIsGenerating, unshiftGenResults, changeEditorState, setCurrPrompt, setGenResultIndex } =
  editorStore
const { isGenerating, currPrompt, inEditingState, generatedResults, editorType, currGenOptions } =
  storeToRefs(editorStore)
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

const getGenParams = (): GenImageParams => {
  const params = {
    action: editorType.value,
    prompt: promptText.value,
  } as GenPowerfulFillParams
  switch (editorType.value) {
    case 'hidden-message':
      Object.assign(params, {
        action: genTypes.value?.group[genTypes.value.value].key,
        ...Object.fromEntries(
          genRangeOptions.value.map((setting) => [setting.key, setting.value]),
        ),
      } as GenHiddenMessageParams)
      break
  }
  return params
}

const getIsReadyToGen = () => {
  switch (editorType.value) {
    case 'hidden-message':
      if (!promptText.value && checkCanvasIsEmpty() && !pageUtils.getCurrPage.layers.length) {
        modalUtils.setModalInfo(
          t('CM0118'),
          undefined,
          { msg: t('STK0023') },
          undefined,
          { ulContent: [t('CM0119'), t('CM0120')] },
        )
        return false
      }
      if(!promptText.value) {
        notify({
          group: 'warn',
          text: `${t('CM0120')}`,
        })
        return false
      }
      if (checkCanvasIsEmpty() && !pageUtils.getCurrPage.layers.length) {
        notify({
          group: 'warn',
          text: `${t('CM0121')}`,
        })
        return false
      }
      break
    default:
      if (checkCanvasIsEmpty()) {
        notify({
          group: 'error',
          text: `${t('CM0085')}`,
        })
        return false
      }
      break
  }
  return true
}

const handleGenerate = async () => {
  if (vuex.state.user.token === '' && !debugMode) {
    // Open PanelLogin
    vuex.commit('user/setShowForceLogin', true)
    return
  }
  // skip generating progress
  const debugSkipGenarate = false

  if (debugSkipGenarate) {
    unshiftGenResults(
      'https://asset.vivipic.com/charmix/HVDSrQpG4iRTDHkqvU3Y/output/231030115145557ftqnuIbG.png?AWSAccessKeyId=AKIA5ORBN3H3LGND3R5W&Expires=1699242747&Signature=E8P5c%2B3fO9b%2BvF%2BhCi1IJdT79ik%3D&X-Amzn-Trace-Id=Root%3D1-653f287b-585cd2fd4f2337005d01b2fd%3BParent%3D78c0465c20c9e530%3BSampled%3D0%3BLineage%3Dee147589%3A0',
      generalUtils.generateRandomString(4),
    )
    changeEditorState('next')
  } else {
    if(!getIsReadyToGen()) return
    setSpinnerText(`${t('CM0086')}`)
    setShowSpinner(true)
    setIsGenerating(true)
    await genImageFlow(getGenParams(), false, 2, {
      onApiResponded: () => {
        if (generatedResults.value.filter((r) => r.url.length).length > 0 && inEditingState.value) {
          changeEditorState('next')
          setIsGenerating(false)
          setShowSpinner(false)
        }
      },
      onSuccess: (index) => {
        if (inEditingState.value) {
          setGenResultIndex(index)
          changeEditorState('next')
          setIsGenerating(false)
          setShowSpinner(false)
        }
      },
      onError: () => {
        setIsGenerating(false)
        setShowSpinner(false)
      }
    })
  }
}
const clearPromt = () => {
  promptText.value = ''
}

// #region settings
const isGenSettings = ref(false)
const isTypeSettings = ref(false)

const isSettings = computed({
  get() {
    return isGenSettings.value || isTypeSettings.value
  },
  set(newVal: boolean) {
    isGenSettings.value = newVal
    isTypeSettings.value = newVal
  },
})
const showSettingsIcon = computed(() => {
  return !isTypeSettings.value && editorType.value === 'hidden-message'
})
const showTypeSelector = computed(() => {
  return editorType.value === 'hidden-message'
})
const title = computed(() => {
  return isTypeSettings.value ? t('CM0108') : t('CM0022')
})

// gen options
const genGroupOptions = computed(() => {
  return currGenOptions.value.filter((o) => o.type === 'group') as GenImageGroupOption[]
})
const genRangeOptions = computed(() => {
  return currGenOptions.value.filter((o) => o.type === 'range') as GenImageRangeOption[]
})
const genTypes = computed(() => {
  return genGroupOptions.value.find((o) => o.key === 'type')
})
// #endregion
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
