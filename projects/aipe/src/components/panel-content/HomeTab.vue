<template lang="pug">
div(class="w-full h-full flex items-center justify-around")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/")
    nu-svg-icon(
      v-if="atHome"
      :icon-name="'home-solid'"
      :icon-color="'app-tab-active'"
      :icon-width="'24px'"
      @click="navigate")
    nu-svg-icon(
      v-else
      :icon-name="'home'"
      :icon-color="'app-tab-active'"
      :icon-width="'24px'"
      @click="navigate")
  router-link(
    custom
    v-slot="{ navigate }"
    to="/mydesign")
    nu-svg-icon(
      v-if="atMyDesign"
      :icon-name="'grid-solid'"
      :icon-color="'app-tab-active'"
      :icon-width="'24px'"
      @click="navigate")
    nu-svg-icon(
      v-else
      :icon-name="'grid'"
      :icon-color="'app-tab-active'"
      :icon-width="'24px'"
      @click="navigate")
</template>
<script setup lang="ts">
const route = useRoute()

const atHome = computed(() => {
  return route.path === '/'
})

const atMyDesign = computed(() => {
  return route.path === '/mydesign'
})
</script>
<style lang="scss"></style>
