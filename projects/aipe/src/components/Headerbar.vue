<template lang="pug">
div(class="bg-app-bg px-24 py-8 border-b-2 border-primary-white flex justify-between items-center")
  div
    router-link(
      custom
      v-slot="{ navigate }"
      to="/")
      nu-svg-icon(
        icon-color="app-icon-light"
        icon-name="arrow-left"
        icon-width="24px"
        @click="navigate")
  div
  div
    nu-btn(
      theme="primary"
      size="md") {{ $t('NN0012') }}
</template>
<script setup lang="ts"></script>
<style lang="scss"></style>
