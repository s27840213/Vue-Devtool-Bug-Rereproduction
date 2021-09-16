<template lang="pug">
  div(class="nu-clipper" :style="styles()" ref="body")
    slot
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data() {
    return {
    }
  },
  props: {
    config: Object,
    pageIndex: Number
  },
  methods: {
    styles() {
      let width, height
      switch (this.config.type) {
        case 'shape':
          width = `${this.config.styles.initWidth}px`
          height = `${this.config.styles.initHeight}px`
          break
        default:
          width = `${this.config.styles.width / this.config.styles.scale}px`
          height = `${this.config.styles.height / this.config.styles.scale}px`
      }
      return {
        width,
        height,
        transform: 'translate3d(0, 0, 0)',
        'clip-path': this.config.clipPath
          ? (this.config.clipPath as string).includes('path')
            ? this.config.clipPath : "path('" + this.config.clipPath + "')" : '',
        'background-color': '#00000001'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  transform-style: preserve-3d;
}
</style>
