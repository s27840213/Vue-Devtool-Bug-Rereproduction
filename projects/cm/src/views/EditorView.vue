<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar(
    class="editor-header box-border px-24"
    :middGap="32"
    ref="headerbarRef")
    template(#left)
      back-btn
    template(
      v-if="inEditingState && !inGenResultState"
      #middle)
      div(v-if="showActiveTab" class="text-white typo-h5 whitespace-nowrap")
        link-or-text(
          :title="centerTitle"
          :url="centerUrl")
      template(v-else)
        cm-svg-icon(
          iconName="undo"
          :iconColor="isInFirstStep ? 'app-tab-disable' : 'app-btn-primary-text'"
          iconWidth="20px"
          @click="undo")
        cm-svg-icon(
          iconName="redo"
          :iconColor="isInLastStep ? 'app-tab-disable' : 'app-btn-primary-text'"
          iconWidth="20px"
          @click="redo")
    template(#right)
      cm-btn(
        v-if="inAspectRatioState || inGenResultState"
        theme="primary"
        size="md"
        @click="handleNextAction") {{ inAspectRatioState ? $t('CM0012') : inGenResultState ? $t('NN0133') : '' }}
  div(
    v-if="!inSavingState"
    class="editor-container flex justify-center items-center relative"
    ref="editorContainerRef")
    div(
      class="w-full h-full box-border overflow-scroll flex justify-center items-center"
      @click.self="handleOuterClick")
      div(
        id="screenshot-target"
        class="wrapper relative tutorial-powerful-fill-3--highlight"
        :style="wrapperStyles"
        ref="editorWrapperRef")
        img(
          v-if="inGenResultState"
          class="h-full object-cover"
          :src="currGenResultIndex === -1 ? initImgSrc : generatedResults[currGenResultIndex].url")
        template(v-else)
          nu-page(
            class="z-page"
            v-show="!inGenResultState"
            :pageIndex="0"
            :pageState="pageState[0]"
            :overflowContainer="editorContainerRef"
            :noBg="isDuringCopy && isNoBg")
          canvas-section(
            v-if="inEditingState"
            class="absolute top-0 left-0 w-full h-full"
            :class="isManipulatingCanvas ? '' : 'pointer-events-none'"
            :containerDOM="editorContainerRef"
            :wrapperDOM="editorWrapperRef"
            ref="canvasRef")
        div(
          v-if="isChangingBrushSize"
          class="demo-brush"
          :style="demoBrushSizeStyles")
    sidebar-tabs(
      v-if="inEditingState && !inGenResultState && !showSelectionOptions"
      class="absolute top-1/2 right-0 -translate-y-1/2"
      ref="sidebarTabsRef"
      @downloadMask="downloadCanvas")
  div(v-else class="editor-view__saving-state")
    div(
      class="w-full h-full flex flex-col gap-8 justify-center items-center overflow-hidden rounded-lg p-16 box-border")
      div(class="result-showcase w-fit h-fit rounded-xl overflow-hidden" ref="resultShowcase")
        img(
          class="result-showcase__card result-showcase__card--front"
          :class="{ 'is-flipped': !showVideo }"
          :src="initImgSrc")
        img(
          class="result-showcase__card result-showcase__card--back absolute top-0 left-0"
          :class="{ 'is-flipped': showVideo }"
          :src="currGenResultIndex === -1 ? initImgSrc : generatedResults[currGenResultIndex].url")
      div(class="flex justify-between items-center gap-10")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="showVideo ? 'bg-app-btn-primary-bg' : 'bg-app-slider-bg'"
          @click="() => (showVideo = true)")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="!showVideo ? 'bg-app-btn-primary-bg' : 'bg-app-slider-bg'"
          @click="() => (showVideo = false)")
    div(class="flex justify-between items-center w-full px-24 py-8 box-border")
      div(class="flex items-center gap-8")
        div(class="flex justify-center items-center rounded-full bg-primary-normal aspect-square p-4")
          cm-svg-icon(
            iconName="crown"
            :iconColor="'app-bg'"
            iconWidth="20px")
        span(class="typo-h5 text-app-text-secondary") {{ $t('CM0071') }}
      slide-toggle(
        v-model="removeWatermark"
        :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
        margin="2px"
        optionWidth="22px"
        optionHeight="22px"
        :bgColor="removeWatermark ? 'app-tab-active' : 'primary-lighter'"
        :toggleMode="true"
        :overlapSize="'8px'")
    div(class="flex justify-between items-center w-full px-24 py-8 box-border")
      div(class="flex items-center gap-8")
        div(class="flex justify-center items-center rounded-full bg-primary-normal aspect-square p-4")
          cm-svg-icon(
            iconName="crown"
            :iconColor="'app-bg'"
            iconWidth="20px")
        span(class="typo-h5 text-app-text-secondary") {{ $t('CM0072') }}
      slide-toggle(
        v-model="highResolutionPhoto"
        :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
        margin="2px"
        optionWidth="22px"
        optionHeight="22px"
        :bgColor="highResolutionPhoto ? 'app-tab-active' : 'primary-lighter'"
        :toggleMode="true"
        :overlapSize="'8px'")
  transition(name="bottom-up")
    component(
      v-if="showActiveTab && inEditingState"
      :is="assetPanelComponent"
      class="bg-app-bg absolute left-0 w-full z-asset-panel box-border"
      :style="assetPanelStyles")
</template>
<script setup lang="ts">
import Headerbar from '@/components/Headerbar.vue'
import useStateInfo from '@/composable/useStateInfo'
import useSteps from '@/composable/useSteps'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import tutorialUtils from '@/utils/tutorialUtils'
import LinkOrText from '@nu/vivi-lib/components/LinkOrText.vue'
import NuPage from '@nu/vivi-lib/components/editor/global/NuPage.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'
import SlideToggle from '@nu/vivi-lib/components/global/SlideToggle.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import SwipeDetector from '@nu/vivi-lib/utils/SwipeDetector'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import textUtils from '@nu/vivi-lib/utils/textUtils'
import { useElementSize, useEventBus } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { VNodeRef } from 'vue'
import { useStore } from 'vuex'

// #region refs & vars
const headerbarRef = ref<typeof Headerbar | null>(null)
const editorContainerRef = ref<HTMLElement | null>(null)
const editorWrapperRef = ref<HTMLElement | null>(null)
const sidebarTabsRef = ref<HTMLElement | null>(null)

const { width: sidebarTabsWidth } = useElementSize(sidebarTabsRef)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementSize(editorContainerRef)

const i18n = useI18n()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const isNoBg = computed(() => store.getters['cmWV/getIsNoBg'])

const removeWatermark = ref(false)
const highResolutionPhoto = ref(false)
// #endregion

// #region hooks related
onBeforeRouteLeave((to, from) => {
  if (from.name === 'Editor') {
    setTimeout(() => {
      /**
       * @NOTE - if we reset immediately, will see the editor from editing state to initial state bcz transition time
       */
      editorStore.stepsReset()
      editorStore.pageReset()
      editorStore.$reset()
      canvasStore.$reset()
    }, 1000)
  }
})
// #endregion

// #region edtior state related
const { inEditingState, atEditor, inAspectRatioState, inSavingState, showSelectionOptions } =
  useStateInfo()
const editorStore = useEditorStore()
const { setEditorState } = editorStore
const {
  pageSize,
  editorState,
  currActiveFeature,
  generatedResults,
  inGenResultState,
  currGenResultIndex,
  initImgSrc,
  imgAspectRatio,
} = storeToRefs(editorStore)
const isManipulatingCanvas = computed(() => currActiveFeature.value === 'brush')

const handleNextAction = function () {
  if (editorState.value === 'aspectRatio') {
    setEditorState('editing')
    tutorialUtils.runTutorial('powerful-fill')
  } else if (editorState.value === 'genResult') {
    setEditorState('saving')
  }
  // if (inGenResultState) {
  //   const src = imageUtils.appendRandomQuery(initImgSrc.value)
  //   const currGenResult = generatedResults.value[currGenResultIndex.value]
  //   if (currGenResult) {
  //     const res = imageUtils.appendRandomQuery(generatedResults.value[currGenResultIndex.value].url)
  //     const pixiRecorder = new PixiRecorder(src, res)
  //     pixiRecorder.genVideo().then((data) => console.log('gen video', data))
  //   }
  // }
}

const useStep = useSteps()
const { undo, redo, isInFirstStep, isInLastStep } = useStep
// #endregion

// #region page related
const store = useStore()
const pageState = computed(() => store.getters.getPagesState)
const pageScaleRatio = computed(() => store.getters.getPageScaleRatio)

const fitScaleRatio = computed(() => {
  if (
    editorContainerWidth.value === 0 ||
    editorContainerHeight.value === 0 ||
    pageSize.value.width === 0 ||
    pageSize.value.height === 0
  )
    return 1

  const pageAspectRatio = pageSize.value.width / pageSize.value.height
  const newWidth = pageAspectRatio > 1 ? 1600 : 1600 * pageAspectRatio
  const newHeight = pageAspectRatio > 1 ? 1600 / pageAspectRatio : 1600

  const widhtRatio = (editorContainerWidth.value - sidebarTabsWidth.value - 24) / newWidth
  const heightRatio = editorContainerHeight.value / newHeight

  const ratio = Math.min(widhtRatio, heightRatio) * 0.9

  return ratio * 100
})

const wrapperStyles = computed(() => {
  return {
    width: `${(pageSize.value.width * pageScaleRatio.value) / 100}px`,
    height: `${(pageSize.value.height * pageScaleRatio.value) / 100}px`,
  }
})

const handleOuterClick = () => {
  groupUtils.deselect()
}

/**
 * fitPage
 */

watch(
  () => fitScaleRatio.value,
  (newVal, oldVal) => {
    if (newVal === oldVal || !atEditor.value) return
    pageUtils.setScaleRatio(newVal)
  },
  // useDebounceFn((newVal, oldVal) => {
  //   if (newVal === oldVal || !atEditor.value) return
  //   setPageScaleRatio(newVal)
  //   setPageScaleRatio(newVal)
  // }, 300),
)

// #endregion

// #region demo brush size section
const canvasStore = useCanvasStore()
const { brushSize, isChangingBrushSize } = storeToRefs(canvasStore)

const demoBrushSizeStyles = computed(() => {
  return {
    width: `${(brushSize.value * pageScaleRatio.value) / 100}px`,
    height: `${(brushSize.value * pageScaleRatio.value) / 100}px`,
  }
})
// #endregion

// #region Canvas functions
const bus = useEventBus<string>('generation')
const unsubcribe = bus.on((event: string, { callback }) => {
  if (event === 'genMaskUrl') {
    callback(getCanvasDataUrl())
  }
})
onBeforeUnmount(() => {
  unsubcribe()
})

const canvasRef = ref<VNodeRef | null>(null)
const downloadCanvas = () => {
  if (!canvasRef.value) return

  canvasRef.value.downloadCanvas()
}

const getCanvasDataUrl = () => {
  if (!canvasRef.value) return

  return canvasRef.value.getCanvasDataUrl()
}
// #endregion

// #region asset panel
const currActiveTab = computed(() => assetPanelUtils.currActiveTab)
const showActiveTab = computed(() => assetPanelUtils.showActiveTab)
const currIsInCategory = computed(() => assetPanelUtils.currIsInCategory)
const currShowAllRecently = computed(() => assetPanelUtils.currShowAllRecently)
const assetPanelTop = ref(0)
let topSetterTimer = -1

const setAssetPanelTop = () => {
  if (!headerbarRef.value) {
    topSetterTimer = window.setTimeout(setAssetPanelTop, 100)
    return
  }
  clearTimeout(topSetterTimer)
  assetPanelTop.value = headerbarRef.value.headerbarRef.getBoundingClientRect().height
}
setAssetPanelTop()

textUtils.loadDefaultFonts()

watch(currActiveTab, () => {
  setAssetPanelTop()
})

const assetPanelStyles = computed(() => {
  return {
    top: `${assetPanelTop.value}px`,
    height: `calc(100% - ${assetPanelTop.value}px)`,
  }
})

const assetPanelComponent = computed(() => {
  switch (currActiveTab.value) {
    case 'text':
      return i18n.locale === 'us' ? PanelTextUs : PanelText
    case 'object':
      return PanelObject
    default:
      return PanelText
  }
})

const titleInfo = computed(() => {
  const staticHeaderTab = store.getters['objects/headerTab']
  const textHeaderTab = store.getters['textStock/headerTab']
  switch (currActiveTab.value) {
    case 'object':
      return {
        title: staticHeaderTab.title,
        url: staticHeaderTab.bulbUrl || '',
      }
    case 'text':
      return {
        title: textHeaderTab.title,
        url: textHeaderTab.bulbUrl,
      }
  }
  return { title: '', url: '' }
})

const centerUrl = computed(() => {
  return currIsInCategory.value ? titleInfo.value.url : ''
})

const centerTitle = computed(() => {
  if (currIsInCategory.value) {
    if (currShowAllRecently.value) {
      return `${i18n.t('NN0024')}`
    } else {
      return titleInfo.value.title
    }
  }
  switch (currActiveTab.value) {
    case 'text':
      return i18n.t('CM0063')
    case 'object':
      return i18n.t('CM0064')
    default:
      return ''
  }
})
// #endregion

// #region result showcase
const resultShowcase = ref<HTMLElement | null>(null)
const showVideo = ref(true)
let swipeDetector: SwipeDetector = null as unknown as SwipeDetector

// onMounted(() => {
//   swipeDetector = new SwipeDetector(
//     resultShowcase.value as HTMLElement,
//     {
//       targetDirection: 'horizontal',
//     },
//     handleSwipe,
//   )

// })

// onBeforeUnmount(() => {
//   swipeDetector.unbind()
// })

watch(resultShowcase, () => {
  if (resultShowcase) {
    swipeDetector = new SwipeDetector(
      resultShowcase.value as HTMLElement,
      {
        targetDirection: 'horizontal',
      },
      handleSwipe,
    )
  } else {
    swipeDetector.unbind()
  }
})

const handleSwipe = (dir: string) => {
  showVideo.value = !showVideo.value
}
// #endregion
</script>
<style lang="scss" scoped>
@use '@/assets/scss/transitions.scss';

.demo-brush {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-app-selection bg-opacity-30;
  @apply pointer-events-none rounded-full outline-4 outline-primary-white z-highest;
  outline-style: solid;
}

.editor-view {
  &__saving-state {
    @apply grid grid-rows-[minmax(0,1fr),auto,auto] grid-cols-1 justify-items-center items-center h-full w-full gap-16;
  }
}

.result-showcase {
  transform-style: preserve-3d;
  &__card {
    @apply max-w-full max-h-full object-contain;
    backface-visibility: hidden;
    transition: transform 0.6s;
    &--back {
    }
  }
}

.is-flipped {
  transform: rotateY(180deg);
}
</style>
