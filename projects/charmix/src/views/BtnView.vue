<template lang="pug">
div(
  class="flex"
  v-for="theme in nubtnThemesArray"
  :key="theme")
  div(class="flex items-center justify-evenly")
    div(
      v-for="size in sizeMap[theme]"
      :key="size")
      span {{ `${theme}${size ? `-${size}` : size}` }}
      nu-btn(
        :theme="theme"
        :size="size"
        :hasIcon="hasIconThemes.includes(theme)"
        :iconName="'close-btn'") Button
      nu-btn(
        :theme="theme"
        :size="size"
        :active="true"
        :hasIcon="hasIconThemes.includes(theme)"
        :iconName="'close-btn'") Button
      nu-btn(
        :theme="theme"
        :size="size"
        :disabled="true"
        :hasIcon="hasIconThemes.includes(theme)"
        :iconName="'close-btn'") Button
</template>
<script setup lang="ts">
import type { INubtnSize, INubtnThemes } from '@/types/btn'

const nubtnThemesArray: INubtnThemes[] = ['primary', 'secondary', 'icon_light', 'icon_dark', 'text']
const nubtnSizes: INubtnSize[] = ['', 'md', 'sm']
const hasIconThemes = ['icon_light', 'icon_dark']
const sizeMap: { [key in INubtnThemes]: Array<INubtnSize> } = {
  primary: ['', 'md'],
  secondary: ['', 'md'],
  icon_light: [''],
  icon_dark: [''],
  text: ['sm']
}
</script>
<style scoped lang="scss">
.btn__powerful-fill {
  background: linear-gradient(100.37deg, #ffd004 0.75%, #fff2a7 52.64%, #ffffff 105.53%);
}
</style>
