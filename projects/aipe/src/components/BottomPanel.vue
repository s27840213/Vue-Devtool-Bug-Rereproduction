<template lang="pug">
div(class="bottom-panel" ref="bottomPanelRef")
  slot(:panelHeight="height")
</template>
<script setup lang="ts">
import { useElementSize } from '@vueuse/core'

const bottomPanelRef = ref<HTMLElement | null>(null)
const { height } = useElementSize(bottomPanelRef)
</script>
<style lang="scss">
.bottom-panel {
  @apply bg-app-tab-bg w-full rounded-t-[24px] py-24 box-border;
}
</style>
