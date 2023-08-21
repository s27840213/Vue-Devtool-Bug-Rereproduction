<template lang="pug">
div(class="bg-app-tab-bg w-full rounded-t-[24px] py-16 box-border fixed bottom-0 left-0" ref="bottomPanelRef")
  slot(:panelHeight="height")
</template>
<script setup lang="ts">
import { useElementSize } from '@vueuse/core'

const bottomPanelRef = ref<HTMLElement | null>(null)
const { height } = useElementSize(bottomPanelRef)
</script>
<style lang="scss"></style>
