<template lang="pug">
div(class="prompt-area w-full box-border px-24")
  div(class="flex-center flex-col relative" :class="{ 'pointer-events-none': preview }")
    //- placeholder for absolute contents
    div(class="w-full" :style="{ height: `${mainHeight}px` }")
    //- main
    transition(:name="`fade-${isTypeSettings ? 'right' : 'left'}-in`")
      div(
        v-if="!isTypeSettings"
        class="absolute w-full flex flex-col"
        :class="editorType === 'magic-combined' ? 'gap-24' : 'gap-16'"
        ref="elMain")
        //- header bar
        div(class="w-full grid grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)]")
          svg-icon(
            v-if="showInspirationIcon"
            class="tutorial-hidden-message-5--highlight"
            iconName="light-bulb"
            @click="handleInspiration")
          span(class="col-start-2" :class="title.class") {{ title.label }}
          svg-icon(
            v-if="showSettingsIcon"
            :iconName="`cm_settings${isGenSettings ? '-solid' : ''}`"
            class="justify-self-end text-yellow-0"
            @click="isGenSettings = !isGenSettings")
        //- content
        div(class="w-full relative")
          span(v-if="editorType === 'magic-combined'" class="text-white typo-body-md") {{ $t('CM0132') }}
          textarea(
            class="prompt-text-area tutorial-powerful-fill-4--clickable tutorial-hidden-message-4--clickable"
            v-else
            :placeholder="editorType === 'hidden-message' ? $t('CM0125') : $t('CM0024')"
            :autofocus="!isDuringTutorial"
            v-model="promptText")
          transition(name="clear-btn-transition")
            div(
              v-if="promptLen > 0"
              class="absolute bottom-10 right-10 text-dark typo-body-sm"
              @click="clearPromt")
              span {{ $t('CM0029') }}
        div(
          v-if="showTypeSelector && genTypes"
          class="w-full box-border grid grid-cols-[minmax(0,1fr),auto,auto] bg-lighter/20 rounded-10 p-8 gap-8 text-left typo-h5"
          @click="isTypeSettings = true")
          span(class="text-yellow-0") {{ $t('CM0108') }}
          span(class="text-lighter") {{ genTypes.group[genTypes.value].text }}
          svg-icon(
            iconName="cm_chevron-right"
            iconWidth="24px"
            iconColor="white")
        nubtn(
          v-if="!preview"
          size="mid-full"
          :disabled="isSendingGenImgReq"
          @click="handleGenerate") {{ isSendingGenImgReq ? $t('CM0086') : $t('CM0023') }}
      //- type settings
      div(
        v-else-if="genTypes"
        class="absolute w-full flex flex-col gap-16"
        :style="fixHeightStyles")
        //- header bar
        div(class="w-full grid grid-cols-3 justify-between relative")
          div(class="flex w-fit")
            svg-icon(
              iconColor="yellow-0"
              iconName="cm_arrow-left"
              iconWidth="24px"
              class="text-yellow-0 absolute left-0 top-1/2 -translate-y-1/2"
              @click="isSettings = false")
          span(:class="title.class") {{ title.label }}
          div(class="w-fit")
        //- content
        div(class="w-full flex-center gap-16 typo-h5 text-white")
          div(
            v-for="(genType, idx) in genTypes.group"
            :key="idx"
            class="gap-8 bg-lighter/20 rounded-16 p-8 aspect-square w-full"
            :class="{ 'outline outline-4 -outline-offset-4 outline-yellow-cm': idx === genTypes.value }"
            @click="() => (idxGenType = idx)")
            img(
              v-if="genType.img"
              class="w-full object-cover object-center rounded-8 aspect-[148/116]"
              :src="require(genType.img)")
            span {{ genType.text }}
  //- gen options
  Collapse(
    class="w-full"
    :when="isGenSettings && !isTypeSettings"
    @collapse="currTransitions.add('collapse-gen-options')"
    @expand="currTransitions.add('expand-gen-options')"
    @collapsed="currTransitions.delete('collapse-gen-options')"
    @expanded="currTransitions.delete('expand-gen-options')")
    div(class="w-full bg-lighter/20 rounded-10 px-8 py-16 flex flex-col text-left text-white box-border mt-16")
      div(
        v-for="(option, idx) in genRangeOptions"
        :key="idx")
        div(class="w-full flex flex-col")
          div(class="w-full flex-between-center typo-h6")
            div(class="flex items-center gap-4")
              span {{ option.title }}
              svg-icon(
                v-if="option.icon"
                :iconName="option.active && option.iconActive ? option.iconActive : option.icon"
                iconWidth="24px"
                iconColor="yellow-2"
                @click="() => (option.active = !option.active)")
            div(class="grid grid-cols-[24px,auto] items-center justify-between min-w-52")
              transition(name="rotate-right-in")
                div(v-if="option.key === 'guidance_scale' && isOptionModified(option)" class="flex-center")
                  svg-icon(
                    iconName="cm_reset"
                    iconWidth="24px"
                    iconColor="yellow-2"
                    @click="resetOption(option)")
              span(v-if="typeof option.value === 'number'" class="col-start-2 justify-self-end") {{ option.value }}
          Collapse(
            :when="!!option.active"
            @collapse="currTransitions.add(`collapse-sub-title-${idx}`)"
            @expand="currTransitions.add(`expand-sub-title-${idx}`)"
            @collapsed="currTransitions.delete(`collapse-sub-title-${idx}`)"
            @expanded="currTransitions.delete(`expand-sub-title-${idx}`)")
            div(
              v-if="option.subTitle"
              class="w-full text-lighter typo-body-sm mt-8"
              v-html="option.subTitle")
          div(class="mt-8")
            range-slider(
              v-if="option.type === 'range'"
              v-model.number="option.value"
              :max="option.max"
              :min="option.min"
              :step="option.step")
            dual-range-slider(
              v-else-if="option.type === 'dual-range'"
              v-model:valueFrom.number="option.value.from"
              v-model:valueTo.number="option.value.to"
              :max="option.max"
              :min="option.min"
              :step="option.step")
          div(
            v-if="option.minDescription || option.maxDescription"
            class="w-full flex-between-center text-white typo-btn-sm mt-8")
            span(class="typo-body-sm text-left" v-html="option.minDescription")
            span(class="typo-body-sm text-right" v-html="option.maxDescription")
        div(v-if="idx !== genRangeOptions.length - 1" class="w-full h-16 flex items-center")
          div(class="w-full h-1 bg-lighter/50")
  spinner(
    v-if="isSendingGenImgReq"
    :textContent="t('CM0086')")
