<template lang="pug">
div(v-if="$slots.left"
    ref="headerbarRef"
    class="bg-app-bg box-border pt-10 pb-8 grid grid-rows-1 grid-flow-col auto-cols-fr min-h-[56px] w-full"
    :class="hide ? 'invisible pointer-events-none' : ''")
  div(class="flex justify-start items-center"
    :style="{gap: `${leftGap}px`}")
    slot(name="left")
  div(v-if="$slots.middle" class="flex justify-center items-center"
    :style="{gap: `${middGap}px`}")
    slot(name="middle")
  div(v-if="$slots.right" class="flex justify-end items-center"
    :style="{gap: `${rightGap}px`}")
    slot(name="right")
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    hide?: boolean,
    leftGap?: number,
    middGap?: number,
    rightGap?: number,
  }>(),
  {
    hide: false,
    leftGap: 4,
    middGap: 4,
    rightGap: 4,
  }
)

const headerbarRef = ref(null)
defineExpose({ headerbarRef })
</script>
<style lang="scss"></style>
