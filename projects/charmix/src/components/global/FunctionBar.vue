<template lang="pug">
div(class="w-full flex justify-between items-center py-10" :class="{ 'bg-app-icon-dark': active }")
  div(class="flex items-center gap-10" :class="`${textColor} ${textSize}`")
    cm-svg-icon(
      :iconName="iconName"
      iconWidth="24px"
      iconColor="app-btn-primary-bg")
    span {{ title }}
  cm-svg-icon(
    :iconName="'chevron-right'"
    iconWidth="24px"
    iconColor="app-btn-primary-text")
</template>

<script lang="ts" setup>
import type { ColorSlip } from '@/types/color'

withDefaults(
  defineProps<{
    title: string
    textColor?: ColorSlip
    textSize?: string
    iconName?: string
    active?: boolean
  }>(),
  {
    title: 'Test',
    textColor: 'app-tab-default',
    textSize: 'typo-h5',
    iconName: 'chevron-right',
    active: false,
  },
)
</script>

<style lang="scss" scoped></style>