</template>

<script setup lang="ts">
import useCanvasUtils from '@/composable/useCanvasUtilsCm'
import useGenImageUtils from '@/composable/useGenImageUtils'
import useTutorial from '@/composable/useTutorial'
import { useEditorStore } from '@/stores/editor'
import { useGlobalStore } from '@/stores/global'
import { useModalStore } from '@/stores/modal'
import type { GenHiddenMessageParams, GenImageParams } from '@/types/api'
import type {
  GenImageDualRangeOption,
  GenImageGroupOption,
  GenImageOptions,
  GenImageRangeOption,
} from '@/types/editor'
import vuex from '@/vuex'
import { notify } from '@kyvg/vue3-notification'
import DualRangeSlider from '@nu/vivi-lib/components/editor/mobile/DualRangeSlider.vue'
import RangeSlider from '@nu/vivi-lib/components/editor/mobile/RangeSlider.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import constantData from '@nu/vivi-lib/utils/constantData'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import modalUtils from '@nu/vivi-lib/utils/modalUtils'
import pagePinchUtils from '@nu/vivi-lib/utils/pagePinchUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { Collapse } from 'vue-collapsed'

const emit = defineEmits(['disableBtmPanelTransition'])
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
const { debugMode } = globalStore

const editorStore = useEditorStore()
const {
  setIsSendingGenImgReq,
  unshiftGenResults,
  changeEditorState,
  changeToSpecificEditorState,
  setCurrPrompt,
  setCurrDesignId,
  setCurrGenResultIndex,
  updateCurrGenOption,
} = editorStore
const {
  isSendingGenImgReq,
  currPrompt,
  currDesignId,
  isGenerating,
  editorType,
  currGenOptions,
  inEditingState,
  generatedResultsNum,
} = storeToRefs(editorStore)
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
const { checkCanvasIsEmpty, autoFill } = useCanvasUtils()
const { t } = useI18n()
// #endregion

