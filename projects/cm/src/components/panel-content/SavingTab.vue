<template lang="pug">
div(class="w-full flex items-center justify-center gap-64 py-12 box-border")
  div(class="flex flex-col gap-4 items-center justify-center" @click="save")
    cm-svg-icon(
      :icon-name="'download'"
      :icon-color="'app-tab-default'"
      :icon-width="'24px'")
    span(class="text-app-tab-default typo-body-sm") {{ $t('STK0004') }}
  div(class="flex flex-col gap-4 items-center justify-center")
    cm-svg-icon(
      :icon-name="'share'"
      :icon-color="'app-tab-default'"
      :icon-width="'24px'")
    span(class="text-app-tab-default typo-body-sm") {{ $t('NN0214') }}
</template>
<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm'

const { setSavingActions, toggleActionSheet } = useActionSheetCm()
const save = () => {
  setSavingActions()
  toggleActionSheet()
}
</script>
<style lang="scss"></style>
