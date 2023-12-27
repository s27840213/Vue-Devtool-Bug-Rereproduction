<template lang="pug">
div(class="compare-image w-full h-full overflow-hidden")
  img(
    :src="srcB"
    class="w-full h-full object-cover object-center absolute top-0 left-0"
    :style="{ animation: 'zoom 3s ease-in-out both infinite' }")
  img(
    :src="srcA"
    class="w-full h-full object-cover object-center absolute top-0 left-0"
    :style="{ animation: 'clip-path-scan-x 3s ease-in-out both infinite' }")
  div(
    class="w-6 h-full absolute top-0"
    :class="`bg-${colorSplitter}`"
    :style="{ animation: 'move-scan-x 3s ease-in-out both infinite' }")
</template>

<script setup lang="ts">
type Props = {
  srcA: string
  srcB: string
  colorSplitter?: string
}

withDefaults(defineProps<Props>(), {
  colorSplitter: 'yellow-cm',
})
</script>

<style lang="scss">
@keyframes zoom {
  0%,
  25% {
    transform: scale(1.2);
  }
  50%,
  75% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.2);
  }
}

@keyframes clip-path-scan-x {
  0%,
  25% {
    clip-path: inset(0 0 0 0);
  }
  50%,
  75% {
    clip-path: inset(0 0 0 100%);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes move-scan-x {
  0%,
  25% {
    left: 0;
  }
  50%,
  75% {
    left: calc(100% - 6px);
  }
  100% {
    left: 0;
  }
}
</style>
