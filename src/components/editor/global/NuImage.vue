<template lang="pug">
  div(class="nu-image"
    :style="styles()"
    draggable="false")
    template(v-if="isAdjustImage")
      nu-adjust-image(v-show="isAdjustImage"
        class="layer-flip"
        :src="src"
        :styles="adjustImgStyles"
        :style="flipStyles()")
    img(v-show="!isAdjustImage"
      :style="flipStyles()"
      class="nu-image__picture layer-flip"
      draggable="false"
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
import { IImage, IImageStyle } from '@/interfaces/layer'
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
    const { type } = this.config
    const { assetId } = this.config.srcObj
    if (type === 'private') {
      const images = store.getters['user/getImages'] as Array<IAssetPhoto>
      const img = images.find(img => img.assetIndex === assetId)
      if (!img) {
        await store.dispatch('user/updateImages', { assetSet: `${assetId}` })
      }
    }
    const nextImg = new Image()
    nextImg.onerror = () => {
      if ((this.config as IImage).srcObj.type === 'pexels') {
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
        nextImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'next'))
      }
    }
    nextImg.onload = () => {
      const preImg = new Image()
      preImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'pre'))
    }
    nextImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'next'))
  },
  data() {
    return {
      isOnError: false,
      src: ImageUtils.getSrc(this.config)
    }
  },
  watch: {
    getImgDimension(newVal) {
      if (!this.isOnError) {
        const { type } = this.config.srcObj
        if (type === 'background') return
        this.src = ImageUtils.getSrc(this.config, newVal)
        const preImg = new Image()
        preImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, newVal, 'pre'))
        const nextImg = new Image()
        nextImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, newVal, 'next'))
      }
    },
    srcObj: {
      handler: function() {
        this.src = ImageUtils.getSrc(this.config, this.getPreviewSize)
        const img = new Image()
        const src = ImageUtils.getSrc(this.config)
        img.src = src
        img.onload = () => {
          // If after onload the img, the config.srcObj is the same, set the src.
          if (ImageUtils.getSrc(this.config) === src) {
            this.src = src
          }
        }
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
      return ImageUtils.getSrcSize(type, ImageUtils.getSignificantDimension(this.config.styles.width, this.config.styles.height) * (this.scaleRatio / 100))
    },
    getPreviewSize(): number {
      const sizeMap = this.imgSizeMap as Array<{ [key: string]: number | string }>
      return sizeMap.flatMap(e => e.key === 'tiny' ? [e.size] : [])[0] as number || 150
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
    }
  },
  methods: {
    ...mapActions('user', ['updateImages']),
    styles() {
      const { inheritStyle = {} } = this
      const { styles } = this.config
      return {
        transform: `translate(${styles.imgX}px, ${styles.imgY}px)`,
        width: `${styles.imgWidth}px`,
        height: `${styles.imgHeight}px`,
        ...inheritStyle
      }
    },
    flipStyles() {
      const { styles } = this.config
      const { horizontalFlip, verticalFlip } = styles
      styles.scaleX = horizontalFlip ? -1 : 1
      styles.scaleY = verticalFlip ? -1 : 1
      return {
        transform: `scaleX(${styles.scaleX}) scaleY(${styles.scaleY})`
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
