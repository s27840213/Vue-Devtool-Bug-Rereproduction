<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar(class="editor-header box-border px-24" ref="headerbarRef")
    template(#left)
      back-btn(
        v-if="canBack"
        :toTarget="fromMyDesign ? '/mydesign' : '/'")
    template(
      v-if="inEditingState && !inGenResultState"
      #middle)
      div(v-if="showActiveTab" class="text-white typo-h5 whitespace-nowrap")
        link-or-text(
          :title="centerTitle"
          :url="centerUrl")
      div(v-else-if="isResizingCanvas" class="text-white typo-h5 whitespace-nowrap")
        span {{ `${pageSize.width} x ${pageSize.height}` }}
      template(v-else-if="isCropping")
        svg-icon(
          class="layer-action"
          iconName="cm_flip-h"
          iconColor="white"
          iconWidth="20px"
          @click="mappingUtils.mappingIconAction('flip-h')")
        svg-icon(
          class="layer-action"
          iconName="cm_flip-v"
          iconColor="white"
          iconWidth="20px"
          @click="mappingUtils.mappingIconAction('flip-v')")
      template(v-else-if="currActivePanel === 'adjust'")
        div(id="header-reset")
      template(v-else)
        svg-icon(
          v-for="btn in centerBtns"
          :class="{ 'pointer-events-none': btn.disabled }"
          :key="btn.icon"
          :iconName="btn.icon"
          :iconColor="btn.disabled ? 'lighter' : 'white'"
          :iconWidth="`${btn.width}px`"
          @click="btn.action")
    template(#right)
      template(v-if="!inBgRemoveMode")
        svg-icon(
          v-if="canGotoProject"
          :iconName="'grid-solid'"
          :iconColor="'transparent'"
          :strokeColor="'white'"
          :iconWidth="'24px'"
          @click="handleProjectBtnAction")
        svg-icon(
          v-if="inGenResultState || canSaveSubDesign"
          iconName="download"
          iconColor="white"
          @click="handleNextAction")
        router-link(
          v-if="inSavingState"
          custom
          :to="'/'"
          v-slot="{ navigate }")
          svg-icon(
            iconColor="white"
            iconName="cm_home"
            iconWidth="22px"
            @click="handleHomeBtnAction(navigate)")
  canvas-resizer(
    v-if="isResizingCanvas"
    :pageIndex="layerUtils.pageIndex"
    :pageState="pageState[layerUtils.pageIndex]"
    :noBg="isDuringCopy && isNoBg")
  div(
    v-else-if="!inSavingState"
    class="editor-container flex-center relative overflow-hidden"
    ref="editorContainerRef"
    id="mobile-editor__content"
    @pointerdown="selectStart"
    @pointerup="selectEnd"
    @pinch="pagePinchHandler"
    @pointerleave="removePointer"
    v-touch)
    div(
      v-show="!inBgRemoveMode"
      class="w-full h-full box-border flex-center"
      @click.self="outerClick")
      div(
        id="screenshot-target"
        class="wrapper relative tutorial-powerful-fill-3--highlight"
        :style="wrapperStyles"
        ref="editorWrapperRef")
        img(
          v-if="inGenResultState"
          class="h-full object-cover"
          :src="currImgSrc")
        template(v-else)
          nu-page(
            class="z-page"
            v-show="!inGenResultState"
            :pageIndex="layerUtils.pageIndex"
            :pageState="pageState[layerUtils.pageIndex]"
            :overflowContainer="editorContainerRef"
            :noBg="isDuringCopy && isNoBg"
            :hideHighlighter="true")
          canvas-section(
            class="absolute top-0 left-0 w-full h-full"
            :class="isManipulatingCanvas ? '' : 'pointer-events-none'"
            :containerDOM="editorContainerRef"
            :wrapperDOM="editorWrapperRef"
            ref="canvasRef")
        div(
          v-if="isChangingBrushSize"
          :class="demoBrushSizeOutline"
          class="demo-brush"
          :style="demoBrushSizeStyles")
    sidebar-tabs(
      v-if="showSidebarTabs"
      class="absolute top-1/2 right-4 -translate-y-1/2 z-siebar-tabs"
      ref="sidebarTabsRef")
    transition(name="fade-in")
      loading-brick(
        v-if="isAutoFilling"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-median")
    bg-remove-container(
      v-if="inBgRemoveMode && editorContainerRef"
      class="absolute top-0 left-0 z-bg-remove bg-dark-6"
      :containerWH="editorContainerSize"
      :containerRef="editorContainerRef"
      :previewSrc="previewSrc")
  div(v-else class="editor-view__saving-state")
    sub-design-detail
    //- div(class="w-full h-full flex-center flex-col gap-8 overflow-hidden rounded-8 p-16 box-border")
    //-   div(
    //-     class="result-showcase w-full h-full rounded-8 overflow-hidden flex-center abosolute top-0"
    //-     ref="resultShowcase")
    //-     img(
    //-       class="result-showcase__card result-showcase__card--back"
    //-       :class="{ 'is-flipped': !showVideo }"
    //-       :src="currImgSrc")
    //-     div(
    //-       class="result-showcase__card result-showcase__card--front w-full h-full absolute flex-center"
    //-       :class="{ 'is-flipped': showVideo }")
    //-       img(
    //-         v-show="!isVideoLoaded"
    //-         class="w-full h-full absolute top-0 left-0 object-contain"
    //-         :src="initImgSrc")
    //-       loading-brick(v-show="!isVideoLoaded" class="z-median")
    //-       video(
    //-         v-show="isVideoLoaded"
    //-         class="w-full h-full absolute top-0 left-0"
    //-         ref="video"
    //-         webkit-playsinline
    //-         playsinline
    //-         loop
    //-         autoplay
    //-         mutes
    //-         @loadeddata="() => { isVideoLoaded = true }"
    //-         :src="generatedResults[currGenResultIndex].video")
    //-   div(class="flex-between-center gap-10")
    //-     div(
    //-       class="w-8 h-8 rounded-full transition-colors"
    //-       :class="showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'"
    //-       @click="() => (showVideo = true)")
    //-     div(
    //-       class="w-8 h-8 rounded-full transition-colors"
    //-       :class="!showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'"
    //-       @click="() => (showVideo = false)")
    //- div(class="flex-between-center w-full px-24 py-8 box-border")
    //-   div(class="flex items-center gap-8")
    //-     div(class="flex-center rounded-full bg-yellow-cm aspect-square p-4")
    //-       svg-icon(
    //-         iconName="crown"
    //-         :iconColor="'dark-6'"
    //-         iconWidth="20px")
    //-     span(class="typo-h5 text-white") {{ $t('CM0071') }}
    //-   slide-toggle(
    //-     v-model="removeWatermark"
    //-     :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
    //-     margin="2px"
    //-     optionWidth="22px"
    //-     optionHeight="22px"
    //-     :bgColor="removeWatermark ? 'yellow-cm' : 'lighter'"
    //-     :toggleMode="true"
    //-     :overlapSize="'8px'")
    //- div(class="flex-between-center w-full px-24 py-8 box-border")
    //-   div(class="flex items-center gap-8")
    //-     div(class="flex-center rounded-full bg-yellow-cm aspect-square p-4")
    //-       svg-icon(
    //-         iconName="crown"
    //-         :iconColor="'dark-6'"
    //-         iconWidth="20px")
    //-     span(class="typo-h5 text-white") {{ $t('CM0072') }}
    //-   slide-toggle(
    //-     v-model="highResolutionPhoto"
    //-     :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
    //-     margin="2px"
    //-     optionWidth="22px"
    //-     optionHeight="22px"
    //-     :bgColor="highResolutionPhoto ? 'yellow-cm' : 'lighter'"
    //-     :toggleMode="true"
    //-     :overlapSize="'8px'")
  transition(name="bottom-up-down")
    component(
      v-if="showActiveTab && inEditingState"
      :is="assetPanelComponent"
      class="bg-dark-6 absolute left-0 w-full z-asset-panel box-border"
      :style="assetPanelStyles"
      v-bind="assetPanelProps")
  spinner(
    v-if="isProcessingBgRemove"
    :textContent="t('CM0086')")
</template>
<script setup lang="ts">
import Headerbar from '@/components/Headerbar.vue'
import CanvasResizer from '@/components/editor/CanvasResizer.vue'
import useBiColorEditor from '@/composable/useBiColorEditor'
import useCanvasUtils from '@/composable/useCanvasUtilsCm'
import useGenImageUtils from '@/composable/useGenImageUtils'
import useStateInfo from '@/composable/useStateInfo'
import useSteps from '@/composable/useSteps'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { useModalStore } from '@/stores/modal'
import { useUserStore } from '@/stores/user'
import { useVideoRcordStore } from '@/stores/videoRecord'
import type { GenImageParams } from '@/types/api'
import LinkOrText from '@nu/vivi-lib/components/LinkOrText.vue'
import BgRemoveContainer from '@nu/vivi-lib/components/editor/backgroundRemove/BgRemoveContainer.vue'
import NuPage from '@nu/vivi-lib/components/editor/global/NuPage.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'
import LoadingBrick from '@nu/vivi-lib/components/global/LoadingBrick.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import type { IGroup, IImage, ILayer } from '@nu/vivi-lib/interfaces/layer'
import type { ILayerInfo } from '@nu/vivi-lib/store/types'
import { LayerType } from '@nu/vivi-lib/store/types'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import controlUtils from '@nu/vivi-lib/utils/controlUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mappingUtils from '@nu/vivi-lib/utils/mappingUtils'
import { MovingUtils } from '@nu/vivi-lib/utils/movingUtils'
import PagePinchUtils from '@nu/vivi-lib/utils/pagePinchUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import PinchControlUtils from '@nu/vivi-lib/utils/pinchControlUtils'
import pointerEvtUtils from '@nu/vivi-lib/utils/pointerEvtUtils'
import textUtils from '@nu/vivi-lib/utils/textUtils'
import { useEventBus } from '@vueuse/core'
import type { AnyTouchEvent } from 'any-touch'
import { storeToRefs } from 'pinia'
import { useStore } from 'vuex'

const { t } = useI18n()
// #region refs & vars
const headerbarRef = ref<typeof Headerbar | null>(null)
const editorContainerRef = ref<HTMLElement | null>(null)
const editorWrapperRef = ref<HTMLElement | null>(null)

// const sidebarTabsRef = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

// const { width: sidebarTabsWidth } = useElementBounding(sidebarTabsRef)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementBounding(editorContainerRef)

const editorContainerSize = computed(() => ({
  width: editorContainerWidth.value,
  height: editorContainerHeight.value,
}))

const i18n = useI18n()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const isNoBg = computed(() => store.getters['cmWV/getIsNoBg'])
const isCropping = computed(() => {
  return store.getters.getPages.length > 0 && imageUtils.isImgControl()
})
const currActivePanel = computed(() => store.getters['mobileEditor/getCurrActivePanel'])
const layerIndex = computed(() => layerUtils.layerIndex)
const isResizingCanvas = computed(() => store.getters['canvasResize/getIsResizing'])

const { ids } = useGenImageUtils()

const showSidebarTabs = computed(
  () =>
    !isDuringCopy.value &&
    inEditingState.value &&
    !inGenResultState.value &&
    !showSelectionOptions.value &&
    !isCropping.value &&
    !showBrushOptions.value &&
    layerIndex.value === -1 &&
    editorType.value !== 'magic-combined' &&
    !inBgRemoveMode.value,
)

const modalStore = useModalStore()
const { closeModal, openModal, setNormalModalInfo } = modalStore

// #endregion

// #region hooks related
onBeforeRouteLeave((to, from) => {
  if (from.name === 'Editor') {
    ids.length = 0
    setTimeout(() => {
      /**
       * @NOTE - if we reset immediately, will see the editor from editing state to initial state bcz transition time
       */
      editorStore.stepsReset()
      editorStore.pageReset()
      editorStore.$reset()
      canvasStore.$reset()
      setPrevGenParams({ requestId: '', params: {} as GenImageParams })
    }, 1000)
  }
})
// #endregion

// #region edtior state related
const { inEditingState, atEditor, inAspectRatioState, inSavingState, showSelectionOptions } =
  useStateInfo()
const editorStore = useEditorStore()
const { changeEditorState, updateGenResult, setDescriptionPanel, changeToSpecificEditorState } =
  editorStore
const {
  pageSize,
  currActiveFeature,
  generatedResults,
  inGenResultState,
  currGenResultIndex,
  initImgSrc,
  showBrushOptions,
  editorType,
  hasGeneratedResults,
  currDesignId,
  currSubDesignId,
  designName,
  currGeneratedResult,
} = storeToRefs(editorStore)
const userStore = useUserStore()
const { removeWatermark, highResolutionPhoto } = storeToRefs(userStore)
const { setCurrOpenDesign, setCurrOpenSubDesign, setPrevGenParams, saveSubDesign } = userStore

const isManipulatingCanvas = computed(() => currActiveFeature.value === 'cm_brush')
const fromMyDesign = hasGeneratedResults.value

watch(
  () => isManipulatingCanvas.value,
  (val) => {
    store.commit('SET_allowLayerAction', val ? 'none' : 'all')
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

const isVideoLoaded = ref(false)

const currImgSrc = computed(() => {
  return currGenResultIndex.value === -1 ? initImgSrc.value : currGeneratedResult.value?.url ?? ''
})

// #endregion

// #region headerbar state & callback
const canBack = computed(
  () =>
    !inBgRemoveMode.value &&
    !isProcessingBgRemove.value &&
    !['cm_brush', 'selection'].includes(currActiveFeature.value),
)

const canSaveSubDesign = computed(() => {
  return (
    inEditingState.value &&
    designName.value !== '' &&
    !['cm_brush', 'selection'].includes(currActiveFeature.value)
  )
})
const videoRecordStore = useVideoRcordStore()
const { addImage, genVideo } = videoRecordStore
const handleNextAction = async function () {
  if (canSaveSubDesign.value && designName.value !== '') {
    groupUtils.deselect()
    await saveSubDesign(
      `${currDesignId.value}/${currSubDesignId.value}`,
      currSubDesignId.value,
      designName.value,
    )
    changeToSpecificEditorState('saving')
  } else if (inGenResultState.value) {
    changeEditorState('next')
    const currGenResult = currGeneratedResult.value
    if (currGenResult) {
      if (!currGenResult.video) {
        const src = imageUtils.appendRandomQuery(initImgSrc.value)
        const res = imageUtils.appendRandomQuery(currGeneratedResult.value.url)
        await addImage(src, res)
        const data = await genVideo()
        if (data) {
          updateGenResult(currGenResult.id, { video: data })
        }
      }
    }
  }
}

const useStep = useSteps()
const { undo, redo, reset, isInFirstStep, isInLastStep, hasUnsavedChanges } = useStep

type centerBtn = {
  icon: string
  disabled: boolean
  width: number
  action?: () => void
}
const centerBtns = computed<centerBtn[]>(() => {
  if (isProcessingBgRemove.value) return []
  const retTabs = []
  const stepBtns = [
    { icon: 'cm_undo', disabled: isInFirstStep.value, width: 20, action: undo },
    { icon: 'cm_redo', disabled: isInLastStep.value, width: 20, action: redo },
  ]
  if (editorType.value === 'hidden-message')
    retTabs.push({
      icon: 'question-mark-circle',
      disabled: false,
      width: 20,
      action: () => setDescriptionPanel('hidden-message/help'),
    })
  retTabs.push(...stepBtns)
  if (inBgRemoveMode.value) {
    retTabs.unshift({
      icon: showInitImage ? 'eye-slash' : 'eye',
      disabled: false,
      width: 20,
      action: () => {
        setShowInitImage(!showInitImage.value)
      },
    })

    retTabs.push({
      icon: 'reset',
      disabled: !modifiedFlag.value,
      width: 20,
      action: () => {
        setRestoreInitState(true)
      },
    })
  }
  if (currEditorTheme.value && editorType.value === 'hidden-message')
    retTabs.push({
      icon: currEditorTheme.value.toggleIcon,
      disabled: false,
      width: 20,
      action: toggleEditorTheme,
    })
  return retTabs
})

const canGotoProject = computed(() => {
  return (
    hasGeneratedResults.value &&
    inEditingState.value &&
    !['cm_brush', 'selection'].includes(currActiveFeature.value)
  )
})
const handleProjectBtnAction = () => {
  if (hasUnsavedChanges.value) {
    setNormalModalInfo({
      title: t('CM0025'),
      content: t('CM0026'),
      confirmText: t('CM0028'),
      cancelText: t('NN0203'),
      confirm: () => {
        groupUtils.deselect()
        changeEditorState('next')
        reset()
        closeModal()
      },
      cancel: () => {
        closeModal()
      },
    })
    openModal()
    return
  }

  groupUtils.deselect()
  reset()
  changeEditorState('next')
}

const handleHomeBtnAction = (navagate: () => void) => {
  setCurrOpenDesign(undefined)
  setCurrOpenSubDesign(undefined)
  navagate()
}
// #endregion

// #region page related
const store = useStore()
const pageState = computed(() => store.getters.getPagesState)
const contentScaleRatio = computed(() => store.getters.getContentScaleRatio)

const fitScaleRatio = computed(() => {
  if (
    editorContainerWidth.value === 0 ||
    editorContainerHeight.value === 0 ||
    pageSize.value.width === 0 ||
    pageSize.value.height === 0
  )
    return 1

  const widthRatio = (editorContainerWidth.value - 8) / pageSize.value.width
  const heightRatio = editorContainerHeight.value / pageSize.value.height

  const reductionRatio = isDuringCopy.value && !isAutoFilling.value ? 1 : 1
  const ratio = Math.min(widthRatio, heightRatio) * reductionRatio
  return ratio
})

const wrapperStyles = computed(() => {
  return {
    width: `${pageSize.value.width * contentScaleRatio.value}px`,
    height: `${pageSize.value.height * contentScaleRatio.value}px`,
    boxShadow: isDuringCopy.value ? `0px 0px 0px 2000px #050505` : 'none',
  }
})

const fitPage = (ratio: number) => {
  store.commit('SET_contentScaleRatio4Page', { pageIndex: 0, contentScaleRatio: ratio })
  // editorUtils.handleContentScaleRatio(0)
  // const { hasBleed } = pageUtils
  // const page = pageUtils.getPage(0)
  // const { width, height } = hasBleed && !pageUtils.inBgRemoveMode ? pageUtils.getPageSizeWithBleeds(page as IPage) : page
  // const pos = {
  //   x: (editorUtils.mobileSize.width - width * ratio) * 0.5,
  //   y: (editorUtils.mobileSize.height - height * ratio) * 0.5
  // }
  // test
  // pageUtils.updatePagePos(0, pos)
  // pageUtils.updatePageInitPos(0, pos)
}

// watch(sidebarTabsWidth, () => {
//   fitPage(fitScaleRatio.value)
// })
/**
 * fitPage
 */

watch(
  () => fitScaleRatio.value,
  (newVal, oldVal) => {
    if (newVal === oldVal || !atEditor.value || isResizingCanvas.value) return
    fitPage(newVal)
  },
)

watch(isDuringCopy, () => {
  fitPage(fitScaleRatio.value)
})

let pagePinchHandler = null as ((e: AnyTouchEvent) => void) | null
let pagePinchUtils = null as PagePinchUtils | null
const initPagePinchHandler = () => {
  if (!editorContainerRef.value) return
  const rect = (editorContainerRef.value as HTMLElement).getBoundingClientRect()
  editorUtils.setMobilePhysicalData({
    size: {
      width: rect.width,
      height: rect.height,
    },
    centerPos: {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    },
    pos: {
      x: rect.left,
      y: rect.top,
    },
  })
  pagePinchUtils = new PagePinchUtils(editorWrapperRef.value as HTMLElement)
  pagePinchHandler = (e) => {
    if (inBgRemoveMode.value) return
    if (inAspectRatioState.value) return
    pagePinchUtils?.pinchHandler(e)
  }
}
onMounted(() => {
  initPagePinchHandler()
  reset()
})
watch(isResizingCanvas, (newVal) => {
  if (!newVal) {
    nextTick(initPagePinchHandler)
  }
})

const isImgCtrl = computed(() => store.getters['imgControl/isImgCtrl'])

const outerClick = () => {
  console.log('outer click')
  editorUtils.setInBgSettingMode(false)
  pageUtils.setBackgroundImageControlDefault()
}

const pointerEvent = ref({
  initPos: null as { x: number; y: number } | null,
})
const movingUtils = null as MovingUtils | null
const selectStart = (e: PointerEvent) => {
  if (inBgRemoveMode.value) return
  recordPointer(e)
  if (pointerEvtUtils.pointerIds.length >= 3) {
    return pagePinchUtils?.pinchEnd(e as any)
  }
  if (e.pointerType === 'mouse' && e.button !== 0) return

  const layer =
    ['group', 'frame'].includes(layerUtils.getCurrLayer.type) && layerUtils.subLayerIdx !== -1
      ? groupUtils.mapLayersToPage(
          [layerUtils.getCurrConfig as IImage],
          layerUtils.getCurrLayer as IGroup,
        )[0]
      : layerUtils.getCurrLayer
  const isClickOnController = controlUtils.isClickOnController(e, layer)

  if (isImgCtrl.value && !isClickOnController) {
    const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = layerUtils
    switch (currLayer.type) {
      case LayerType.image:
      case LayerType.group:
        layerUtils.updateLayerProps(pageIndex, layerIndex, { imgControl: false }, subLayerIdx)
        break
      case LayerType.frame:
        frameUtils.updateFrameLayerProps(pageIndex, layerIndex, subLayerIdx, {
          imgControl: false,
        })
        break
    }
    return
  }

  const movingUtils = new MovingUtils({
    _config: { config: layerUtils.getCurrLayer },
    snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
    body: document.getElementById(
      `nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`,
    ) as HTMLElement,
  })

  if (isClickOnController) {
    movingUtils.removeListener()
    movingUtils.updateProps({
      _config: { config: layerUtils.getCurrLayer },
      body: document.getElementById(
        `nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`,
      ) as HTMLElement,
    })
    movingUtils.moveStart(e)
  } else {
    movingUtils.removeListener()
    movingUtils.pageMoveStart(e)
  }
  pointerEvent.value.initPos = { x: e.x, y: e.y }

  // layer pinch logic
  // if (layerUtils.layerIndex !== -1) {
  //   // when there is an layer being active, the moving logic applied to the EditorView
  //   movingUtils = new MovingUtils({
  //     _config: { config: layerUtils.getCurrLayer },
  //     snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
  //     body: document.getElementById(
  //       `nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`,
  //     ) as HTMLElement,
  //   })
  //   movingUtils.moveStart(e)
  //   pointerEvent.value.initPos = { x: e.x, y: e.y }
  // }
}

// the reason to use pointerdown + pointerup to detect a click/tap for delecting layer,
// is bcz the native click/tap event is triggered as the event happened in a-short-time even the layer has moved a little position,
// this would lead to wrong UI/UX as moving-layer-feature no longer needs the touches above at the layer.
const selectEnd = (e: PointerEvent) => {
  if (inBgRemoveMode.value) return
  if (pointerEvent.value.initPos) {
    const isSingleTouch = pointerEvtUtils.pointers.length === 1
    const isConsiderNotMoved =
      Math.abs(e.x - pointerEvent.value.initPos.x) < 5 &&
      Math.abs(e.y - pointerEvent.value.initPos.y) < 5
    if (isSingleTouch && isConsiderNotMoved && !store.getters['imgControl/isImgCtrl']) {
      // the moveingEnd would consider the layer to be selected,
      // however in this case the layer should be consider as deselected, bcz the position is thought as not moved.
      // following code remove the moveEnd event.
      if (store.getters.getControlState.type === 'move') {
        store.commit('SET_STATE', { controlState: { type: '' } })
      }
      const layer = layerUtils.getCurrLayer
      if (!controlUtils.isClickOnController(e, layer)) {
        groupUtils.deselect()
        movingUtils?.removeListener()
      }
    }
    pointerEvent.value.initPos = null
  }
  // pointerEvtUtils.removePointer(e.pointerId)
}

const isPinchInit = ref<null | boolean>(false)
let pinchControlUtils = null as null | PinchControlUtils

const onLayerPinch = (e: AnyTouchEvent) => {
  if (e.phase === 'end' && isPinchInit.value) {
    // pinch end handling
    layerPinchHandler(e)
    isPinchInit.value = false
    pinchControlUtils = null
  } else {
    const touches = (e.nativeEvent as TouchEvent).touches
    if (touches.length !== 2 || layerUtils.layerIndex === -1) return
    if (!isPinchInit.value) {
      // first pinch initialization
      isPinchInit.value = true
      return layerPinchStart(e)
    } else {
      // pinch move handling
      layerPinchHandler(e)
    }
  }
}

const layerPinchHandler = (e: AnyTouchEvent) => {
  pinchControlUtils?.pinch(e)
}

const layerPinchStart = (e: AnyTouchEvent) => {
  if (store.getters['imgControl/isImgCtrl'] || store.getters['imgControl/isImgCtrl']) return
  if (store.getters['bgRemove/getInBgRemoveMode']) return

  const _config = {
    config: layerUtils.getLayer(layerUtils.pageIndex, layerUtils.layerIndex),
  } as unknown as { config: ILayer }

  if (_config.config.locked) return
  if (layerUtils.getCurrConfig.type === 'text' && layerUtils.getCurrConfig.contentEditable) return

  const layerInfo = new Proxy(
    {
      pageIndex: layerUtils.pageIndex,
      layerIndex: layerUtils.layerIndex,
    },
    {
      get(_, key) {
        if (key === 'pageIndex') return layerUtils.pageIndex
        else if (key === 'layerIndex') return layerUtils.layerIndex
      },
    },
  ) as ILayerInfo
  const movingUtils = new MovingUtils({
    _config,
    layerInfo,
    snapUtils: pageUtils.getPageState(layerUtils.pageIndex).modules.snapUtils,
    body: document.getElementById(
      `nu-layer_${layerUtils.pageIndex}_${layerUtils.layerIndex}_-1`,
    ) as HTMLElement,
  })
  const data = {
    layerInfo,
    config: undefined,
    movingUtils: movingUtils as MovingUtils,
  }
  pinchControlUtils = new PinchControlUtils(data)
}

const recordPointer = (e: PointerEvent) => {
  pointerEvtUtils.addPointer(e)
}
const removePointer = (e: PointerEvent) => {
  pointerEvtUtils.removePointer(e.pointerId)
}
// #endregion

// #region bi-color-editor
const { toggleEditorTheme, currEditorTheme, isBiColorEditor, initBiColorEditor } =
  useBiColorEditor()
watch(
  inEditingState,
  (newVal) => {
    if (newVal && isBiColorEditor.value) {
      initBiColorEditor(editorType.value)
    }
  },
  { immediate: true },
)
// #endregion

// #region demo brush size section
const canvasStore = useCanvasStore()
const { brushSize, isChangingBrushSize, isAutoFilling, drawingColor } = storeToRefs(canvasStore)
const { downloadCanvas } = useCanvasUtils()

const demoBrushSizeStyles = computed(() => {
  return {
    width: `${brushSize.value * contentScaleRatio.value * pageUtils.scaleRatio * 0.01}px`,
    height: `${brushSize.value * contentScaleRatio.value * pageUtils.scaleRatio * 0.01}px`,
    backgroundColor: `${drawingColor.value}4C`, // 30% opacity
  }
})

const demoBrushSizeOutline = computed(() => {
  return {
    'outline-white': !isBiColorEditor.value,
    'outline-dark-0': isBiColorEditor.value,
  }
})
// #endregion

// #region event bus
const bus = useEventBus<string>('editor')
const unsubcribe = bus.on((event: string, { callback }) => {
  if (event === 'fitPage') {
    fitPage(fitScaleRatio.value)
  }
})
onBeforeUnmount(() => {
  unsubcribe()
})
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

watch(currActiveFeature, () => {
  console.log(currActiveFeature.value)
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

const assetPanelProps = computed((): { [index: string]: any } => {
  const monoColor = currEditorTheme.value?.fgColor
  switch (currActiveTab.value) {
    case 'text': {
      return {
        monoColor,
      }
    }
    case 'object':
      return {
        monoColor,
      }
    default: {
      return {}
    }
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
watch(showVideo, (newVal) => {
  if (video.value) {
    if (!newVal) {
      video.value.currentTime = 0
    }
  }
})
// #endregion

// #region bg remove related
const inBgRemoveMode = computed(() => store.getters['bgRemove/getInBgRemoveMode'])
const isProcessingBgRemove = computed(() => store.getters['bgRemove/getIsProcessing'])
const modifiedFlag = computed(() => store.getters['bgRemove/getModifiedFlag'])
const showInitImage = computed(() => store.getters['bgRemove/getShowInitImage'])
const setShowInitImage = (val: boolean) => {
  store.commit('bgRemove/SET_showInitImage', val)
}

const setRestoreInitState = (val: boolean) => {
  store.commit('bgRemove/SET_restoreInitState', val)
}
const previewSrc = ref('')
// #endregion
</script>
<style lang="scss" scoped>
@use '@/assets/scss/transitions.scss';

.demo-brush {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2;
  @apply pointer-events-none rounded-full outline-4 z-highest;
  outline-style: solid;
}

.editor-view {
  &__saving-state {
    @apply grid grid-rows-[minmax(0,1fr)] grid-cols-1 justify-items-center items-center h-full w-full;
  }
}

// @TODO discuss with allen
//@apply max-w-full max-h-full object-contain;
.result-showcase {
  transform-style: preserve-3d;

  &__card {
    @apply max-h-full object-contain;
    backface-visibility: hidden;
    transition: transform 0.6s;
  }
}

.is-flipped {
  transform: rotateY(180deg);
}
</style>
