<template lang="pug">
div(class="carousel" :style="{pointerEvents: enableSwipe ? 'auto' : 'none'}" v-touch @swipeleft="handleSwipe(false)" @swiperight="handleSwipe(true)")
  div(class="carousel__wrapper" ref="wrapper")
    div(v-for="(item, index) in itemsExtended" :key="index" class="carousel__item")
      slot(:item="item" :index="index") {{ item }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    items: {
      type: Array,
      required: true
    },
    itemWidth: {
      type: Number,
      required: true
    },
    initIndex: {
      type: Number,
      default: 1
    },
    speed: {
      type: Number,
      default: 3000
    },
    duration: {
      type: Number,
      default: 600
    },
    autoPlay: {
      type: Boolean,
      default: true
    },
    reverse: {
      type: Boolean,
      default: false
    },
    enableSwipe: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  data() {
    return {
      timerPlay: 0,
      current: this.initIndex + 1,
      isTransitioning: false
    }
  },
  mounted() {
    const elWrapper = this.$refs.wrapper as HTMLElement
    elWrapper.ontransitionstart = () => {
      this.isTransitioning = true
    }
    elWrapper.ontransitionend = () => {
      this.isTransitioning = false
      if (this.current < 1) this.moveTo(this.maxIndex - 1, false)
      if (this.current >= this.maxIndex) this.moveTo(1, false)
    }
    this.moveTo(this.current, false)
    this.$emit('change', this.current - 1)
    this.play()
  },
  beforeUnmount() {
    this.stop()
    this.$emit('change', 0)
  },
  watch: {
    itemWidth() {
      this.stop()
      this.moveTo(this.current, false)
      this.play()
    }
  },
  computed: {
    offset() {
      return -this.current * this.itemWidth
    },
    maxIndex() {
      return this.itemsExtended.length - 1
    },
    itemsExtended() {
      const { items } = this
      return [items[items.length - 1], ...items, items[0]]
    }
  },
  methods: {
    play() {
      if (!this.autoPlay) return
      this.timerPlay = window.setInterval(() => {
        if (this.reverse) this.prev()
        else this.next()
      }, this.speed)
    },
    stop() {
      window.clearInterval(this.timerPlay)
    },
    prev() {
      this.current -= 1
      this.$emit('change', this.current < 1 ? this.maxIndex - 2 : this.current - 1)
    },
    next() {
      this.current += 1
      this.$emit('change', this.current >= this.maxIndex ? 0 : this.current - 1)
    },
    moveTo(target: number, transition = true) {
      const elWrapper = this.$refs.wrapper as HTMLElement
      if (!elWrapper) return
      if (!transition) elWrapper.style.transition = 'none'
      this.current = target
      elWrapper.style.transform = `translateX(${this.offset}px)`
      const a = elWrapper.offsetHeight // flush css

      // restore css
      elWrapper.style.transform = ''
      elWrapper.style.transition = ''
    },
    handleSwipe(reverse: boolean) {
      if (!this.enableSwipe || this.isTransitioning) return
      this.stop()
      if (reverse) this.prev()
      else this.next()
      this.play()
    }
  }
})
</script>

<style lang="scss" scoped>
  .carousel {
    position: relative;
    width: v-bind("itemWidth+'px'");
    &__wrapper {
      width: v-bind("`${itemWidth*items.length}px`");
      display: flex;
      transform: v-bind("`translateX(${offset}px)`");
      transition: v-bind("`transform ${duration}ms cubic-bezier(.4,0,.2,1)`");
    }
    &__item {
      position: relative;
      width: v-bind("itemWidth+'px'");
    }
  }
</style>
