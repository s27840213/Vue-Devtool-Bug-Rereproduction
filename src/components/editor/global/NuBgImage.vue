<template lang="pug">
  div(class="nu-background-image"
    :style="mainStyles"
    draggable="false")
    div(v-if="!isColorBackground && isAdjustImage" :style="frameStyles")
      nu-adjust-image(:src="src"
        :styles="adjustImgStyles")
    div(v-else :style="bgStyles")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import cssConverter from '@/utils/cssConverter'
import layerUtils from '@/utils/layerUtils'
import generalUtils from '@/utils/generalUtils'
import store from '@/store'
import { IAssetPhoto } from '@/interfaces/api'

export default Vue.extend({
  props: {
    image: Object,
    color: String,
    pageIndex: Number
  },
  async created() {
    const { srcObj } = this.image.config
    if (!srcObj || !srcObj.type) return
    const { assetId } = this.image.config.srcObj
    if (srcObj.type === 'private') { // todo
      const editorImg = store.getters['file/getEditorViewImageIndex']
      console.log('editorImg', editorImg(), editorImg(assetId))

      if (!editorImg(assetId)) {
        console.log('image or error update enter? bbbbggggg', new Set<string>([assetId]))
        await this.updateImages({ assetSet: new Set<string>([assetId]) })
      }
    }
    const nextImg = new Image()
    nextImg.onerror = () => {
      if (srcObj.type === 'pexels') {
        this.setBgImageSrc({
          pageIndex: this.pageIndex,
          srcObj: { ...srcObj, userId: 'jpeg' }
        })
        nextImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj.type, this.getImgDimension, 'next'))
      }
    }
    nextImg.onload = () => {
      const preImg = new Image()
      preImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj.type, this.getImgDimension, 'pre'))
    }
    nextImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj.type, this.getImgDimension, 'next'))
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPageSize: 'getPageSize'
    }),
    isColorBackground(): boolean {
      const { srcObj } = this.image.config
      return !srcObj || srcObj.assetId === ''
    },
    getImgDimension(): number {
      return ImageUtils.getSignificantDimension(this.image.config.styles.width, this.image.config.styles.height) * (this.scaleRatio / 100)
    },
    src(): string {
      return this.isColorBackground ? '' : ImageUtils.getSrc(this.image.config)
    },
    flipStyles(): { transform: any } {
      const { horizontalFlip, verticalFlip } = this.image.config.styles
      return cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
    },
    mainStyles(): any {
      const { image, color } = this
      return {
        opacity: image.config.styles.opacity / 100,
        backgroundColor: color
      }
    },
    isAdjustImage(): boolean {
      const { styles } = this.image.config
      return Object
        .values(styles.adjust || {})
        .some(val => typeof val === 'number' && val !== 0)
    },
    frameStyles(): { [key: string]: string | number } {
      const { image, flipStyles } = this
      return {
        backgroundColor: '#ffffff',
        width: `${image.config.styles.imgWidth}px`,
        height: `${image.config.styles.imgHeight}px`,
        transform: `translate(${image.posX}px, ${image.posY}px) ${flipStyles.transform}`
      }
    },
    adjustImgStyles(): { [key: string]: string | number } {
      return Object.assign(generalUtils.deepCopy(this.image.config.styles), {
        width: this.getPageSize(layerUtils.pageIndex).width,
        height: this.getPageSize(layerUtils.pageIndex).height,
        imgX: this.image.posX,
        imgY: this.image.posY
      })
    },
    bgStyles(): { [key: string]: string | number } {
      const { image, color } = this
      return {
        backgroundColor: color,
        backgroundImage: `url(${this.src})`,
        width: `${image.config.styles.imgWidth}px`,
        height: `${image.config.styles.imgHeight}px`,
        backgroundSize: `${image.config.styles.imgWidth}px ${image.config.styles.imgHeight}px`,
        backgroundPosition: image.posX === -1 ? 'center center' : `${image.posX}px ${image.posY}px`,
        ...this.flipStyles
      }
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapMutations({
      setBgImageSrc: 'SET_backgroundImageSrc'
    }),
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
    onError() { // deprecated?
      console.log('image on error')
      if (this.image.config.srcObj.type === 'private') {
        try {
          this.updateImages({ assetSet: `${this.image.config.srcObj.assetId}` })
        } catch (error) {
          console.log(error)
        }
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-background-image {
  will-change: opacity, transform;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  &__picture {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
}
</style>