// #region modal
const modalStore = useModalStore()
const { closeModal, openModal, setNormalModalInfo } = modalStore
// #endregion

// #region generating function
const waitForGenerating = () => {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (isGenerating.value) {
        setTimeout(() => {
          check()
        }, 200)
      } else {
        resolve()
      }
    }
    check()
  })
}

const getGenParams = (): GenImageParams => {
  const params = {
    action: editorType.value,
    prompt: promptText.value,
  } as GenImageParams
  const genRangeOptions = currGenOptions.value.filter((o) => o.type === 'range')
  const optGuidanceStep = currGenOptions.value.find((o) => o.key === 'guidance_step') as Pick<
    GenImageDualRangeOption,
    'value'
  >

  switch (editorType.value) {
    case 'hidden-message':
      Object.assign(params, {
        action: genTypes.value?.group[genTypes.value.value].key,
        ...Object.fromEntries(genRangeOptions.map((o) => [o.key, o.value])),
        guidance_start: optGuidanceStep.value.from,
        guidance_end: optGuidanceStep.value.to,
      } as GenHiddenMessageParams)
      break
    default:
      Object.assign(params, Object.fromEntries(genRangeOptions.map((o) => [o.key, o.value])))
      break
  }
  return params
}

const getIsReadyToGen = () => {
  switch (editorType.value) {
    case 'hidden-message':
      if (!promptText.value && checkCanvasIsEmpty() && !pageUtils.getCurrPage.layers.length) {
        modalUtils.setModalInfo(t('CM0118'), undefined, { msg: t('STK0023') }, undefined, {
          ulContent: [t('CM0119'), t('CM0120')],
        })
        return false
      }
      if (!promptText.value) {
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
        setNormalModalInfo({
          title: t('CM0091'),
          content: t('CM0092'),
          confirmText: t('NN0445'),
          cancelText: t('CM0090'),
          confirm: () => {
            autoFill()
            closeModal()
          },
          cancel: () => {
            closeModal()
          },
        })

        openModal()
        return false
      }
      break
  }
  return true
}

const handleGenerate = async () => {
  // const query = cmWVUtils.createUrlForJSON({ noBg: false })
  // const { flag, imageId, cleanup } = await cmWVUtils.sendScreenshotUrl(query)
  // if (vuex.state.user.token === '' && !debugMode) {
  if (vuex.state.user.token === '') {
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
      currPrompt.value,
    )
    changeEditorState('next')
    return
  }

  if (!getIsReadyToGen()) return
  setIsSendingGenImgReq(true)
  const hasDesignId = currDesignId.value !== ''
  if (!hasDesignId) {
    setCurrDesignId(generalUtils.generateAssetId())
  }

  pagePinchUtils.resetPageScale()

  await waitForGenerating()

  const timer = window.setTimeout(() => {
    setCurrGenResultIndex(0)
    changeEditorState('next')
  }, 3000)
  await genImageFlow(getGenParams(), 2, {
    onError: (index) => {
      if (index === -1) {
        clearTimeout(timer)
        setIsSendingGenImgReq(false)
        if (!inEditingState.value) {
          changeToSpecificEditorState('editing')
        }
      }
    },
  }).then(() => {
    setIsSendingGenImgReq(false)
  })
}
const clearPromt = () => {
  promptText.value = ''
}
// #endregion

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
const showInspirationIcon = computed(() => {
  return editorType.value === 'hidden-message'
})
const showSettingsIcon = computed(() => {
  return !isTypeSettings.value && ['hidden-message', 'powerful-fill'].includes(editorType.value)
})
const showTypeSelector = computed(() => {
  return editorType.value === 'hidden-message'
})
const title = computed(() => {
  const defaultClass = 'text-white typo-h6'
  if (isTypeSettings.value)
    return {
      class: defaultClass,
      label: t('CM0108'),
    }

  switch (editorType.value) {
    case 'magic-combined':
      return {
        class: 'text-yellow-cm typo-h4',
        label: t('CM0131'),
      }
    default:
      return {
        class: defaultClass,
        label: t('CM0022'),
      }
  }
})

