<template lang="pug">
div(class="w-full flex items-center justify-around")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/")
    svg-icon(
      :iconName="'home-solid'"
      :iconColor="atHome ? 'app-tab-active' : 'transparent'"
      :iconWidth="'32px'"
      :strokeColor="'app-tab-active'"
      @click="navigate")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/mydesign")
    svg-icon(
      :iconName="'grid-solid'"
      :iconColor="atMyDesign ? 'app-tab-active' : 'transparent'"
      :strokeColor="'app-tab-active'"
      :iconWidth="'32px'"
      @click="navigate")
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'

const route = useRoute()
const { atHome, atMyDesign } = useStateInfo()
</script>
<style lang="scss"></style>
