<template lang="pug">
div(class="w-full flex items-center justify-center gap-64 py-12 box-border")
  div(class="flex flex-col gap-4 items-center justify-center" @click="save")
    svg-icon(
      :iconName="'download'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('STK0004') }}
  div(class="flex flex-col gap-4 items-center justify-center")
    svg-icon(
      :iconName="'share'"
      :iconColor="'yellow-0'"
      :iconWidth="'24px'")
    span(class="text-yellow-0 typo-body-sm") {{ $t('NN0214') }}
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
