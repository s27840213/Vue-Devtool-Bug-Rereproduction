<template lang="pug">
  div(class="flip-to-square-random"
      :style="styles")
    div
    div
    div
    div
    div
    div
    div
    div
    div
</template>

<script lang="ts">

import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    size: {
      type: Number,
      default: 120
    }
  },
  computed: {
    styles(): { width: string, height: string } {
      return {
        width: `${this.size}px`,
        height: `${this.size}px`
      }
    }
  }
})
</script>

<style lang="scss" scoped>
@-webkit-keyframes flip-to-square-random {
  0% {
    -webkit-transform: rotateX(-90deg);
    transform: rotateX(-90deg);
  }
  50%,
  75% {
    -webkit-transform: rotateX(0);
    transform: rotateX(0);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateX(0);
    transform: rotateX(0);
  }
}
@keyframes flip-to-square-random {
  0% {
    -webkit-transform: rotateX(-90deg);
    transform: rotateX(-90deg);
  }
  50%,
  75% {
    -webkit-transform: rotateX(0);
    transform: rotateX(0);
  }
  100% {
    opacity: 0;
    -webkit-transform: rotateX(0);
    transform: rotateX(0);
  }
}

.flip-to-square-random {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}
.flip-to-square-random div {
  -webkit-animation: flip-to-square-random 1.5s calc(var(--delay) * 1s) infinite
    backwards;
  animation: flip-to-square-random 1.5s calc(var(--delay) * 1s) infinite
    backwards;
  background-color: setColor(gray-5);
}
.flip-to-square-random div:nth-child(1) {
  --delay: 0.1;
}
.flip-to-square-random div:nth-child(2) {
  --delay: 0.02;
}
.flip-to-square-random div:nth-child(3) {
  --delay: 0.12;
}
.flip-to-square-random div:nth-child(4) {
  --delay: 0.02;
}
.flip-to-square-random div:nth-child(5) {
  --delay: 0.02;
}
.flip-to-square-random div:nth-child(6) {
  --delay: 0.12;
}
.flip-to-square-random div:nth-child(7) {
  --delay: 0.18;
}
.flip-to-square-random div:nth-child(8) {
  --delay: 0.16;
}
.flip-to-square-random div:nth-child(9) {
  --delay: 0.14;
}
</style>
