<template lang="pug">
svg-icon-test(
  :icon-color="iconColor"
  :icon-name="iconName"
  :icon-width="iconWidth"
  :icon-height="iconHeight"
  :stroke-color="strokeColor"
  :same-size="sameSize")
</template>
<script setup lang="ts">
import type { ColorSlip } from '@/types/color'
withDefaults(
  defineProps<{
    iconName?: string
    iconWidth?: string
    iconColor?: ColorSlip
    iconHeight?: string
    strokeColor?: ColorSlip
    sameSize?: boolean
  }>(),
  {
    sameSize: true
  }
)
</script>
<style lang=""></style>
