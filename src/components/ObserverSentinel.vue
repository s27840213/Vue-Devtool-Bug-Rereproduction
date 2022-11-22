<template lang="pug">
  div(class="observer-sentinel"
    ref="sentinel")
    slot
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { throttle, some } from 'lodash'

export default defineComponent({
  props: {
    target: {
      type: String,
      default: 'body'
    },
    rootMargin: {
      type: String,
      default: '0px'
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
      rootMargin: this.rootMargin
    }
    this.intersectionObserver = new IntersectionObserver(
      // If element is created when it is intersecting,
      // there will be two entries in var `entries`.
      // So if any of entry is true, call callback.
      (entries) => {
        if (some(entries, ['isIntersecting', true])) this.handleCallback()
      }, options
    )
    this.intersectionObserver.observe(this.$refs.sentinel as Element)
  },
  methods: {
    handleCallback: throttle(function (this: any) {
      this.$emit('callback')
    }, 500)
  },
  unmounted() {
    this.intersectionObserver && this.intersectionObserver.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.observer-sentinel {
  text-align: center;
}
</style>
