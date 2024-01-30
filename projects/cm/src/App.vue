<template lang="pug">
div(class="app-root w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr),auto] relative font-[Lato] box-border"
  :class="{'bg-dark-6': !isDuringCopy && !atScreenshot}")
  link(
      href="https://fonts.googleapis.com/css?family=Poppins:400,600,700"
      rel="stylesheet"
      type="text/css")
  div(v-if="atMainPage && !isDesignOpen" class="w-full flex-between-center box-border px-16"
    :style="{height: `${statusBarHeight + 48}px`, paddingTop: `${statusBarHeight}px`}")
    router-link(
      custom
      :to="'/'"
      v-slot="{ navigate }")
      img(src="@/assets/img/logo.png" class="w-30" @click="navigate")
    div(class="flex-center gap-18")
      transition(
          name="rotate-right-in"
          mode="out-in")
        div(v-if="atMyDesign" )
          router-link(
            custom
            to="/settings"
            v-slot="{ navigate }")
            svg-icon(iconName="cm_settings"
              :iconColor="'yellow-0'" @click="navigate")
      nubtn(size="mid" icon="crown" @click="handleProBtnClick") {{ `${$t('CM0030')}`.toUpperCase() }}
  router-view(
    class="router-view box-border min-h-full row-start-2 row-end-3"
    :class="{ 'pb-12': !atNonUI  && !atMyDesign}"
    v-slot="{ Component, route }")
    transition(
      :name="`${route.meta.transition}`"
      mode="out-in")
      component(:is="Component")
  bottom-panel(v-if="bottomPanelComponent && !atNonUI && !(isDuringCopy && !isAutoFilling)"
    class="z-bottom-panel row-start-3 row-end-4 tutorial-powerful-fill-4--highlight tutorial-hidden-message-4--highlight"
    :class="{'translate-y-full pointer-events-none': isActionSheetOpen}"
    :disableTransition="disableBtmPanelTransition")
    template(#content="{setSlotRef, disableTransition}")
      transition(
        name="bottom-panel-transition"
        mode="out-in"
        @afterEnter="afterEnter"
        @beforeLeave="beforeLeave")
        component(:is="bottomPanelComponent"
                  :ref="(el: any) => setSlotRef(el)"
                  :currActivePanel="currActivePanel"
                  :currPage="currPage"
                  :currTab="currActivePanel"
                  @switchTab="(switchTab)"
                  @disableBtmPanelTransition="(disableTransition)")
  tutorial
  //- mask cannot be moved to abs container bcz bottom panel should overlay mask
  div(
    v-if="wantToQuit || inMediaOptions || showRecognizingCheck"
    class="mask"
    :class="{'no-blur': showRecognizingCheck}"
    ref="maskRef"
    @click.stop="closeModal")
  //- why we need this is to make the status bar height could work to every overlay element
  div(class="absolute-container w-full h-full absolute top-0 left-0 z-abs-container flex flex-col justify-start box-border pointer-events-none"
    :style="{paddingTop: `${statusBarHeight}px`}")
    transition(name="bottom-up-down")
      img-selector(
        v-if="showImgSelector"
        class="w-full h-full z-img-selector pointer-events-auto"
        :requireNum="requireImgNum")
    transition(name="fade-in-out")
      div(v-if="showDescriptionPanel || inMediaOptions"
      class="absolute w-full h-full pointer-events-auto bg-dark-4/70"
      :class="showDescriptionPanel ? 'z-description-panel' : 'z-popup'")
    transition(name="bottom-up-down")
      bottom-panel(
        v-if="showDescriptionPanel || inMediaOptions"
        class="absolute bottom-0 pointer-events-auto"
        :class="showDescriptionPanel ? 'z-description-panel' : 'z-popup'"
        :gap="statusBarHeight + 150"
        :ignoreHomeIndicator="showDescriptionPanel")
        template(#content="{setSlotRef}")
          transition(
            name="bottom-panel-transition"
            mode="out-in")
            panel-description(v-if="showDescriptionPanel" :ref="(el: any) => setSlotRef(el)")
            saving-options(v-else-if="inMediaOptions" :ref="(el: any) => setSlotRef(el)")
    div(class="popup-area")
      popup(class="pointer-events-auto")
    div(class="modal-container pointer-events-auto" v-if="isModalOpen" :style="backdropStyle")
      modal-card
    transition(:name="fullpageTransition")
      full-page(v-if="fullPageType !== 'none'" class="pointer-events-auto")
    notifications(
      class="notification flex-center "
      position="center center"
      group="success"
      :max="2"
      :duration="2000")
      template(v-slot:body="{ item }")
        div(class="notification__content bg-yellow-1/80")
          svg-icon(iconName="ok-hand")
          span( v-html="item.text")
    notifications(
      class="notification flex-center "
      position="center center"
      group="error"
      :max="2"
      :duration="2000")
      template(v-slot:body="{ item }")
        div(class="notification__content bg-red-cm/80 text-white")
          svg-icon(iconName="warning")
          span( v-html="item.text")
    notifications(
      class="notification flex-center "
      position="center center"
      group="warn"
      :max="2"
      :duration="2000")
      template(v-slot:body="{ item }")
        div(class="notification__content bg-yellow-1/80 text-dark")
          svg-icon(iconName="red-exclamation-mark")
          span( v-html="item.text")
    transition(name="bottom-up-down")
      div(v-if="isActionSheetOpen" class="w-full h-full flex items-end z-action-sheet px-16 box-border "
      :style="{paddingBottom: `${homeIndicatorHeight}px`}")
          action-sheet(class="pointer-events-auto "
            :primaryActions="primaryActions"
            :secondaryActions="secondaryActions")
    transition(name="fade-bottom-in-out")
      div(v-if="prevScreenshotUrl && debugMode && !isDuringCopy" class="screenshot-demo bg-white/80 absolute bottom-[30%] left-0 p-8 pointer-events-none rounded-8 flex-center flex-col gap-8")
        span(class="typo-btn-xs") Screenshot result
        img(class="object-contain w-80 shadow-gray-1 shadow-sm shadow-"
        :src="prevScreenshotUrl")
</template>

<script setup lang="ts">
import PanelLogin from '@/components/editor/panelMobile/PanelLogin.vue'
import type { IUserInfo } from '@/utils/cmWVUtils'
import vuex from '@/vuex'
import ModalCard from '@nu/vivi-lib/components/modal/ModalCard.vue'
import type { IFooterTabProps } from '@nu/vivi-lib/interfaces/editor'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import eventUtils, { PanelEvent } from '@nu/vivi-lib/utils/eventUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { storeToRefs } from 'pinia'
// import VConsole from 'vconsole'
import FullPage from '@nu/vivi-lib/components/fullPage/FullPage.vue'
import cmWVUtils from '@nu/vivi-lib/utils/cmWVUtils'
import colorUtils from '@nu/vivi-lib/utils/colorUtils'
import { useStore } from 'vuex'
import AspectRatioSelector from './components/panel-content/AspectRatioSelector.vue'
import BrushOptions from './components/panel-content/BrushOptions.vue'
import CanvasOptions from './components/panel-content/CanvasOptions.vue'
import FooterTabs from './components/panel-content/FooterTabs.vue'
import GenResult from './components/panel-content/GenResult.vue'
import HomeTab from './components/panel-content/HomeTab.vue'
import ModalTemplateCm from './components/panel-content/ModalTemplateCm.vue'
import PanelDescription from './components/panel-content/PanelDescription.vue'
import PromptArea from './components/panel-content/PromptArea.vue'
import SavingOptions from './components/panel-content/SavingOptions.vue'
import SavingTab from './components/panel-content/SavingTab.vue'
import SelectionOptions from './components/panel-content/SelectionOptions.vue'
import RecognizingCheck from './components/panel-content/RecognizingCheck.vue'
import useActionSheetCm from './composable/useActionSheetCm'
import useStateInfo from './composable/useStateInfo'
import { useCanvasStore } from './stores/canvas'
import { useGlobalStore } from './stores/global'
import { useImgSelectorStore } from './stores/imgSelector'
import { useMediaStore } from './stores/media'
import { useModalStore } from './stores/modal'

const { requireImgNum } = storeToRefs(useImgSelectorStore())

// #region state info
const {
  inAspectRatioState,
  showHomeTabs,
  inEditingState,
  showBrushOptions,
  showSelectionOptions,
  atMyDesign,
  atSettings,
  atMainPage,
  atDescription,
  atScreenshot,
  atNonUI,
  showImgSelector,
  inGenResultState,
  inSavingState,
  showDescriptionPanel,
  isDesignOpen,
  isSubDesignOpen,
  showRecognizingCheck,
} = useStateInfo()

const fullPageType = computed(() => store.getters.getFullPageType)

const canvasStore = useCanvasStore()
const { isAutoFilling } = storeToRefs(canvasStore)

const mediaStore = useMediaStore()
const { inMediaOptions } = storeToRefs(mediaStore)
// #endregion

// #region bottom panel warning modal
const modalStore = useModalStore()
const { isModalOpen: wantToQuit } = storeToRefs(modalStore)
const isModalOpen = computed(
  () => (vuex.getters['modal/getModalOpen'] as boolean) && !atScreenshot.value,
)
const backdropStyle = computed(() => {
  return vuex.getters['modal/getModalInfo'].backdropStyle
})
// #endregion

const bottomPanelComponent = computed(() => {
  switch (true) {
    case atDescription.value:
      return null
    case wantToQuit.value:
      return ModalTemplateCm
    case vuex.state.user.showForceLogin:
      return PanelLogin
    case isSubDesignOpen.value:
      return SavingTab
    case showHomeTabs.value:
    case atSettings.value:
      return HomeTab
    case inAspectRatioState.value:
      return AspectRatioSelector
    case vuex.getters['canvasResize/getIsResizing']:
      return CanvasOptions
    case showBrushOptions.value:
      return BrushOptions
    case showSelectionOptions.value:
      return SelectionOptions
    case layerIndex.value !== -1:
      return FooterTabs
    case inGenResultState.value:
      return GenResult
    case showRecognizingCheck.value:
      return RecognizingCheck
    case inEditingState.value:
      return PromptArea
    case inSavingState.value:
      return SavingTab
    default:
      return ModalTemplateCm
  }
})

const closeModal = () => {
  modalStore.closeModal()
}

// #region mobile panel
const store = useStore()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const disableBtmPanelTransition = ref(false)
const currActivePanel = computed(() => store.getters['mobileEditor/getCurrActivePanel'])
const inBgRemoveMode = computed(() => store.getters['bgRemove/getInBgRemoveMode'])
const layerIndex = computed(() => layerUtils.layerIndex)
const selectedLayerNum = computed(() => store.getters.getCurrSelectedInfo.layers.length)

const currPage = computed(() => {
  return pageUtils.getPage(pageUtils.currFocusPageIndex)
})

const switchTab = (panelType: string, props?: IFooterTabProps) => {
  if (!inBgRemoveMode && panelType === 'remove-bg') {
    return
  }
  // Switch between color and text-color panel without close panel
  if (
    currActivePanel.value === panelType &&
    panelType === 'color' &&
    props?.currColorEvent &&
    colorUtils.currEvent !== props.currColorEvent
  ) {
    colorUtils.setCurrEvent(props.currColorEvent as string)
    // Close panel if re-click
  } else if (currActivePanel.value === panelType || panelType === 'none') {
    editorUtils.setShowMobilePanel(false)
    if (panelType === 'none') {
      editorUtils.setInMultiSelectionMode(false)
    }
  } else {
    editorUtils.setCurrActivePanel(panelType)
    if (panelType === 'color' && props?.currColorEvent) {
      colorUtils.setCurrEvent(props.currColorEvent as string)
    }
  }
}

watch(
  computed(() => store.getters['mobileEditor/getCloseMobilePanelFlag']),
  (newVal) => {
    if (newVal) {
      editorUtils.setCurrActivePanel('none')
      store.commit('SET_closeMobilePanelFlag', false)
      editorUtils.setShowMobilePanel(false)
    }
  },
)

watch(selectedLayerNum, (newVal) => {
  if (newVal === 0) {
    editorUtils.setCurrActivePanel('none')
    editorUtils.setInMultiSelectionMode(false)
    editorUtils.setShowMobilePanel(false)
  }
})

const afterEnter = () => {
  if (layerIndex.value !== -1) {
    disableBtmPanelTransition.value = true
  }
}

const beforeLeave = () => {
  if (layerIndex.value === -1) {
    disableBtmPanelTransition.value = false
  }
}

eventUtils.on(PanelEvent.switchTab, switchTab)

onBeforeUnmount(() => {
  eventUtils.off(PanelEvent.switchTab)
})
// #endregion

// const vConsole = new VConsole({ theme: 'dark' })
// vConsole.setSwitchPosition(25, 80)

// watch(isDuringCopy, (newVal) => {
//   if (newVal) {
//     vConsole.hideSwitch()
//   } else {
//     vConsole.showSwitch()
//   }
// })

// #region action sheet
const { primaryActions, secondaryActions, isActionSheetOpen } = useActionSheetCm()
// #endregion

// #region webview
const userInfo = computed(() => store.getters['cmWV/getUserInfo'] as IUserInfo)
const statusBarHeight = computed(() => userInfo.value.statusBarHeight)
const homeIndicatorHeight = computed(() => userInfo.value.homeIndicatorHeight)

// #endregion

// #region pro
const handleProBtnClick = () => {
  cmWVUtils.openPayment()
}
// #endregion

// #region full page
const fullpageTransition = ref('bottom-up-down')
watch(fullPageType, (newVal) => {
  nextTick(() => {
    fullpageTransition.value = newVal === 'welcome' ? 'fade-in-out' : 'bottom-up-down'
  })
})
// #endregion

const { prevScreenshotUrl, debugMode } = storeToRefs(useGlobalStore())
</script>

<style lang="scss">
@use '@/assets/scss/main.scss';
@use '@/assets/scss/transitions.scss';

.mask {
  @apply w-full h-full fixed top-0 left-0 z-modal-mask;
  animation: blur-in 0.25s forwards;
  background-color: rgba(#050505, 0.5);
  &.no-blur {
    animation: none;
    @apply bg-dark-4/70
  }
}

.popup-area {
  @apply z-popup;
  @include size(100%, 100%);
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  pointer-events: none;
  > div {
    pointer-events: initial;
  }
}

.modal-container {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: setColor(gray-1, 0.3);
  z-index: 999;
}

.notification {
  // to diable vue-notification's default style(display: block)
  display: flex !important;
  .vue-notification-wrapper {
    display: flex !important;
    justify-content: center;
    align-items: center;
  }
  // its a little bit confused, so if you want to know why, just ask me in person
  // and I will demo the problem to you - Alan
  position: absolute !important;
  &__content {
    @apply mt-12 w-fit typo-body-sm px-16 py-10 box-border rounded-full flex-center gap-8;
  }
}
</style>
