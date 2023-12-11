<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar(
    class="editor-header box-border px-24 z-median"
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
          :key="btn.icon"
          :iconName="btn.icon"
          :iconColor="btn.disabled ? 'lighter' : 'white'"
          :iconWidth="`${btn.width}px`"
          @click="btn.action")
    template(#right)
      nubtn(
        v-if="inGenResultState"
        @click="handleNextAction") {{ inEditingState ? $t('CM0012') : inGenResultState ? $t('NN0133') : '' }}
      router-link(
        v-if="inSavingState"
        custom
        :to="'/'"
        v-slot="{ navigate }")
        svg-icon(
          iconColor="white"
          iconName="home"
          iconWidth="22px"
          @click="handleHomeBtnAction(navigate)")
  div(
    v-if="!inSavingState"
    class="editor-container flex justify-center items-center relative"
    ref="editorContainerRef"
    id="mobile-editor__content"
    @pointerdown="selectStart"
    @pointerup="selectEnd"
    @pinch="pagePinchHandler"
    @pointerleave="removePointer"
    v-touch)
    div(class="w-full h-full box-border flex justify-center items-center" @click.self="outerClick")
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
            :pageIndex="0"
            :pageState="pageState[0]"
            :overflowContainer="editorContainerRef"
            :noBg="isDuringCopy && isNoBg"
            :hideHighlighter="true")
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
          :class="demoBrushSizeOutline"
          :style="demoBrushSizeStyles")
    sidebar-tabs(
      v-if="!isDuringCopy && inEditingState && !inGenResultState && !showSelectionOptions && !isCropping"
      class="absolute top-1/2 right-4 -translate-y-1/2 z-siebar-tabs"
      ref="sidebarTabsRef"
      @downloadMask="downloadCanvas")
  div(v-else class="editor-view__saving-state")
    div(
      class="w-full h-full flex flex-col gap-8 justify-center items-center overflow-hidden rounded-8 p-16 box-border")
      div(class="result-showcase w-fit h-fit rounded-8 overflow-hidden" ref="resultShowcase")
        img(
          class="result-showcase__card result-showcase__card--back absolute top-0 left-0"
          :class="{ 'is-flipped': !showVideo }"
          :src="currImgSrc")
        img(
          class="result-showcase__card result-showcase__card--front"
          :class="{ 'is-flipped': showVideo }"
          :src="initImgSrc")
        //- img(
        //-   class="result-showcase__card result-showcase__card--front"
        //-   :class="{ 'is-flipped': !showVideo }"
        //-   :src="currImgSrc")
        //- div(class="result-showcase__card result-showcase__card--back" :class="{ 'is-flipped': showVideo }")
        //-   img(
        //-     v-if="!isVideoGened"
        //-     class="w-full h-full absolute top-0 left-0 object-cover"
        //-     :src="initImgSrc")
        //-   video(
        //-     v-else
        //-     class="w-full h-full absolute top-0 left-0 object-cover"
        //-     ref="video"
        //-     webkit-playsinline
        //-     playsinline
        //-     loop
        //-     autoplay
        //-     mutes
        //-     :src="generatedResults[currGenResultIndex].video")
      div(class="flex justify-between items-center gap-10")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'"
          @click="() => (showVideo = true)")
        div(
          class="w-8 h-8 rounded-full transition-colors"
          :class="!showVideo ? 'bg-yellow-cm' : 'bg-lighter/80'"
          @click="() => (showVideo = false)")
    div(class="flex justify-between items-center w-full px-24 py-8 box-border")
      div(class="flex items-center gap-8")
        div(class="flex justify-center items-center rounded-full bg-yellow-cm aspect-square p-4")
          svg-icon(
            iconName="crown"
            :iconColor="'dark-6'"
            iconWidth="20px")
        span(class="typo-h5 text-white") {{ $t('CM0071') }}
      slide-toggle(
        v-model="removeWatermark"
        :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
        margin="2px"
        optionWidth="22px"
        optionHeight="22px"
        :bgColor="removeWatermark ? 'yellow-cm' : 'lighter'"
        :toggleMode="true"
        :overlapSize="'8px'")
    div(class="flex justify-between items-center w-full px-24 py-8 box-border")
      div(class="flex items-center gap-8")
        div(class="flex justify-center items-center rounded-full bg-yellow-cm aspect-square p-4")
          svg-icon(
            iconName="crown"
            :iconColor="'dark-6'"
            iconWidth="20px")
        span(class="typo-h5 text-white") {{ $t('CM0072') }}
      slide-toggle(
        v-model="highResolutionPhoto"
        :options="[ { value: false, label: '' }, { value: true, label: '' }, ]"
        margin="2px"
        optionWidth="22px"
        optionHeight="22px"
        :bgColor="highResolutionPhoto ? 'yellow-cm' : 'lighter'"
        :toggleMode="true"
        :overlapSize="'8px'")
  transition(name="bottom-up-down")
    component(
      v-if="showActiveTab && inEditingState"
      :is="assetPanelComponent"
      class="bg-dark-6 absolute left-0 w-full z-asset-panel box-border"
      :style="assetPanelStyles"
      v-bind="assetPanelProps")
