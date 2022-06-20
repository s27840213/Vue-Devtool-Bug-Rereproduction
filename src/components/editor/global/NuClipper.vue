<template lang="pug">
  div(class="nu-clipper layer-flip" :style="styles()" ref="body"
    :id="config.type === 'frame' ? `nu-clipper-${layerIndex}` : ''")
    slot
</template>

<script lang="ts">
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { LayerType } from '@/store/types'
import cssConverter from '@/utils/cssConverter'
import frameUtils from '@/utils/frameUtils'
import Vue from 'vue'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    imgControl: Boolean
  },
  data() {
    return {
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
  methods: {
    styles() {
      const { type, imgControl } = this.config
      const { horizontalFlip, verticalFlip } = this.config.styles
      const flip = type === 'image' ? {} : cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
      let { width, height, scale } = this.config.styles
      const layerPath = `path('M0,0h${width}v${height}h${-width}z`
      let clipPath = ''

      switch (type) {
        case 'image':
          if (this.config.isFrame) {
            clipPath = imgControl || !this.config.clipPath ? layerPath : `path('${this.config.clipPath}')`
          } else {
            // clipPath = layerPath
          }
          width = `${width}px`
          height = `${height}px`
          break
        case 'shape':
          width = `${this.shapeWidth}px`
          height = `${this.shapeHeight}px`
          break
        case 'frame':
          if (frameUtils.isImageFrame(this.config)) {
            width = `${width}px`
            height = `${height}px`
          } else {
            width = `${width / scale}px`
            height = `${height / scale}px`
          }
          break
        default:
          width = `${width / scale}px`
          height = `${height / scale}px`
      }
      return {
        width,
        height,
        ...(!this.imgControl && this.config.type === 'image' && this.config.styles.shadow.currentEffect === ShadowEffectType.none && { clipPath }),
        ...flip
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  transform-style: preserve-3d;
  // overflow: hidden;
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
