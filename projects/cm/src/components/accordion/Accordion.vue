<template lang="pug">
transition(
  name="accordion"
  mode="out-in"
  @enter="(el) => transitionStart(el)"
  @after-enter="transitionEnd"
  @before-leave="(el) => transitionStart(el)"
  @after-leave="transitionEnd")
  slot(ref="accordionRef")
</template>

<script setup lang="ts">
const accordionRef = ref<HTMLElement | null>(null)

const transitionStart = (el: HTMLElement | Element, done?: (el: HTMLElement | Element) => void) => {
  requestAnimationFrame(() => {
    ;(el as HTMLElement).style.height = `${el.scrollHeight}px`
  })
}
const transitionEnd = (el: HTMLElement | Element, done?: () => void) => {
  ;(el as HTMLElement).style.height = ''
}
</script>

<style lang="scss">
.accordion-enter-active,
.accordion-leave-active {
  will-change: height, opacity;
  transition:
    height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  height: 0px !important;
  opacity: 0;
}
</style>
