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
        span {{ `${outputSize.width} x ${outputSize.height}` }}
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
        class="wrapper absolute top-0 left-0 flex-center bg-dark-2/80 tutorial-powerful-fill-3--highlight"
        :style="wrapperStyles"
        ref="editorWrapperRef")
        //- loading for gen result
        div(
          v-if="inGenResultStateDalayed && currImgSrc === ''"
          class="w-full h-fit grid grid-rows-2 gap-16 justify-center text-white")
          div(class="typo-body-md grid justify-center gap-8")
            span {{ fakeLoading }}%
            div(class="relative rounded-full bg-yellow-0/50 w-100 h-8")
              div(class="absolute rounded-full bg-yellow-cm h-8" :style="{ width: fakeLoading + 'px' }")
          div(class="typo-body-sm max-w-245") {{ fakeLoadingText }}
        //- Show gen result
        img(
          v-else-if="inGenResultStateDalayed"
          class="absolute top-0 left-0 h-full object-cover z-gen-result"
          :src="currImgSrc")
        //- Editor
        transition(:name="pageTransition" appear)
          div(v-if="!inGenResultState" class="absolute top-0 left-0 w-full h-full")
            nu-page(
              class="z-page"
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
import useGenImageUtils from '@/composable/useGenImageUtils'
import useStateInfo from '@/composable/useStateInfo'
import useSteps from '@/composable/useSteps'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { useModalStore } from '@/stores/modal'
import { useUserStore } from '@/stores/user'
import type { GenImageParams } from '@/types/api'
import LinkOrText from '@nu/vivi-lib/components/LinkOrText.vue'
import BgRemoveContainer from '@nu/vivi-lib/components/editor/backgroundRemove/BgRemoveContainer.vue'
import NuPage from '@nu/vivi-lib/components/editor/global/NuPage.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'
import LoadingBrick from '@nu/vivi-lib/components/global/LoadingBrick.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import type { IGroup, IImage } from '@nu/vivi-lib/interfaces/layer'
import { LayerType } from '@nu/vivi-lib/store/types'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import controlUtils from '@nu/vivi-lib/utils/controlUtils'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import frameUtils from '@nu/vivi-lib/utils/frameUtils'
import generalUtils from '@nu/vivi-lib/utils/generalUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import imageUtils from '@nu/vivi-lib/utils/imageUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import mappingUtils from '@nu/vivi-lib/utils/mappingUtils'
import { MovingUtils } from '@nu/vivi-lib/utils/movingUtils'
import PagePinchUtils from '@nu/vivi-lib/utils/pagePinchUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
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
const outputSize = computed(() => {
  const ratio = 1920 / Math.max(pageSize.value.width, pageSize.value.height)
  return {
    width: Math.round(ratio * pageSize.value.width),
    height: Math.round(ratio * pageSize.value.height),
  }
})

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
      store.commit('canvasResize/SET_isResizing', false)
    }, 1000)
  }
})
// #endregion

// #region edtior state related
const { inEditingState, atEditor, inAspectRatioState, inSavingState, showSelectionOptions } =
  useStateInfo()
const editorStore = useEditorStore()
const {
  changeEditorState,
  setDescriptionPanel,
  changeToSpecificEditorState,
  setSelectedSubDesignId,
} = editorStore
const {
  pageSize,
  currActiveFeature,
  inGenResultState,
  selectedSubDesignId,
  initImgSrc,
  showBrushOptions,
  editorType,
  hasGeneratedResults,
  currDesignId,
  editingSubDesignId,
  designName,
  currGeneratedResult,
  isGenerating,
} = storeToRefs(editorStore)
const userStore = useUserStore()
const { setCurrOpenDesign, setCurrOpenSubDesign, setPrevGenParams, saveSubDesign, getInitialImg } =
  userStore

const { removeWatermark } = storeToRefs(userStore)

const isManipulatingCanvas = computed(() => currActiveFeature.value === 'cm_brush')
const fromMyDesign = hasGeneratedResults.value

watch(
  () => isManipulatingCanvas.value,
  (val) => {
    store.commit('SET_allowLayerAction', val ? 'none' : 'all')
  },
)

const currImgSrc = computed(() => {
  return selectedSubDesignId.value === '' ? initImgSrc.value : currGeneratedResult.value?.url ?? ''
})

const fakeLoading = ref(5)
watch(
  () => isGenerating.value && inGenResultState.value,
  (val, old) => {
    if (!val || old) return

    // Start fake loading.
    fakeLoading.value = 0
    const fakeLoadingId = window.setInterval(() => {
      fakeLoading.value += Math.floor(Math.random() * 3)
      if (fakeLoading.value >= 95) {
        fakeLoading.value = 95
        // Stop fake loading.
        window.clearInterval(fakeLoadingId)
      }
    }, 100)
  },
)
const fakeLoadingText = computed(() => {
  if (fakeLoading.value > 90) return t('CM0149')
  else if (fakeLoading.value > 50) return t('CM0148')
  else return t('CM0147')
})

