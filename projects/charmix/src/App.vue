<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[minmax(0,1fr),auto] relative")
  router-view(class="pb-12" v-slot="{ Component }")
    transition(
      :name="routeTransitionName"
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
  //- div(class="fixed bottom-1/4 left-4 text-app-selection") {{ atHome }} {{ atMyDesign }} {{ routeInfo.atHome }}
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AspectRatioSelector from './components/panel-content/AspectRatioSelector.vue'
import EditingOptions from './components/panel-content/EditingOptions.vue'
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
  showEditingOpstions,
  showPromptArea,
  atHome,
  atMyDesign,
  showImgSelector,
} = stateInfo
// #endregion

const modalStore = useModalStore()
const { isModalOpen } = storeToRefs(modalStore)

const routeTransitionName = computed(() => {
  if (atHome.value) return 'fade-left-in'
  if (atMyDesign.value) return 'fade-right-in'
  return 'fade-right-in'
})

const bottomPanelComponent = computed(() => {
  switch (true) {
    case isModalOpen.value:
      return ModalTemplate
    case showHomeTabs.value:
      return HomeTab
    case showAspectRatioSelector.value:
      return AspectRatioSelector
    case showEditingOpstions.value:
      return EditingOptions
    case showPromptArea.value:
      return PromptArea
    default:
      return ModalTemplate
  }
})

const closeModal = () => {
  modalStore.closeModal()
}
</script>

<style lang="scss">
.mask {
  @apply w-full h-full fixed top-0 left-0 z-10  backdrop-blur-sm;
  transition: backdrop-filter 0.25;
  background-color: rgba(#050505, 0.5);
}

.fade-right-in {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from {
    opacity: 0;
    transform: translateX(50%);
  }
  &-leave-to {
    opacity: 0;
    transform: translateX(-50%);
  }
}

.fade-right-in-out {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateX(50%);
  }
}

.fade-left-in {
  &-enter-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from {
    opacity: 0;
    transform: translateX(-50%);
  }
  &-leave-to {
    opacity: 0;
    transform: translateX(50%);
  }
}

.fade-left-in-out {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateX(-50%);
  }
}

.bottom-panel-transition {
  &-enter-active {
    transition:
      opacity 0.25s 0.1s,
      transform 0.25s 0.1s;
  }
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(5px);
  }
}

.bottom-up {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>
