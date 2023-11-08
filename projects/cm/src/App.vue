<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr),auto] relative")
  tutorial
  div(class="main-page-headerbar w-full flex justify-between items-center box-border px-16"
      ref="headerbarRef"
      :style="headerbarStyles")
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
            cm-svg-icon(iconName="settings"
              :iconColor="'app-tab-default'" @click="navigate")
      cm-btn(
        :theme="'primary'"
        :hasIcon="true"
        iconName="crown") {{ `${$t('CM0030')}`.toUpperCase() }}
  router-view(class="box-border pb-12" v-slot="{ Component, route }")
    transition(
      :name="`${route.meta.transition}`"
      mode="out-in")
      component(:is="Component")
  bottom-panel(class="z-bottom-panel" :style="disableBtmPanelTransition ? 'transition: none' : ''")
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
    v-if="isModalOpen"
    class="mask"
    ref="maskRef"
    @click.stop="closeModal")
  transition(name="bottom-up")
    img-selector(
      v-if="showImgSelector"
      class="absolute top-0 left-0 w-full h-full z-img-selector"
      :requireNum="requireImgNum")
  notifications(
    group="copy"
    position="top center"
    width="300px"
    :max="2"
    :duration="2000")
    template(v-slot:body="{ item }")
      div(class="notification copy" v-html="item.text")
  notifications(
    group="error"
    position="top center"
    width="300px"
    :max="1"
    :duration="5000")
    template(v-slot:body="{ item }")
      div(class="notification error" v-html="item.text")
</template>

<script setup lang="ts">
import type { IFooterTabProps } from '@nu/vivi-lib/interfaces/editor'
import editorUtils from '@nu/vivi-lib/utils/editorUtils'
import eventUtils, { PanelEvent } from '@nu/vivi-lib/utils/eventUtils'
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import pageUtils from '@nu/vivi-lib/utils/pageUtils'
import { storeToRefs } from 'pinia'
import VConsole from 'vconsole'
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
const { isModalOpen } = storeToRefs(modalStore)
// #endregion

const bottomPanelComponent = computed(() => {
  switch (true) {
    case isModalOpen.value:
      return ModalTemplate
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

const headerbarRef = ref<HTMLElement | null>(null)
const headerbarStyles = computed(() => {
  return {
    height: atMainPage.value ? '72px' : '0px',
    opacity: atMainPage.value ? 1 : 0,
  }
})

// #region mobile panel
const store = useStore()
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

const vConsole = new VConsole({ theme: 'dark' })
vConsole.setSwitchPosition(25, 80)
</script>

<style lang="scss">
@use '@/assets/scss/main.scss';
@use '@/assets/scss/transitions.scss';

.mask {
  @apply w-full h-full fixed top-0 left-0 z-modal-mask  backdrop-blur-sm;
  transition: backdrop-filter 0.25;
  background-color: rgba(#050505, 0.5);
}

.main-page-headerbar {
  transition:
    height 0.25s,
    opacity 0.25s;
}

.notification {
  padding: 5px;
  text-align: center;
  color: setColor(white);
  margin: 5px 5px 0 0;
  border-radius: 5px;
  &.copy {
    background-color: setColor(blue-2);
  }
  &.error {
    background-color: setColor(red-2);
  }
}
</style>