// gen options
const genGroupOptions = computed(() => {
  return currGenOptions.value.filter((o) => o.type === 'group') as GenImageGroupOption[]
})
const genRangeOptions = computed(() => {
  return currGenOptions.value.filter((o) => ['range', 'dual-range'].includes(o.type)) as Array<
    GenImageRangeOption | GenImageDualRangeOption
  >
})
const genTypes = computed(() => {
  return genGroupOptions.value.find((o) => o.key === 'type')
})

const defaultGenImageOptions = computed(() => {
  if (editorType.value === 'hidden-message') {
    const preset = [
      // blend
      {
        guidance_scale: 7,
        weight: 2,
        guidance_step: {
          from: 0,
          to: 1,
        },
      },
      // light
      {
        guidance_scale: 10,
        weight: 0.7,
        guidance_step: {
          from: 0.1,
          to: 0.7,
        },
      },
    ][idxGenType.value] as { [key: string]: any }
    const options = (constantData.getGenImageOptions('hidden-message') as GenImageOptions) ?? []
    options.forEach((option) => {
      const newVal = preset[option.key]
      if (newVal) option.value = newVal
    })
    return options
  }
  return (
    (constantData
      .getGenImageOptions(editorType.value)
      ?.filter((o) => o.type === 'range') as GenImageRangeOption[]) ?? []
  )
})

const idxGenType = ref(genTypes.value?.value ?? 0)

watch(idxGenType, (newVal) => {
  updateCurrGenOption({ key: 'type', value: newVal })
  currGenOptions.value.forEach((o) => {
    if (['range', 'dual-range'].includes(o.type)) resetOption(o)
  })
})

const isOptionModified = (option: { key: string; value: unknown }) => {
  return option.value !== defaultGenImageOptions.value.find((o) => o.key === option.key)?.value
}

const resetOption = (option: { key: string }) => {
  const defaultOption = defaultGenImageOptions.value.find((o) => o.key === option.key)
  if (!defaultOption) return
  updateCurrGenOption(defaultOption)
}

const idxInspiration = ref(0)
const handleInspiration = () => {
  const inspirationPrompts = constantData.inspirationPrompts
  promptText.value = inspirationPrompts[idxInspiration.value]
  idxInspiration.value = (idxInspiration.value + 1) % inspirationPrompts.length
}
// #endregion

// #region styles
const elMain = ref(null)
const mainHeight = ref(0)
onMounted(() => {
  nextTick(() => {
    mainHeight.value = useElementBounding(elMain.value).height.value
  })
})
const fixHeightStyles = computed(() => {
  return {
    height: `${mainHeight.value}px`,
  }
})

// disable bottom panel transition during expand or collapse
const currTransitions = ref(new Set<string>())
watch(currTransitions.value, (val) => {
  emit('disableBtmPanelTransition', val.size > 0)
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

.prompt-text-area {
  @apply w-full box-border px-10 py-4 rounded-10 bg-yellow-2 typo-body-sm h-64  border-none outline-none outline-3 outline-offset-0 focus:outline-yellow-cm;
  transition: outline-color 0.45s;
}
</style>
