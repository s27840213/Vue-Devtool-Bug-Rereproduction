<template lang="pug">
div(class="w-full h-full")
  router-view(:style="viewStyles")
//- div(class="absolute text-app-icon-light top-4 left-0") {{ width }} {{ height }}
bottom-panel(v-if="atHome || atMyDesign")
  home-tab
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'

const bottomPanelRef = ref<HTMLElement | null>(null)
const { height } = useElementSize(bottomPanelRef)
const viewStyles = computed(() => {
  return {
    // 32 is the padding height of the bottom panel
    paddingBottom: `${height.value + 32 + 24}px`
  }
})

// #region route info
const route = useRoute()
const atHome = computed(() => {
  return route.path === '/'
})
const atMyDesign = computed(() => {
  return route.path === '/mydesign'
})
// #endregion
</script>

<style></style>
