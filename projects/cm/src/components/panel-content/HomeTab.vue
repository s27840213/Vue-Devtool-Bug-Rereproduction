<template lang="pug">
div(class="w-full flex-around-center")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/")
    svg-icon(
      :iconName="'home-solid'"
      :iconColor="atHome ? 'yellow-cm' : 'transparent'"
      :iconWidth="'32px'"
      :strokeColor="'yellow-cm'"
      @click="navigate")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/mydesign")
    svg-icon(
      :iconName="'grid-solid'"
      :iconColor="atMyDesign ? 'yellow-cm' : 'transparent'"
      :strokeColor="'yellow-cm'"
      :iconWidth="'32px'"
      @click="navigate")
</template>
<script setup lang="ts">
import useStateInfo from '@/composable/useStateInfo'

const route = useRoute()
const { atHome, atMyDesign } = useStateInfo()
</script>
<style lang="scss"></style>
