<template lang="pug">
div(class="w-full flex justify-between items-center box-border py-10" :class="{ 'bg-dark': active }")
  div(class="flex items-center gap-10" :class="`${textColor} ${textSize}`")
    svg-icon(
      :iconName="iconName"
      iconWidth="24px"
      iconColor="yellow-cm")
    span {{ title }}
  svg-icon(
    :iconName="'chevron-right'"
    iconWidth="24px"
    iconColor="white")
</template>

<script lang="ts" setup>
import type { IColorKeys } from '@nu/vivi-lib/interfaces/color'

withDefaults(
  defineProps<{
    title: string
    textColor?: IColorKeys
    textSize?: string
    iconName?: string
    active?: boolean
  }>(),
  {
    title: 'Test',
    textColor: 'yellow-0',
    textSize: 'typo-h5',
    iconName: 'chevron-right',
    active: false,
  },
)
</script>

<style lang="scss" scoped></style>
