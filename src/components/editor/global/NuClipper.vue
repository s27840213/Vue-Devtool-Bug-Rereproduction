<template lang="pug">
  div(class="nu-clipper" :style="styles()" ref="body")
    slot
</template>

<script lang="ts">
import imageUtils from '@/utils/imageUtils'
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
      const { type } = this.config
      let { width, height, scale } = this.config.styles
      const layerPath = `path('M0,0h${width}v${height}h${-width}z`
      let clipPath = ''

      if (type === 'image') {
        if (this.config.isFrame) {
          clipPath = imageUtils.isImgControl() ? layerPath : `path('${this.config.clipPath}')`
        } else {
          clipPath = layerPath
        }
      }

      switch (type) {
        case 'shape':
          width = `${this.config.vSize[0] + this.config.pDiff[0]}px`
          height = `${this.config.vSize[1] + this.config.pDiff[1]}px`
          break
        default:
          width = `${width / scale}px`
          height = `${height / scale}px`
      }
      return {
        width,
        height,
        clipPath,
        'background-color': '#00000001'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  // position: relative;
  transform-style: preserve-3d;
  // overflow: hidden;
}
</style>