const pageTransition = ref('fade-in-only') as Ref<string | undefined>
const inGenResultStateDalayed = ref(inGenResultState.value)
watch(inGenResultState, (val) => {
  if (!val) {
    // delay disappearance of gen result to cover page during rendering
    pageTransition.value = undefined
    const duration = 300
    const start = performance.now();
    const step = () => {
      const now = performance.now();
      const delta = Math.min((now - start) / duration, 1);
      if (delta < 1) {
        requestAnimationFrame(step);
      } else {
        inGenResultStateDalayed.value = val
        pageTransition.value = 'fade-in-only'
      }
    };
    step()
  }
  else inGenResultStateDalayed.value = val
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
const handleNextAction = async function () {
  if (canSaveSubDesign.value && designName.value !== '') {
    groupUtils.deselect()
    await saveSubDesign(
      `${currDesignId.value}/${editingSubDesignId.value}`,
      editingSubDesignId.value,
      designName.value,
    )
    setSelectedSubDesignId(editingSubDesignId.value)
    changeToSpecificEditorState('saving')
  } else if (inGenResultState.value) {
    changeEditorState('next')
  }
}

const useStep = useSteps(true)
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
  if (editorType.value === 'hidden-message' && !inBgRemoveMode.value)
    retTabs.push({
      icon: 'question-mark-circle',
      disabled: false,
      width: 20,
      action: () => setDescriptionPanel('hidden-message/help'),
    })
  retTabs.push(...stepBtns)
  if (inBgRemoveMode.value) {
    retTabs.unshift({
      icon: !showInitImage.value ? 'eye-slash' : 'eye',
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
  if (currEditorTheme.value && editorType.value === 'hidden-message' && !inBgRemoveMode.value)
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
  // @Note - 24 is used to prevent the control point being cut off
  const heightRatio = (editorContainerHeight.value - 24) / pageSize.value.height

  const reductionRatio = isDuringCopy.value && !isAutoFilling.value ? 1 : 1
  const ratio = Math.min(widthRatio, heightRatio) * reductionRatio
  return ratio
})

const wrapperStyles = computed(() => {
  const { pinchScale, isPinchingEditor } = store.state.mobileEditor
  const transformOrigin = '0 0'
  const page = pageUtils.getCurrPage
  let transform = `translate(${page.x ?? 0}px, ${page.y ?? 0}px)`
  if (isPinchingEditor && pinchScale !== 1) {
    transform = `translate(${page.x ?? 0}px, ${page.y ?? 0}px) scale(${pinchScale})`
  }
  return {
    transformOrigin,
    transform,
    // width: `${pageSize.value.width * contentScaleRatio.value}px`,
    // height: `${pageSize.value.height * contentScaleRatio.value}px`,
    width: `${pageSize.value.width * contentScaleRatio.value * pageUtils.scaleRatio * 0.01}px`,
    height: `${pageSize.value.height * contentScaleRatio.value * pageUtils.scaleRatio * 0.01}px`,
    boxShadow: isDuringCopy.value ? `0px 0px 0px 2000px #050505` : 'none',
  }
})

const fitPage = (ratio: number) => {
  if (isResizingCanvas.value) return

  const pageScale = pageUtils.scaleRatio * 0.01
  const page = pageUtils.getCurrPage
  editorUtils.setMobilePhysicalData({ size: editorContainerSize.value })
  const newInitPos = {
    x: (editorUtils.mobileSize.width - page.width * ratio) * 0.5,
    y: (editorUtils.mobileSize.height - page.height * ratio) * 0.5,
  }
  if (pageScale !== 1) {
    // only when the page-scale > 1 needs to conpensate the pagePos
    const _f = page.contentScaleRatio * pageUtils.scaleRatio * 0.01
    const translationRatio = {
      // x: 0.5,
      // y: 0.5
      x: (-page.x + editorContainerSize.value.width * 0.5) / (page.width * _f),
      y: (-page.y + editorContainerSize.value.height * 0.5) / (page.height * _f),
    }
    const sizeDiff = {
      w: page.width * (ratio - page.contentScaleRatio) * pageUtils.scaleRatio * 0.01,
      h: page.height * (ratio - page.contentScaleRatio) * pageUtils.scaleRatio * 0.01,
    }
    const posDiff = {
      x: -sizeDiff.w * translationRatio.x,
      y: -sizeDiff.h * translationRatio.y,
    }
    const newPos = {
      x: page.x + posDiff.x,
      y: page.y + posDiff.y,
    }
    pageUtils.updatePagePos(0, newPos)
  } else {
    pageUtils.updatePagePos(0, newInitPos)
  }
  store.commit('SET_contentScaleRatio4Page', {
    pageIndex: layerUtils.pageIndex,
    contentScaleRatio: ratio,
  })
  pageUtils.updatePageInitPos(0, newInitPos)
}

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
  setMobilePysicalSize()
  pagePinchUtils = new PagePinchUtils(editorContainerRef.value as HTMLElement)
  pagePinchHandler = (e) => {
    if (
      inAspectRatioState.value ||
      isProcessingBgRemove.value ||
      (inGenResultState.value && currImgSrc.value === '')
    )
      return
    setMobilePysicalSize()
    pagePinchUtils?.pinchHandler(e)
  }
}
const setMobilePysicalSize = () => {
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
  pagePinchUtils = new PagePinchUtils(editorContainerRef.value as HTMLElement)
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
    return pagePinchUtils?.pinchEnd(e as unknown as AnyTouchEvent)
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
const unsubcribe = bus.on((event: string) => {
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

const assetPanelProps = computed(() => {
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

// #region imgShadow event
const saveCb = (canvas: HTMLCanvasElement) => {
  const { saveImgToTmp } = useUserStore()
  const { editorType, currDesignId } = storeToRefs(useEditorStore())
  const name = 'img-shadow-' + generalUtils.generateAssetId()
  const path = `imgShadow/${editorType.value}/${currDesignId.value}/${name}`
  return new Promise<string>((resolve) => {
    saveImgToTmp(canvas.toDataURL('image/png;base64'), path).then(() => {
      resolve(`tmp/${path}`)
    })
  })
}
store.commit('shadow/SET_SAVE_CALLBACK', saveCb)
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
</style>
