<template lang="pug">
div(class="nu-clipper layer-flip" ref="body"
  :style="styles"
  :id="config.type === 'frame' ? `nu-clipper-${layerIndex}` : ''")
  slot
</template>

<script lang="ts">
import { IFrame, IGroup, ITmp } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import cssConverter from '@/utils/cssConverter'
import frameUtils from '@/utils/frameUtils'
import pageUtils from '@/utils/pageUtils'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    layerIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number
    },
    primaryLayer: {
      type: Object as PropType<IGroup | IFrame | ITmp>,
      default: undefined
    },
    imgControl: {
      type: Boolean,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapState('shadow', ['processId', 'handleId']),
    ...mapState(['currDraggedPhoto']),
    ...mapGetters({
      isShowPagePanel: 'page/getShowPagePanel',
      isHandleShadow: 'shadow/isHandling'
    }),
    shapeWidth(): number {
      return (this.config.vSize?.[0] ?? 0) + (this.config.pDiff?.[0])
    },
    shapeHeight(): number {
      return (this.config.vSize?.[1] ?? 0) + (this.config.pDiff?.[1])
    },
    styles(): any {
      const { type } = this.config
      const { horizontalFlip, verticalFlip } = this.config.styles
      const flip = type === 'image' ? {} : cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
      let { width, height, scale } = this.config.styles
      switch (type) {
        case 'image':
          if (!this.config.isImageFrame && this.primaryLayer && (this.primaryLayer as IFrame).type === LayerType.frame) {
            width = `${width * this.contentScaleRatio}px`
            height = `${height * this.contentScaleRatio}px`
          } else {
            width = `${width * this.contentScaleRatio}px`
            height = `${height * this.contentScaleRatio}px`
          }
          break
        case 'shape':
          width = `${this.shapeWidth}px`
          height = `${this.shapeHeight}px`
          break
        case 'frame':
          if (frameUtils.isImageFrame(this.config as IFrame)) {
            width = `${width * this.contentScaleRatio}px`
            height = `${height * this.contentScaleRatio}px`
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
        ...flip,
        'transform-style': pageUtils._3dEnabledPageIndex === this.pageIndex ? 'preserve-3d' : 'initial'
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-clipper {
  // overflow: hidden;
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
