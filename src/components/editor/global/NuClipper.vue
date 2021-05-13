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
  computed: {
    isClipped(): boolean {
      return !(this.config.styles.initWidth === this.config.styles.width && this.config.styles.initHeight === this.config.styles.height)
    }
  },
  methods: {
    styles() {
      const HW = { width: 0, height: 0 }
      if (this.config.type === 'image' && this.isClipped) {
        // Divided by the scale for prevents scaling changes the clipper's size
        HW.width = this.config.styles.width / this.config.styles.scale
        HW.height = this.config.styles.height / this.config.styles.scale
      } else {
        HW.width = this.config.styles.initWidth
        HW.height = this.config.styles.initHeight
      }
      return {
        width: `${HW.width}px`,
        height: `${HW.height}px`,
        'clip-path': this.config.clipPath
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  // overflow: hidden;
}
</style>