</template>
<script setup lang="ts">
import Headerbar from '@/components/Headerbar.vue'
import useBiColorEditor from '@/composable/useBiColorEditor'
import useGenImageUtils from '@/composable/useGenImageUtils'
import useStateInfo from '@/composable/useStateInfo'
import useSteps from '@/composable/useSteps'
import useTutorial from '@/composable/useTutorial'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import { useUserStore } from '@/stores/user'
import PixiRecorder from '@/utils/pixiRecorder'
import LinkOrText from '@nu/vivi-lib/components/LinkOrText.vue'
import NuPage from '@nu/vivi-lib/components/editor/global/NuPage.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'
import SlideToggle from '@nu/vivi-lib/components/global/SlideToggle.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import type { IGroup, IImage, ILayer } from '@nu/vivi-lib/interfaces/layer'
import type { ILayerInfo } from '@nu/vivi-lib/store/types'
import { LayerType } from '@nu/vivi-lib/store/types'
import SwipeDetector from '@nu/vivi-lib/utils/SwipeDetector'
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
import type { VNodeRef } from 'vue'
import { useStore } from 'vuex'

// #region refs & vars
const headerbarRef = ref<typeof Headerbar | null>(null)
const editorContainerRef = ref<HTMLElement | null>(null)
const editorWrapperRef = ref<HTMLElement | null>(null)

// const sidebarTabsRef = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)

// const { width: sidebarTabsWidth } = useElementBounding(sidebarTabsRef)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementBounding(editorContainerRef)

const i18n = useI18n()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const isNoBg = computed(() => store.getters['cmWV/getIsNoBg'])
const isCropping = computed(() => {
  return store.getters.getPages.length > 0 && imageUtils.isImgControl()
})
const currActivePanel = computed(() => store.getters['mobileEditor/getCurrActivePanel'])

const { ids } = useGenImageUtils()

const removeWatermark = ref(false)
const highResolutionPhoto = ref(false)
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
    }, 1000)
  }
})
// #endregion

// #region edtior state related
const { inEditingState, atEditor, inAspectRatioState, inSavingState, showSelectionOptions } =
  useStateInfo()
const editorStore = useEditorStore()
const { changeEditorState, updateGenResult, setDescriptionPanel, editorType } = editorStore
const {
  pageSize,
  currActiveFeature,
  generatedResults,
  inGenResultState,
  currGenResultIndex,
  initImgSrc,
  hasGeneratedResults,
} = storeToRefs(editorStore)
const isManipulatingCanvas = computed(() => currActiveFeature.value === 'cm_brush')

watch(
  () => isManipulatingCanvas.value,
  (val) => {
    store.commit('SET_disableLayerAction', val)
  },
)

const isVideoGened = ref(false)
const handleNextAction = function () {
  if (inAspectRatioState.value) {
    changeEditorState('next')
    useTutorial().runTutorial(editorType)
  } else if (inEditingState.value) {
    changeEditorState('next')
  } else if (inGenResultState.value) {
    changeEditorState('next')
    isVideoGened.value = false
    const currGenResult = generatedResults.value[currGenResultIndex.value]
    if (currGenResult) {
      if (!currGenResult.video) {
        const src = imageUtils.appendRandomQuery(initImgSrc.value)
        const res = imageUtils.appendRandomQuery(
          generatedResults.value[currGenResultIndex.value].url,
        )
        const pixiRecorder = new PixiRecorder(src, res)
        pixiRecorder.genVideo().then((data) => {
          if (data) {
            isVideoGened.value = true
            updateGenResult(currGenResult.id, { video: data })
          }
        })
      } else {
        isVideoGened.value = true
      }
    }
  }
}

