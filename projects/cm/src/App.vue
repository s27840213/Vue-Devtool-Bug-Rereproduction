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
  bottom-panel(class="z-bottom-panel")
    template(#content="{setSlotRef}")
      transition(
        name="bottom-panel-transition"
        mode="out-in")
        component(:is="bottomPanelComponent" :ref="(el: any) => setSlotRef(el)")
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
import layerUtils from '@nu/vivi-lib/utils/layerUtils'
import { storeToRefs } from 'pinia'
import AspectRatioSelector from './components/panel-content/AspectRatioSelector.vue'
import EditingOptions from './components/panel-content/EditingOptions.vue'
import FooterTabs from './components/panel-content/FooterTabs.vue'
import GenResult from './components/panel-content/GenResult.vue'
import HomeTab from './components/panel-content/HomeTab.vue'
import ModalTemplate from './components/panel-content/ModalTemplate.vue'
import PromptArea from './components/panel-content/PromptArea.vue'
import SelectionOptions from './components/panel-content/SelectionOptions.vue'
import useStateInfo from './composable/useStateInfo'
import { useImgSelectorStore } from './stores/imgSelector'
import { useModalStore } from './stores/modal'

const { requireImgNum } = storeToRefs(useImgSelectorStore())

// #region state info
const stateInfo = useStateInfo()
const {
  showAspectRatioSelector,
  showHomeTabs,
  isEditing,
  showBrushOptions,
  showSelectionOptions,
  atMyDesign,
  atSettings,
  atMainPage,
  showImgSelector,
  showGenResult,
} = stateInfo
// #endregion

// #region function panel
const layerIndex = computed(() => layerUtils.layerIndex)
// #endregion

const modalStore = useModalStore()
const { isModalOpen } = storeToRefs(modalStore)

const bottomPanelComponent = computed(() => {
  switch (true) {
    case isModalOpen.value:
      return ModalTemplate
    case showHomeTabs.value:
    case atSettings.value:
      return HomeTab
    case showAspectRatioSelector.value:
      return AspectRatioSelector
    case showBrushOptions.value:
      return EditingOptions
    case showSelectionOptions.value:
      return SelectionOptions
    case layerIndex.value !== -1:
      return FooterTabs
    case showGenResult.value:
      return GenResult
    case isEditing.value:
      return PromptArea
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
