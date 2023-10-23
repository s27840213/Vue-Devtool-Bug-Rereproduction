<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[auto,minmax(0,1fr),auto] relative")
  div(class="main-page-headerbar w-full flex justify-between items-center px-16"
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
  router-view(class="pb-12" v-slot="{ Component, route }")
    transition(
      :name="`${route.meta.transition}`"
      mode="out-in")
      component(:is="Component")
  bottom-panel(class="z-20")
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
    img-selector(v-if="showImgSelector" class="absolute top-0 left-0 w-full h-full z-30")
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AspectRatioSelector from './components/panel-content/AspectRatioSelector.vue'
import HomeTab from './components/panel-content/HomeTab.vue'
import ModalTemplate from './components/panel-content/ModalTemplate.vue'
import PromptArea from './components/panel-content/PromptArea.vue'
import useStateInfo from './composable/useStateInfo'
import { useModalStore } from './stores/modal'
// #region route info
const stateInfo = useStateInfo()
const {
  showAspectRatioSelector,
  showHomeTabs,
  isEditing,
  atMyDesign,
  atSettings,
  atMainPage,
  showImgSelector,
} = stateInfo
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
@import '@/assets/scss/transitions.scss';
.mask {
  @apply w-full h-full fixed top-0 left-0 z-10  backdrop-blur-sm;
  transition: backdrop-filter 0.25;
  background-color: rgba(#050505, 0.5);
}

.main-page-headerbar {
  transition:
    height 0.25s,
    opacity 0.25s;
}
</style>