const currImgSrc = computed(() => {
  return currGenResultIndex.value === -1
    ? initImgSrc.value
    : generatedResults.value[currGenResultIndex.value]?.url ?? ''
})

const useStep = useSteps()
const { undo, redo, isInFirstStep, isInLastStep } = useStep

type centerBtn = {
  icon: string
  disabled: boolean
  width: number
  action?: () => void
}
const centerBtns = computed<centerBtn[]>(() => {
  const retTabs = []
  const stepBtns = [
    { icon: 'cm_undo', disabled: isInFirstStep.value, width: 20, action: undo },
    { icon: 'cm_redo', disabled: isInLastStep.value, width: 20, action: redo },
  ]
  if (editorType === 'hidden-message')
    retTabs.push({
      icon: 'question-mark-circle',
      disabled: false,
      width: 20,
      action: () => setDescriptionPanel('hidden-message'),
    })
  retTabs.push(...stepBtns)
  if (currEditorTheme.value && editorType === 'hidden-message')
    retTabs.push({
      icon: currEditorTheme.value.toggleIcon,
      disabled: false,
      width: 20,
      action: toggleEditorTheme,
    })
  return retTabs
})
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
  // make longer side become 1600px
  const pageAspectRatio = pageSize.value.width / pageSize.value.height
  const newWidth = pageAspectRatio >= 1 ? 1600 : 1600 * pageAspectRatio
  const newHeight = pageAspectRatio >= 1 ? 1600 / pageAspectRatio : 1600

  // const widthRatio = (editorContainerWidth.value - sidebarTabsWidth.value * 2) / newWidth
  const widthRatio = (editorContainerWidth.value - 8) / newWidth
  const heightRatio = editorContainerHeight.value / newHeight

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
    if (newVal === oldVal || !atEditor.value) return
    fitPage(newVal)
  },
)

watch(isDuringCopy, () => {
  fitPage(fitScaleRatio.value)
})

let pagePinchHandler = null as ((e: AnyTouchEvent) => void) | null
onMounted(() => {
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
  pagePinchHandler = new PagePinchUtils(editorWrapperRef.value as HTMLElement).pinchHandler
})

const isImgCtrl = computed(() => store.getters['imgControl/isImgCtrl'])

const outerClick = () => {
  editorUtils.setInBgSettingMode(false)
  pageUtils.setBackgroundImageControlDefault()
}

const pointerEvent = ref({
  initPos: null as { x: number; y: number } | null,
})
const movingUtils = null as MovingUtils | null
const selectStart = (e: PointerEvent) => {
  recordPointer(e)
  if (e.pointerType === 'mouse' && e.button !== 0) return

  const layer = ['group', 'frame'].includes(layerUtils.getCurrLayer.type) && layerUtils.subLayerIdx !== -1
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

// toggle editor theme
const { toggleEditorTheme, currEditorTheme, isBiColorEditor } = useBiColorEditor()
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
const unsubcribe = bus.on((event: string, { callback }) => {
  if (event === 'genMaskUrl') {
    callback(getCanvasDataUrl())
  }

  if (event === 'fitPage') {
    fitPage(fitScaleRatio.value)
  }
})
onBeforeUnmount(() => {
  unsubcribe()
})
// #endregion

// #region Canvas functions
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
const swipeDetector: SwipeDetector = null as unknown as SwipeDetector

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

// watch(resultShowcase, () => {
//   if (resultShowcase) {
//     swipeDetector = new SwipeDetector(
//       resultShowcase.value as HTMLElement,
//       {
//         targetDirection: 'horizontal',
//       },
//       handleSwipe,
//     )
//   } else {
//     swipeDetector.unbind()
//   }
// })

const handleSwipe = (dir: string) => {
  showVideo.value = !showVideo.value
}
// #endregion

const { setCurrOpenDesign, setCurrOpenSubDesign } = useUserStore()

const handleHomeBtnAction = (navagate: () => void) => {
  setCurrOpenDesign(undefined)
  setCurrOpenSubDesign(undefined)
  navagate()
}
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
    @apply grid grid-rows-[minmax(0,1fr),auto,auto] grid-cols-1 justify-items-center items-center h-full w-full gap-16;
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

    &--back {
    }
  }
}

.is-flipped {
  transform: rotateY(180deg);
}
</style>
