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
      const { type } = this.config
      let { width, height, initWidth, initHeight, scale } = this.config.styles
      // const clipPath = (type === 'image' && this.config.clipPath) ? `path('M0 0 L0 ${height} ${width} ${height} ${width} 0Z')` : 'none'
      const clipPath = type === 'image'
        ? (this.config.isFrame ? `path('${this.config.clipPath}')` : `path('M0,0h${width}v${height}h${-width}z`) : ''
      switch (type) {
        case 'shape':
          // width = `${initWidth}px`
          // height = `${initHeight}px`
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
        // transform: 'translate3d(0, 0, 0)',
        clipPath,
        // 'clip-path': this.config.clipPath
        //   ? (this.config.clipPath as string).includes('path')
        //     ?  : "path('" + this.config.clipPath + "')" : '',
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
