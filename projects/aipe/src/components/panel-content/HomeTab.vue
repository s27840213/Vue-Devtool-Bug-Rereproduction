<template lang="pug">
div(class="w-full h-full flex items-center justify-around")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/")
    nu-svg-icon(
      :icon-name="'home-solid'"
      :icon-color="atHome ? 'app-tab-active' : 'transparent'"
      :icon-width="'32px'"
      :stroke-color="'app-tab-active'"
      @click="navigate")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/mydesign")
    nu-svg-icon(
      :icon-name="'grid-solid'"
      :icon-color="atMyDesign ? 'app-tab-active' : 'transparent'"
      :stroke-color="'app-tab-active'"
      :icon-width="'32px'"
      @click="navigate")
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'

const route = useRoute()
const { atHome, atMyDesign } = useStateInfo()
</script>
<style lang="scss"></style>
