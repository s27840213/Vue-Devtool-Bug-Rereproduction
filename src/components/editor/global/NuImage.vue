<template lang="pug">
  div(class="nu-image"
    :style="styles()"
    draggable="false")
    template(v-if="isAdjustImage")
      nu-adjust-image(v-show="isAdjustImage"
        :class="{ 'layer-flip': flippedAnimation }"
        :src="src"
        :styles="adjustImgStyles"
        :style="flipStyles()")
    img(v-show="!isAdjustImage"
      ref="img"
      :style="flipStyles()"
      :class="{ 'nu-image__picture' : true, 'layer-flip': flippedAnimation }"
      draggable="false"
      crossOrigin="Anonymous"
      :src="src"
      @error="onError()"
      @load="onLoad()")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import frameUtils from '@/utils/frameUtils'
import { IImage } from '@/interfaces/layer'
import { mapActions, mapGetters, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'
import store from '@/store'
import { IAssetPhoto } from '@/interfaces/api'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    inheritStyle: Object,
    isBgImgControl: Boolean
  },
  async created() {
    const { type } = this.config.srcObj
    const { assetId } = this.config.srcObj
    if (type === 'private') {
      const images = store.getters['user/getImages'] as Array<IAssetPhoto>
      const img = images.find(img => img.assetIndex === assetId)
      if (!img) {
        await store.dispatch('user/updateImages', { assetSet: `${assetId}` })
      }
    }

    await this.perviewAsLoading()

    const preImg = new Image()
    preImg.setAttribute('crossOrigin', 'Anonymous')

    preImg.onerror = () => {
      if (type === 'pexels') {
        const srcObj = { ...this.config.srcObj, userId: 'jpeg' }
        switch (layerUtils.getLayer(this.pageIndex, this.layerIndex).type) {
          case 'group':
            layerUtils.updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { srcObj })
            break
          case 'frame':
            frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { srcObj })
            break
          default:
            layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { srcObj })
        }
        preImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'pre')))
      }
    }
    preImg.onload = () => {
      const nextImg = new Image()
      nextImg.setAttribute('crossOrigin', 'Anonymous')
      nextImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'next')))
    }
    preImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'pre')))
  },
  data() {
    return {
      isOnError: false,
      src: ImageUtils.getSrc(this.config)
    }
  },
  watch: {
    getImgDimension(newVal, oldVal) {
      if (!this.isOnError) {
        const { type } = this.config.srcObj
        if (type === 'background') return

        const preLoadImg = (preLoadType: 'pre' | 'next') => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image()
            img.setAttribute('crossOrigin', 'Anonymous')

            img.onload = () => resolve()
            img.onerror = () => reject(new Error(`cannot preLoad the ${preLoadType}-image`))
            img.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, newVal, preLoadType)))
          })
        }

        const imgElement = this.$refs.img as HTMLImageElement
        imgElement.onload = async () => {
          if (newVal > oldVal) {
            await preLoadImg('next')
            preLoadImg('pre')
          } else {
            await preLoadImg('pre')
            preLoadImg('next')
          }
        }
        this.src = ImageUtils.getSrc(this.config, newVal)
      }
    },
    srcObj: {
      handler: function () {
        this.perviewAsLoading()
      },
      deep: true
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    ...mapState('user', ['imgSizeMap']),
    getImgDimension(): number {
      const { type } = this.config.srcObj
      const { imgWidth, imgHeight } = this.config.styles
      return ImageUtils.getSrcSize(type, ImageUtils.getSignificantDimension(imgWidth, imgHeight) * (this.scaleRatio / 100))
    },
    getPreviewSize(): number {
      const sizeMap = this.imgSizeMap as Array<{ [key: string]: number | string }>
      return ImageUtils
        .getSrcSize(this.config.srcObj.type, sizeMap.flatMap(e => e.key === 'tiny' ? [e.size] : [])[0] as number || 150)
    },
    isAdjustImage(): boolean {
      const { styles } = this.config
      return Object
        .values(styles.adjust || {})
        .some(val => typeof val === 'number' && val !== 0)
    },
    srcObj(): any {
      return (this.config as IImage).srcObj
    },
    adjustImgStyles(): any {
      const styles = generalUtils.deepCopy(this.config.styles)
      if (this.isBgImgControl) {
        Object.assign(styles.adjust, {
          halation: 0
        })
      }
      return styles
    },
    flippedAnimation(): boolean {
      const primaryLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex)
      if (typeof this.subLayerIndex !== 'undefined' && primaryLayer.type === 'frame') {
        return false
      } else {
        return true
      }
    }
  },
  methods: {
    ...mapActions('user', ['updateImages']),
    styles() {
      const { imgWidth, imgHeight, imgX, imgY } = this.config.styles
      const { inheritStyle = {} } = this
      return {
        transform: `translate(${imgX}px, ${imgY}px)`,
        width: `${imgWidth}px`,
        height: `${imgHeight}px`,
        ...inheritStyle
      }
    },
    flipStyles() {
      const { styles } = this.config
      const { horizontalFlip, verticalFlip } = styles
      let scaleX = horizontalFlip ? -1 : 1
      let scaleY = verticalFlip ? -1 : 1

      if (typeof this.subLayerIndex !== 'undefined') {
        const primaryLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex)
        if (primaryLayer.type === 'frame' && this.config.srcObj.type === 'frame') {
          scaleX = primaryLayer.styles.horizontalFlip ? -1 : 1
          scaleY = primaryLayer.styles.verticalFlip ? -1 : 1
        }
      }

      return {
        transform: `scaleX(${scaleX}) scaleY(${scaleY})`
      }
    },
    onError() {
      console.log('image on error')
      this.isOnError = true
      if (this.config.srcObj.type === 'private') {
        try {
          this.updateImages({ assetSet: `${this.config.srcObj.assetId}` })
        } catch (error) {
        }
      }
    },
    onLoad() {
      this.isOnError = false
    },
    async perviewAsLoading() {
      return new Promise<void>((resolve, reject) => {
        this.src = ImageUtils.getSrc(this.config, this.getPreviewSize)
        const img = new Image()
        img.setAttribute('crossOrigin', 'Anonymous')

        const src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
        img.onload = () => {
          // If after onload the img, the config.srcObj is the same, set the src.
          if (ImageUtils.getSrc(this.config) === src) {
            this.src = src
          }
          resolve()
        }
        img.onerror = () => {
          reject(new Error('cannot load the current image'))
        }
        img.src = src
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-image {
  position: absolute;
  top: 0px;
  left: 0px;
  &__picture {
    object-fit: cover;
    // object-fit: fill;
    width: 100%;
    height: 100%;
  }
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
