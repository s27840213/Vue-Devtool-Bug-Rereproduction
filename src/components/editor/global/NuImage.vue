<template lang="pug">
  div(class="nu-image"
    :style="styles()"
    draggable="false")
    nu-adjust-image(v-show="isAdjustImage"
      :src="src"
      :styles="config.styles")
    img(v-show="!isAdjustImage"
      class="nu-image__picture"
      draggable="false"
      :src="src"
      @error="onError()")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import frameUtils from '@/utils/frameUtils'
import { IImage } from '@/interfaces/layer'
import { mapActions, mapGetters } from 'vuex'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    inheritStyle: Object
  },
  created() {
    const { type } = this.config.srcObj
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
    }
  },
  watch: {
    getImgDimension(newVal) {
      const { type } = this.config.srcObj
      if (type === 'background') return
      const preImg = new Image()
      preImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.sizeMap(newVal), 'pre'))
      const nextImg = new Image()
      nextImg.src = ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.sizeMap(newVal), 'next'))
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    getImgDimension(): number {
      return ImageUtils.getSignificantDimension(this.config.styles.width, this.config.styles.height) * (this.scaleRatio / 100)
    },
    src(): string {
      if (this.config.src) {
        return this.config.src
      } else {
        return this.config.previewSrc ?? ImageUtils.getSrc(this.config)
      }
    },
    isAdjustImage(): boolean {
      const { styles } = this.config
      return Object
        .values(styles.adjust || {})
        .some(val => typeof val === 'number' && val !== 0)
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
    sizeMap(width: number) {
      if (width < 540) {
        return 540
      } else if (width < 800) {
        return 800
      } else if (width < 1080) {
        return 1080
      } else {
        return 1600
      }
    },
    onError() {
      console.log('image on error')
      console.log(this.config)
      if (this.config.srcObj.type === 'private') {
        try {
          this.updateImages({ assetSet: `${this.config.srcObj.assetId}` })
        } catch (error) {
          console.log(error)
        }
      }
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
</style>
