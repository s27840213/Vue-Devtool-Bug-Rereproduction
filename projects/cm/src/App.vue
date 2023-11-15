<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr),auto] relative font-[Lato]")
  link(
      href="https://fonts.googleapis.com/css?family=Poppins:400,600,700"
      rel="stylesheet"
      type="text/css")
  tutorial
  div(class="w-full justify-between items-center box-border px-16 h-72"
      :class="atMainPage ? 'flex' : 'hidden'")
    router-link(
      custom
      :to="'/'"
      v-slot="{ navigate }")
      img(src="@/assets/img/logo.png" class="w-44" @click="navigate")
    div(class="flex justify-center items-center gap-18")
      transition(
          name="rotate-right-in"
          mode="out-in")
        div(v-if="atMyDesign" )
          router-link(
            custom
            to="/settings"
            v-slot="{ navigate }")
            svg-icon(iconName="settings"
              :iconColor="'app-tab-default'" @click="navigate")
      cm-btn(
        :theme="'primary'"
        :hasIcon="true"
        iconName="crown") {{ `${$t('CM0030')}`.toUpperCase() }}
  router-view(
    class="box-border pb-12 min-h-full row-start-2 row-end-3"
    v-slot="{ Component, route }")
    transition(
      :name="`${route.meta.transition}`"
      mode="out-in")
      component(:is="Component")
  bottom-panel(v-if="!atEventTester && !isDuringCopy"
    class="z-bottom-panel row-start-3 row-end-4"
    :class="{'translate-y-full pointer-events-none': isActionSheetOpen}"
    :style="disableBtmPanelTransition ? 'transition: none' : ''")
    template(#content="{setSlotRef}")
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
                  @switchTab="switchTab")
  div(
    v-if="wantToQuit || isModalOpen"
    class="mask"
    ref="maskRef"
    @click.stop="closeModal")
  transition(name="bottom-up")
    img-selector(
      v-if="showImgSelector"
      class="absolute top-0 left-0 w-full h-full z-img-selector"
      :requireNum="requireImgNum")
  div(class="popup-area")
    popup
  div(class="modal-container" v-if="isModalOpen")
    modal-card
  notifications(
    group="success"
    :max="2"
    :duration="2000")
    template(v-slot:body="{ item }")
      div(class="w-fit top-0 left-1/2 typo-body-sm px-16 py-10 box-border rounded-full flex justify-center items-center gap-8 bg-app-toast-success")
        svg-icon(iconName="ok-hand")
        span( v-html="item.text")
  notifications(
    group="error"
    position="top center"
    width="300px"
    :max="1"
    :duration="5000")
    template(v-slot:body="{ item }")
      div(class="notification error " v-html="item.text")
  transition(name="bottom-up")
    div(v-if="isActionSheetOpen" class="w-full absolute bottom-32 left-0 z-action-sheet px-16 box-border")
        action-sheet(
          :primaryActions="primaryActions"
          :secondaryActions="secondaryActions")
</template>

<script setup lang="ts">
import PanelLogin from '@/components/editor/panelMobile/PanelLogin.vue'
import vuex from '@/vuex'
import ModalCard from '@nu/vivi-lib/components/modal/ModalCard.vue'
import type { IFooterTabProps } from '@nu/vivi-lib/interfaces/editor'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import eventUtils, { PanelEvent } from '@nu/vivi-lib/utils/eventUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { storeToRefs } from 'pinia'
// import VConsole from 'vconsole'
import { useStore } from 'vuex'
import AspectRatioSelector from './components/panel-content/AspectRatioSelector.vue'
import BrushOptions from './components/panel-content/BrushOptions.vue'
import FooterTabs from './components/panel-content/FooterTabs.vue'
import GenResult from './components/panel-content/GenResult.vue'
import HomeTab from './components/panel-content/HomeTab.vue'
import ModalTemplate from './components/panel-content/ModalTemplate.vue'
import PromptArea from './components/panel-content/PromptArea.vue'
import SavingTab from './components/panel-content/SavingTab.vue'
import SelectionOptions from './components/panel-content/SelectionOptions.vue'
import Popup from './components/popup/Popup.vue'
import useActionSheetCm from './composable/useActionSheetCm'
import useStateInfo from './composable/useStateInfo'
import { useImgSelectorStore } from './stores/imgSelector'
import { useModalStore } from './stores/modal'

const { requireImgNum } = storeToRefs(useImgSelectorStore())

// #region state info
const stateInfo = useStateInfo()
const {
  inAspectRatioState,
  showHomeTabs,
  inEditingState,
  showBrushOptions,
  showSelectionOptions,
  atMyDesign,
  atSettings,
  atMainPage,
  atEventTester,
  showImgSelector,
  inGenResultState,
  inSavingState,
} = stateInfo
// #endregion

// #region function panel
const layerIndex = computed(() => layerUtils.layerIndex)
// #endregion

// #region bottom panel warning modal
const modalStore = useModalStore()
const { isModalOpen: wantToQuit } = storeToRefs(modalStore)
const isModalOpen = computed(() => vuex.getters['modal/getModalOpen'] as boolean)
// #endregion

const bottomPanelComponent = computed(() => {
  switch (true) {
    case wantToQuit.value:
      return ModalTemplate
    case vuex.state.user.showForceLogin:
      return PanelLogin
    case showHomeTabs.value:
    case atSettings.value:
      return HomeTab
    case inAspectRatioState.value:
      return AspectRatioSelector
    case showBrushOptions.value:
      return BrushOptions
    case showSelectionOptions.value:
      return SelectionOptions
    case layerIndex.value !== -1:
      return FooterTabs
    case inGenResultState.value:
      return GenResult
    case inEditingState.value:
      return PromptArea
    case inSavingState.value:
      return SavingTab
    default:
      return ModalTemplate
  }
})

const closeModal = () => {
  modalStore.closeModal()
}

// #region mobile panel
const store = useStore()
const isDuringCopy = computed(() => store.getters['cmWV/getIsDuringCopy'])
const currColorEvent = ref('')
const disableBtmPanelTransition = ref(false)
const currActivePanel = computed(() => store.getters['mobileEditor/getCurrActivePanel'])
const inBgRemoveMode = computed(() => store.getters['bgRemove/getInBgRemoveMode'])

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
    currColorEvent.value !== props.currColorEvent
  ) {
    currColorEvent.value = props.currColorEvent
    // Close panel if re-click
  } else if (currActivePanel.value === panelType || panelType === 'none') {
    editorUtils.setShowMobilePanel(false)
    editorUtils.setInMultiSelectionMode(false)
  } else {
    editorUtils.setCurrActivePanel(panelType)
    if (panelType === 'color' && props?.currColorEvent) {
      currColorEvent.value = props.currColorEvent
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
</script>

<style lang="scss">
@use '@/assets/scss/main.scss';
@use '@/assets/scss/transitions.scss';

.mask {
  @apply w-full h-full fixed top-0 left-0 z-modal-mask  backdrop-blur-sm;
  transition: backdrop-filter 0.25;
  background-color: rgba(#050505, 0.5);
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
  @apply w-fit top-0 left-1/2 typo-body-sm px-16 py-10 box-border rounded-full flex justify-center items-center gap-8 bg-app-toast-success;
}
</style>
