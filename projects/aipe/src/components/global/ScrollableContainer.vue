<template lang="pug">
div(class="overflow-auto grid scrollbar-hide" :style="containerStyles")
  slot
</template>
<script setup lang="ts">
/**
 * This is a container that can be used to wrap a scrollable content.
 * Usually we used this in FooterTabs, once we have too much tabs, it could be scrollable.
 */
const { direction, gap, px, py } = withDefaults(
  defineProps<{
    direction?: 'hr' | 'vr'
    gap?: number
    px?: number
    py?: number
  }>(),
  {
    direction: 'hr',
    gap: 12,
    px: 8,
    py: 12
  }
)

const containerStyles = computed(() => {
  return {
    gridAutoFlow: direction === 'hr' ? 'column' : 'row',
    columnGap: `${gap}px`,
    padding: `${py}px ${px}px`
  }
})
</script>
<style lang="scss"></style>
