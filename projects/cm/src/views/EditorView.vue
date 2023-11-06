<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr)]")
  headerbar(class="box-border px-24" :middGap="32" ref="headerbarRef")
    template(#left)
      back-btn
    template(
      v-if="isEditing"
      #middle)
      div(class="text-white typo-h5 whitespace-nowrap")
        link-or-text(v-if="showActiveTab" :title="centerTitle" :url="centerUrl")
      //- cm-svg-icon(
      //-   iconName="undo"
      //-   :iconColor="'app-btn-primary-text'"
      //-   iconWidth="20px")
      //- cm-svg-icon(
      //-   iconName="redo"
      //-   :iconColor="'app-btn-primary-text'"
      //-   iconWidth="20px")
    template(#right)
      //- cm-btn(
      //-   v-if="isEditing"
      //-   theme="primary"
      //-   size="md"
      //-   @click="downloadCanvas") 下載 Mask
      cm-btn(
        v-if="showAspectRatioSelector"
        theme="primary"
        size="md"
        @click="handleNextAction") {{ $t('CM0012') }}
  div(class="editor-container flex justify-center items-center relative" ref="editorContainerRef")
    div(
      class="w-full h-full box-border overflow-scroll flex justify-center items-center"
      @click.self="handleOuterClick")
      div(
        id="screenshot-target"
        class="wrapper relative tutorial-powerful-fill-3--highlight"
        :style="wrapperStyles"
        ref="editorWrapperRef")
        //- div(
        //-   id="editor-page"
        //-   class="page bg-primary-white origin-top-left overflow-hidden flex items-center justify-center"
        //-   :style="pageStyles")
          //- img(class="h-full object-contain" src="@/assets/img/test.jpg")
        nu-page(class="z-page"
          v-show="!showGenResult"
          :pageIndex="0"
          :pageState="pageState[0]"
          :overflowContainer="editorContainerRef"
          :noBg="isDuringCopy && isNoBg")
        canvas-section(
          v-if="isEditing"
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
      v-if="isEditing && !showGenResult && !showSelectionOptions"
      class="absolute top-1/2 right-0 -translate-y-1/2"
      ref="sidebarTabsRef"
      @downloadMask="downloadCanvas")
    div(
      v-if="showGenResult"
      class="absolute top-0 left-0 flex justify-center items-center w-full h-full bg-app-bg z-modal-mask")
      img(:src="generatedResult" class="w-240")
  transition(name="bottom-up")
    component(v-if="showActiveTab && isEditing"
              :is="assetPanelComponent"
              class="bg-app-bg absolute left-0 w-full z-asset-panel box-border"
              :style="assetPanelStyles")
</template>
<script setup lang="ts">
import Headerbar from '@/components/Headerbar.vue'
import useImageUtils from '@/composable/useImageUtils'
import useStateInfo from '@/composable/useStateInfo'
import { useCanvasStore } from '@/stores/canvas'
import { useEditorStore } from '@/stores/editor'
import tutorialUtils from '@/utils/tutorialUtils'
import LinkOrText from '@nu/vivi-lib/components/LinkOrText.vue'
import NuPage from '@nu/vivi-lib/components/editor/global/NuPage.vue'
import PanelObject from '@nu/vivi-lib/components/editor/panelMobile/PanelObject.vue'
import PanelText from '@nu/vivi-lib/components/editor/panelMobile/PanelText.vue'
import PanelTextUs from '@nu/vivi-lib/components/editor/panelMobileUs/PanelText.vue'
import useI18n from '@nu/vivi-lib/i18n/useI18n'
import assetPanelUtils from '@nu/vivi-lib/utils/assetPanelUtils'
import groupUtils from '@nu/vivi-lib/utils/groupUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import textUtils from '@nu/vivi-lib/utils/textUtils'
import { useElementSize, useEventBus } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import type { VNodeRef } from 'vue'
import { useStore } from 'vuex'

const headerbarRef = ref<typeof Headerbar | null>(null)
const editorContainerRef = ref<HTMLElement | null>(null)
const editorWrapperRef = ref<HTMLElement | null>(null)
const sidebarTabsRef = ref<HTMLElement | null>(null)
const { width: sidebarTabsWidth } = useElementSize(sidebarTabsRef)

const { width: editorContainerWidth, height: editorContainerHeight } =
  useElementSize(editorContainerRef)

const { imgLoadHandler } = useImageUtils()

onBeforeRouteLeave((to, from) => {
  if (from.name === 'Editor') {
    setTimeout(() => {
      /**
       * @NOTE - if we reset immediately, will see the editor from editing state to initial state bcz transition time
       */
      editorStore.$reset()
    }, 1000)
  }
})

const store = useStore()
const i18n = useI18n()
const pageState = computed(() => store.getters.getPagesState)
const pageScaleRatio = computed(() => store.getters.getPageScaleRatio)
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const isNoBg = computed(() => store.getters['cmWV/getIsNoBg'])

// #region Stores
const { isEditing, atEditor, showAspectRatioSelector, showSelectionOptions } = useStateInfo()
const editorStore = useEditorStore()
const { setEditorState } = editorStore
const { pageSize, editorState, currActiveFeature, generatedResult, showGenResult } =
  storeToRefs(editorStore)
const isManipulatingCanvas = computed(() => currActiveFeature.value === 'brush')

const handleNextAction = function () {
  if (editorState.value === 'aspectRatio') {
    setEditorState('editing')
    tutorialUtils.runTutorial('powerful-fill')
  } else if (editorState.value === 'editing') {
    setEditorState('prompt')
  }
}
// #endregion

// #region page related
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
    height: `calc(100% - ${assetPanelTop.value}px)`
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
        url: staticHeaderTab.bulbUrl || ''
      }
    case 'text':
      return {
        title: textHeaderTab.title,
        url: textHeaderTab.bulbUrl
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
</script>
<style lang="scss">
.demo-brush {
  @apply absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-app-selection bg-opacity-30;
  @apply pointer-events-none rounded-full outline-4 outline-primary-white;
  outline-style: solid;
}
</style>
