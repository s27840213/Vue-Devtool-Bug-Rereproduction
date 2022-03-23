<template lang="pug">
  div(class="nu-clipper layer-flip" :style="styles()" ref="body"
  :id="config.type === 'frame' ? `nu-clipper-${layerIndex}` : ''")
    slot
</template>

<script lang="ts">
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { LayerType } from '@/store/types'
import cssConverter from '@/utils/cssConverter'
import imageUtils from '@/utils/imageUtils'
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

      if (type === 'image') {
        if (this.config.isFrame) {
          clipPath = imgControl || !this.config.clipPath ? layerPath : `path('${this.config.clipPath}')`
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
        // ...(!this.imgControl && { clipPath }),
        ...(!this.imgControl && !(this.config.type === 'image' && [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur]
          .includes(this.config.styles.shadow.currentEffect)) && { clipPath }),
        ...flip
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  transform-style: preserve-3d;
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
