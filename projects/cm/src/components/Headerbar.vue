<template lang="pug">
div(
  ref="headerbarRef"
  class="bg-dark-6 box-border pt-10 pb-8 grid grid-rows-1 grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)] min-h-56 w-full"
  :class="hide ? 'invisible pointer-events-none' : ''"
  :style="{ paddingTop: `${userInfo.statusBarHeight}px` }")
  div(
    v-if="$slots.left"
    class="flex justify-start items-center"
    :style="{ gap: `${leftGap}px` }")
    slot(name="left")
  div(
    class="flex justify-center items-center whitespace-nowrap typo-h5 text-app-text-secondary"
    :style="{ gap: `${middGap}px` }")
    slot(name="middle")
  div(
    v-if="$slots.right"
    class="flex justify-end items-center"
    :style="{ gap: `${rightGap}px` }")
    slot(name="right")
</template>
<script setup lang="ts">
import { useStore } from 'vuex'

withDefaults(
  defineProps<{
    hide?: boolean
    leftGap?: number
    middGap?: number
    rightGap?: number
  }>(),
  {
    hide: false,
    leftGap: 4,
    middGap: 4,
    rightGap: 4,
  },
)

const headerbarRef = ref(null)
defineExpose({ headerbarRef })

const store = useStore()
const userInfo = computed(() => store.getters['cmWV/getUserInfo'])
</script>
<style lang="scss"></style>
