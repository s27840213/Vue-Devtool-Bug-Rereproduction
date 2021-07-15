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
      const HW = { width: 0, height: 0 }
      if (this.config.type === 'image' || this.config.type === 'text') {
        /**
         * Divided by the scale for synchronizing the scale applied at layer-scale
         */
        HW.width = this.config.styles.width / this.config.styles.scale
        HW.height = this.config.styles.height / this.config.styles.scale
      } else {
        HW.width = this.config.styles.initWidth
        HW.height = this.config.styles.initHeight
      }
      return {
        width: `${HW.width}px`,
        height: `${HW.height}px`,
        position: 'absolute',
        // transform: 'translate3d(-50%, -50%,0)',
        transform: 'translate3d(0, 0, 0)',
        'clip-path': this.config.clipPath,
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
