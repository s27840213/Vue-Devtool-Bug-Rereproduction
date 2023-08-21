<template lang="pug">
div(class="w-full h-full grid grid-cols-1 grid-rows-[minmax(0,1fr),auto]")
  router-view(class="pb-12" v-slot="{ Component }")
    transition(
      name="fade-in"
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
const { showAspectRatioSelector, showHomeTabs, showEditingOpstions } = stateInfo
// #endregion
</script>

<style lang="scss">
.fade-in {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

.fade-down-up {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s,
      transform 0.25s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>
