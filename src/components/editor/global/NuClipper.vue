<template lang="pug">
  div(class="nu-clipper layer-flip" :style="styles()" ref="body")
    slot
</template>

<script lang="ts">
import cssConverter from '@/utils/cssConverter'
import imageUtils from '@/utils/imageUtils'
import Vue from 'vue'

export default Vue.extend({
  mounted() {
    // this.shapeWidth = this.config.vSize?.[0] ?? 0 + this.config.pDiff?.[0] ?? 0
    // this.shapeHeight = this.config.vSize?.[1] ?? 0 + this.config.pDiff?.[1] ?? 0
    // console.log(this.config.vSize?.[1])
    // console.log(this.config.pDiff?.[1])
  },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number
  },
  data() {
    return {
      // shapeWidth: 0,
      // shapeHeight: 0
    }
  },
  computed: {
    shapeWidth(): number {
      return (this.config.vSize?.[0] ?? 0) + (this.config.pDiff?.[0])
    },
    shapeHeight(): number {
      return (this.config.vSize?.[1] ?? 0) + (this.config.pDiff?.[1])
    }
  },
  watch: {
    // 'config.pDiff': {
    //   handler: function (newVal) {
    //     if (this.config.type === 'shape' && newVal && newVal.length > 1) {
    //       console.warn('pdiff')
    //       this.shapeWidth = this.config.vSize?.[0] ?? 0 + newVal[0]
    //       this.shapeHeight = this.config.vSize?.[1] ?? 0 + newVal[1]
    //     }
    //   },
    //   deep: true
    // },
    // 'config.vSize': {
    //   handler: function (newVal) {
    //     if (this.config.type === 'shape' && newVal && newVal.length > 1) {
    //       this.shapeWidth = newVal[0] + this.config.pDiff?.[0] ?? 0
    //       this.shapeHeight = newVal[1] + this.config.pDiff?.[1] ?? 0
    //     }
    //     console.warn('vsize')
    //     console.log(newVal[1])
    //     console.log(this.config.pDiff?.[1])
    //     console.warn(this.shapeHeight)
    //   },
    //   deep: true
    // }
  },
  methods: {
    styles() {
      const { type } = this.config
      const { horizontalFlip, verticalFlip } = this.config.styles
      const flip = type === 'image' ? {} : cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
      let { width, height, scale } = this.config.styles
      const layerPath = `path('M0,0h${width}v${height}h${-width}z`
      let clipPath = ''

      if (type === 'image') {
        if (this.config.isFrame) {
          clipPath = imageUtils.isImgControl() || !this.config.clipPath ? layerPath : `path('${this.config.clipPath}')`
        } else {
          clipPath = layerPath
        }
      }
      switch (type) {
        case 'shape':
          width = `${this.shapeWidth}px`
          height = `${this.shapeHeight}px`
          break
        default:
          width = `${width / scale}px`
          height = `${height / scale}px`
      }
      return {
        width,
        height,
        clipPath,
        'background-color': '#00000001',
        ...flip
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

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
