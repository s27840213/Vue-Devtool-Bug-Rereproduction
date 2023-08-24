<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[minmax(0,1fr),auto]")
  div(
    v-if="isModalOpen"
    class="mask"
    ref="maskRef"
    @click.stop="closeModal")
  router-view(class="pb-12" v-slot="{ Component }")
    transition(
      :name="routeTransitionName"
      mode="out-in")
      component(:is="Component")
  bottom-panel(class="z-20")
    transition(
      name="fade-down-up"
      mode="out-in")
      modal-template(v-if="isModalOpen")
      home-tab(v-else-if="showHomeTabs")
      aspect-ratio-selector(v-else-if="showAspectRatioSelector")
      editing-options(v-else-if="showEditingOpstions && !isModalOpen")
      prompt-area(v-else-if="showPromptArea")
  //- div(class="fixed bottom-1/4 left-4 text-app-selection") {{ atHome }} {{ atMyDesign }} {{ routeInfo.atHome }}
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
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
  atMyDesign
} = stateInfo
// #endregion

const modalStore = useModalStore()
const { isModalOpen } = storeToRefs(modalStore)

const routeTransitionName = computed(() => {
  if (atHome.value) return 'fade-left-in'
  if (atMyDesign.value) return 'fade-right-in'
  return 'fade-right-in'
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

.fade-down-up {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.15s,
      transform 0.15s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
}

.fade-up-down {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.15s,
      transform 0.15s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style>
