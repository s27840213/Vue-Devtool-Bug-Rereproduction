<template lang="pug">
  div(class="observer-sentinel"
    ref="sentinel")
    slot
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { throttle, some } from 'lodash'

export default Vue.extend({
  props: {
    target: {
      type: String,
      default: 'body'
    },
    rootMargin: {
      type: String,
      default: '0px'
    },
    threshold: {
      type: Array as PropType<number[]>,
      default: () => [1]
    },
    throttle: {
      type: Boolean,
      default: true
    },
    handleNotIntersecting: {
      type: Boolean,
      default: false
    }
  },
  data(): { intersectionObserver: IntersectionObserver | null } {
    return {
      intersectionObserver: null
    }
  },
  mounted() {
    const options = {
      root: document.querySelector(this.target),
      rootMargin: this.rootMargin,
      threshold: this.threshold
    }
    this.intersectionObserver = new IntersectionObserver(
      // If element is created when it is intersecting,
      // there will be two entries in var `entries`.
      // So if any of entry is true, call callback.
      (entries) => {
        if (some(entries, ['isIntersecting', true])) {
          this.throttle ? this.handleThrottleCallback(entries) : this.handleCallback(entries)
        }

        if (this.handleNotIntersecting) {
          this.handleCallback(entries)
        }
      }, options
    )
    this.intersectionObserver.observe(this.$refs.sentinel as Element)
  },
  methods: {
    handleThrottleCallback: throttle(function (this: any) {
      this.$emit('callback')
    }, 500),
    handleCallback(entries: Array<IntersectionObserverEntry>) {
      this.$emit('callback', entries)
    }
  },
  destroyed() {
    this.intersectionObserver && this.intersectionObserver.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.observer-sentinel {
  text-align: center;
}
</style>
