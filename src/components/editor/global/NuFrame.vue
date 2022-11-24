<template lang="pug">
div(class="nu-frame"
    :style="styles()")
  div(v-if="shadowSrc()" class="shadow__wrapper" :style="shadowWrapperStyles")
    img(class="shadow__img"
      draggable="false"
      :src="shadowSrc()")
  nu-layer(v-for="(layer,index) in layers"
    :key="`layer-${index}`"
    :pageIndex="pageIndex"
    :layerIndex="layerIndex"
    :isFrame="true"
    :inImageFrame="inImageFrame()"
    :subLayerIndex="Math.max(index - layerIdxOffset, 0)"
    :contentScaleRatio="contentScaleRatio"
    :primaryLayer="config"
    :config="layer"
    :isSubLayer="true")
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IListServiceContentDataItem } from '@/interfaces/api'
import { IFrame, IImage, IShape } from '@/interfaces/layer'
import AssetUtils from '@/utils/assetUtils'
import ImageUtils from '@/utils/imageUtils'
import { mapGetters } from 'vuex'
import layerFactary from '@/utils/layerFactary'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  inheritAttrs: false,
  props: {
    config: {
      type: Object as PropType<IFrame>,
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
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  async created() {
    if (this.config.needFetch && this.config.designId) {
      const config = this.config as IFrame
      const asset = {
        type: 8,
        id: config.designId,
        ver: this.getVerUni
      } as IListServiceContentDataItem

      const json = (await AssetUtils.get(asset)).jsonData as IFrame

      // eslint-disable-next-line vue/no-mutating-props
      this.config.styles.initWidth = json.width as number
      // eslint-disable-next-line vue/no-mutating-props
      this.config.styles.initHeight = json.height as number

      config.clips.forEach((img, idx) => {
        if (json.clips[idx]) {
          img.clipPath = json.clips[idx].clipPath
        }
      })
      if (config.decoration && json.decoration) {
        json.decoration.color = [...config.decoration.color]
        Object.assign(config.decoration, json.decoration)
      }
      if (config.decorationTop && json.decorationTop) {
        json.decorationTop.color = [...config.decorationTop.color]
        Object.assign(config.decorationTop, json.decorationTop)
      }
      config.needFetch = false
    }
  },
  watch: {
    'config.needFetch': function (newVal) {
      if (newVal && this.config.designId) {
        const asset = {
          type: 8,
          id: this.config.designId,
          ver: this.getVerUni
        } as IListServiceContentDataItem
        AssetUtils.get(asset).then((res) => {
          const json = res.jsonData as IFrame
          // eslint-disable-next-line vue/no-mutating-props
          this.config.clips = generalUtils.deepCopy(this.config.clips)
          if (this.config.decoration && json.decoration) {
            json.decoration.color = [...this.config.decoration.color] as [string]
            // eslint-disable-next-line vue/no-mutating-props
            this.config.decoration = layerFactary.newShape({
              ...json.decoration,
              vSize: [this.config.styles.initWidth, this.config.styles.initHeight],
              styles: {
                width: this.config.styles.initWidth,
                height: this.config.styles.initHeight,
                initWidth: this.config.styles.initWidth,
                initHeight: this.config.styles.initHeight
              }
            })
          }
          if (this.config.decorationTop && json.decorationTop) {
            json.decorationTop.color = [...this.config.decorationTop.color] as [string]
            // eslint-disable-next-line vue/no-mutating-props
            this.config.decorationTop = layerFactary.newShape({
              ...json.decorationTop,
              vSize: [this.config.styles.initWidth, this.config.styles.initHeight],
              styles: {
                width: this.config.styles.initWidth,
                height: this.config.styles.initHeight,
                initWidth: this.config.styles.initWidth,
                initHeight: this.config.styles.initHeight
              }
            })
          }
          // eslint-disable-next-line vue/no-mutating-props
          this.config.needFetch = false
        })
      }
    }
  },
  computed: {
    ...mapGetters({
      getLayer: 'getLayer'
    }),
    ...mapGetters('user', ['getVerUni']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    layers() {
      const config = this.config as IFrame
      let layers: Array<IImage | IShape> = []
      if (config.decoration && config.decoration.svg && !config.clips[0].isFrameImg) {
        layers = layers.concat(config.decoration)
      }

      layers = layers.concat(...config.clips)

      if (config.decorationTop && config.decorationTop.svg) {
        layers = layers.concat(config.decorationTop)
      }

      if (config.blendLayers) {
        layers = layers.concat(config.blendLayers)
      }
      return layers
    },
    layerIdxOffset(): number {
      const { config } = this
      return config.decoration && config.decoration.svg && !config.clips[0].isFrameImg ? 1 : 0
    },
    shadowWrapperStyles() {
      const shadow = this.config.styles.shadow
      if (shadow && shadow.srcObj?.type) {
        const { imgWidth, imgHeight, imgX, imgY } = shadow.styles
        const { horizontalFlip, verticalFlip, scale } = this.config.styles
        const x = (horizontalFlip ? -imgX : imgX) * scale * this.contentScaleRatio
        const y = (verticalFlip ? -imgY : imgY) * scale * this.contentScaleRatio
        return {
          width: (imgWidth * scale * this.contentScaleRatio).toString() + 'px',
          height: (imgHeight * scale * this.contentScaleRatio).toString() + 'px',
          transform: `translate(${x}px, ${y}px)`
        }
      }
      return {}
    }
  },
  methods: {
    styles() {
      const isFrameImg = this.config.clips.length === 1 && this.config.clips[0].isFrameImg
      return {
        width: isFrameImg ? '' : `${this.config.styles.width / this.config.styles.scale * this.contentScaleRatio}px`,
        height: isFrameImg ? '' : `${this.config.styles.height / this.config.styles.scale * this.contentScaleRatio}px`,
        pointerEvents: ImageUtils.isImgControl(this.pageIndex) ? 'none' : 'initial',
        transform: isFrameImg ? '' : `scale(${1 / this.contentScaleRatio})`,
        transformOrigin: isFrameImg ? '' : 'top left'
      }
    },
    shadowSrc() {
      const shadow = this.config.styles.shadow
      if (shadow && shadow.srcObj && shadow.srcObj.type) {
        const { width, height } = this.config.styles
        const size = ImageUtils.getSrcSize(shadow.srcObj, ImageUtils.getSignificantDimension(width, height) * (this.scaleRatio / 100))
        return ImageUtils.getSrc(shadow.srcObj, ImageUtils.getSrcSize(shadow.srcObj, size))
      }
      return ''
    },
    inImageFrame() {
      return this.config.clips.length === 1 && this.config.clips[0].isFrameImg
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-frame {
  display: flex;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  transform-style: flat;
}
.shadow {
  &__wrapper {
    flex-shrink: 0;
    position: absolute;
  }
  &__img {
    width: 100%;
    height: 100%;
  }
}
</style>
