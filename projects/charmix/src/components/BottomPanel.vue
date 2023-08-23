<template lang="pug">
div(class="bottom-panel" ref="bottomPanelRef")
  slot
</template>
<script setup lang="ts">
const bottomPanelRef = ref<HTMLElement | null>(null)
</script>
<style lang="scss">
.bottom-panel {
  @apply bg-app-tab-bg w-full rounded-t-[24px] py-24 box-border;
}
</style>
