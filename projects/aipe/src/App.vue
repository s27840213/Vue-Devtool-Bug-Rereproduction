<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[minmax(0,1fr),auto]")
  router-view(class="pb-12" v-slot="{ Component }")
    transition(
      :name="routeTransitionName"
      mode="out-in")
      component(:is="Component")
  bottom-panel(class="z-10")
    transition(
      name="fade-down-up"
      mode="out-in")
      home-tab(v-if="showHomeTabs")
      aspect-ratio-selector(v-else-if="showAspectRatioSelector")
      editing-options(v-else-if="showEditingOpstions")
  //- div(class="fixed bottom-1/4 left-4 text-app-selection") {{ atHome }} {{ atMyDesign }} {{ routeInfo.atHome }}
</template>

<script setup lang="ts">
import useStateInfo from './composable/useStateInfo'

// #region route info
const stateInfo = useStateInfo()
const { showAspectRatioSelector, showHomeTabs, showEditingOpstions, atHome, atMyDesign } = stateInfo
// #endregion

const routeTransitionName = computed(() => {
  if (atHome.value) return 'fade-left-in'
  if (atMyDesign.value) return 'fade-right-in'
  return 'fade-right-in'
})
</script>

<style lang="scss">
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
</style>
