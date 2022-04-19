<template lang="pug">
  div(class="nu-background-image"
    :style="mainStyles"
    draggable="false")
    div(v-show="!isColorBackground")
      div(v-if="isAdjustImage" :style="frameStyles")
        nu-adjust-image(:src="src"
          crossOrigin='Anonymous'
          :styles="adjustImgStyles")
      img(v-else :src="src"
        crossOrigin = "Anonymous"
        draggable="false"
        :style="imgStyles()"
        class="body"
        ref="body")
      //- img(v-else :src="src" :style="imgStyles()")
      //- div(v-else :style="bgStyles")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import cssConverter from '@/utils/cssConverter'
import layerUtils from '@/utils/layerUtils'
import generalUtils from '@/utils/generalUtils'
import { SrcObj } from '@/interfaces/gallery'
import { IImage, IImageStyle } from '@/interfaces/layer'

export default Vue.extend({
  props: {
    image: Object,
    color: String,
    pageIndex: Number
  },
  data() {
    return {
      src: '',
      stylesBuff: {} as IImage
    }
  },
  watch: {
    srcObj: {
      deep: true,
      handler: function() {
        if (this.isColorBackground) {
          this.src = ''
        } else {
          this.perviewAsLoading()
        }
      }
    }
  },
  async created() {
    const { srcObj } = this
    if (!srcObj || !srcObj.type) return

    const { assetId } = this.image.config.srcObj
    if (srcObj.type === 'private') {
      const editorImg = this.getEditorViewImages
      if (!editorImg(assetId)) {
        await this.updateImages({ assetSet: new Set<string>([assetId]) })
        this.src = ImageUtils.getSrc(this.image.config)
      }
    }

    if (this.userId !== 'backendRendering') {
      this.perviewAsLoading()
      const nextImg = new Image()
      nextImg.setAttribute('crossOrigin', 'Anonymous')
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
        preImg.setAttribute('crossOrigin', 'Anonymous')
        preImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj.type, this.getImgDimension, 'pre'))
      }
      nextImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj.type, this.getImgDimension, 'next'))
    } else {
      this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config))
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPageSize: 'getPageSize',
      getEditorViewImages: 'file/getEditorViewImages'
    }),
    ...mapState('user', ['imgSizeMap', 'userId']),
    configStyles(): IImageStyle {
      return this.image.config.styles
    },
    isColorBackground(): boolean {
      const { srcObj } = this.image.config
      return !srcObj || srcObj.assetId === ''
    },
    getImgDimension(): number {
      return ImageUtils.getSignificantDimension(this.image.config.styles.width, this.image.config.styles.height) * (this.scaleRatio / 100)
    },
    srcObj(): SrcObj {
      return this.image.config.srcObj
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
      const { image } = this
      return {
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
    ...mapActions('brandkit', ['updateLogos']),
    ...mapMutations({
      setBgImageSrc: 'SET_backgroundImageSrc'
    }),
    onError() { // deprecated?
      console.log('image on error')
      let updater
      if (this.image.config.srcObj.type === 'private') {
        updater = async () => await this.updateImages({ assetSet: new Set<string>([this.image.config.srcObj.assetId]) })
      }
      if (this.image.config.srcObj.type === 'logo-private') {
        updater = async () => await this.updateLogos({ assetSet: new Set<string>([this.image.config.srcObj.assetId]) })
      }
      if (updater !== undefined) {
        try {
          updater()
        } catch (error) {
          console.log(error)
        }
      }
    },
    imgStyles(): Partial<IImage> {
      return this.stylesConverter()
    },
    async perviewAsLoading() {
      return new Promise<void>((resolve, reject) => {
        const config = this.image.config as IImage
        if (config.previewSrc) {
          this.src = config.previewSrc
          config.previewSrc = ''
        } else if (config.srcObj.type === 'background') {
          this.src = ImageUtils.getSrc(this.image.config, 'prev', this.image.config.ver)
        }
        const img = new Image()
        img.setAttribute('crossOrigin', 'Anonymous')
        const src = ImageUtils.getSrc(this.image.config)
        img.onload = () => {
          /** If after onload the img, the config.srcObj is the same, set the src. */
          if (ImageUtils.getSrc(this.image.config) === src) {
            this.src = src
          }
          resolve()
        }
        img.onerror = () => {
          reject(new Error('cannot load the current image'))
        }
        img.src = src
      })
    },
    stylesConverter(): { [key: string]: string } {
      return {
        width: `${this.image.config.styles.imgWidth}px`,
        height: `${this.image.config.styles.imgHeight}px`,
        transform: `translate(${this.image.posX}px, ${this.image.posY}px) ${this.flipStyles.transform}`
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

.body {
  transition: opacity 1s;
}

</style>
