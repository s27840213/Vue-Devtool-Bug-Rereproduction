<template lang="pug">
div(class="action-sheet" ref="actionSheetRef")
  div(class="bg-dark-3 flex flex-col rounded-10")
    div(
      v-for="(action, index) in primaryActions"
      :key="index"
      class="flex-center flex-col p-16 box-border border-style gap-8"
      :class="{ 'pointer-events-none': action.clickable === false }"
      @click="action.cb")
      span(
        v-for="(label, index) in action.labels"
        :key="index"
        :class="`text-${label.labelColor} ${label.labelSize}`") {{ label.label }}
  div(class="bg-dark-3 flex flex-col rounded-10")
    div(
      v-for="(action, index) in secondaryActions"
      :key="index"
      class="flex-center flex-col p-16 box-border"
      :class="{ 'pointer-events-none': action.clickable === false }"
      @click="action.cb")
      span(
        v-for="(label, index) in action.labels"
        :key="index"
        :class="`text-${label.labelColor} ${label.labelSize}`") {{ label.label }}
</template>
<script setup lang="ts">
import useActionSheetCm from '@/composable/useActionSheetCm'
import type { IActionSheetBtn } from '@/stores/actionSheet'
import { onClickOutside } from '@vueuse/core'
const props = defineProps<{
  primaryActions: Array<IActionSheetBtn>
  secondaryActions: Array<IActionSheetBtn>
}>()

const { toggleActionSheet } = useActionSheetCm()

const actionSheetRef = ref<HTMLElement | null>(null)
onClickOutside(actionSheetRef, () => toggleActionSheet())
</script>
<style lang="scss" scoped>
.action-sheet {
  @apply w-full flex flex-col gap-20 overflow-hidden box-border;
  // border: 1px solid red;
  // border-radius: 8px;;;
}

.border-style {
  @apply border-b-lighter/50 border-solid border-0 border-b-.5;
  @apply last:border-b-0;
}
</style>
