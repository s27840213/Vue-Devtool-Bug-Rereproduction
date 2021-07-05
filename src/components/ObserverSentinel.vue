<template lang="pug">
  div(class="observer-sentinel"
    ref="sentinel")
    slot
</template>

<script lang="ts">
import Vue from 'vue'
import { throttle } from 'lodash'

export default Vue.extend({
  props: {
    target: {
      type: String,
      default: 'body'
    },
    rootMargin: {
      type: String,
      default: '0px 0px 150px'
    }
  },
  data (): { intersectionObserver: IntersectionObserver | null } {
    return {
      intersectionObserver: null
    }
  },
  mounted () {
    this.intersectionObserver = new IntersectionObserver(
      ([evt]) => evt.isIntersecting && this.handleCallback(),
      {
        root: document.querySelector(this.target),
        rootMargin: this.rootMargin
      }
    )
    this.intersectionObserver.observe(this.$refs.sentinel as Element)
  },
  methods: {
    handleCallback: throttle(function (this: any) {
      this.$emit('callback')
    }, 500)
  },
  destroyed () {
    this.intersectionObserver && this.intersectionObserver.disconnect()
  }
})
</script>

<style lang="scss" scoped>
  .observer-sentinel {
    text-align: center;
  }
</style>
