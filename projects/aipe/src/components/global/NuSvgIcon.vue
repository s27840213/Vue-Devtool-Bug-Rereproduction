<template lang="pug">
svg-icon-test(
  :iconColor="iconColor"
  :iconName="iconName"
  :iconWidth="iconWidth"
  :iconHeight="iconHeight"
  :strokeColor="strokeColor")
</template>
<script setup lang="ts">
import type { ColorSlip } from '@/types/color'
// why create this extra component?
// just wanna add the ColorSlip type for this project
defineProps<{
  iconName?: string
  iconWidth?: string
  iconColor?: ColorSlip
  iconHeight?: string
  strokeColor?: ColorSlip
}>()

//
</script>
<style lang=""></style>
