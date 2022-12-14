<template lang="pug">
div(class="image-carousel")
  div(class="image-carousel__overflow")
    transition-group(tag="div" class="image-carousel__inner" leave-active-class="image-carousel__item--active")
      div(v-for="(url, idx) in range"
        :key="`${current}_${idx}_${url}`"
        class="image-carousel__item")
        slot(:url="url")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    speed: {
      type: Number,
      default: 1000
    },
    imgs: {
      type: Array,
      required: true
    }
  },
  emits: ['change'],
  data () {
    return {
      handler: 0,
      current: 0,
      range: this.imgs.slice(0, 2)
    }
  },
  mounted () {
    this.handler = setInterval(() => {
      this.handleNext()
    }, this.speed)
  },
  beforeUnmount () {
    clearInterval(this.handler)
    this.$emit('change', 0)
  },
  methods: {
    handleNext () {
      const { current, imgs } = this
      this.current = (current + 1) % imgs.length
      const extImages = imgs.concat(imgs.slice(0, 1))
      this.range = extImages.slice(this.current, this.current + 2)
      this.$emit('change', this.current)
    }
  }
})
</script>

<style lang="scss" scoped>
  .image-carousel {
    height: 100%;
    width: 100%;
    pointer-events: none;
    &__overflow {
      overflow: hidden;
    }
    &__inner {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    &__item {
      transition-duration: 600ms;
      transition-property: transform;
      transition-timing-function: cubic-bezier(.4,0,.2,1);
      transform: translateX(0);
      &--active {
        transform: translateX(-100%);
      }
    }
  }
</style>
