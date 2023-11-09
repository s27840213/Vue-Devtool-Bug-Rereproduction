<template lang="pug">
div(class="w-full flex items-center justify-center gap-64 pt-12 pb-28 box-border")
  div(class="flex flex-col gap-4 items-center justify-center")
    cm-svg-icon(
      :icon-name="'download'"
      :icon-color="'app-tab-default'"
      :icon-width="'24px'")
    span(class="text-app-tab-default typo-body-sm") {{ $t('STK0004') }}
  div(class="flex flex-col gap-4 items-center justify-center")
    cm-svg-icon(
      :icon-name="'grid-solid'"
      :icon-color="'app-tab-default'"
      :icon-width="'24px'")
    span(class="text-app-tab-default typo-body-sm") {{ $t('NN0214') }}
</template>
<script setup lang="ts"></script>
<style lang="scss"></style>
