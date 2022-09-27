<template lang="pug">
  div(class="nu-background-image"
    :style="mainStyles"
    @pointerdown="setInBgSettingMode"
    draggable="false")
    div(v-show="!isColorBackground")
      div(v-if="isAdjustImage" :style="frameStyles")
        nu-adjust-image(:src="src"
          @error="onError"
          :styles="adjustImgStyles"
          :contentScaleRatio="contentScaleRatio")
      img(v-else :src="src"
        draggable="false"
        :style="imgStyles()"
        class="body"
        @error="onError"
        ref="body")
    component(v-for="(elm, idx) in cssFilterElms"
      :key="`cssFilter${idx}`"
      :is="elm.tag"
      v-bind="elm.attrs")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import cssConverter from '@/utils/cssConverter'
import generalUtils from '@/utils/generalUtils'
import { SrcObj } from '@/interfaces/gallery'
import { IImage, IImageStyle } from '@/interfaces/layer'
import editorUtils from '@/utils/editorUtils'
import pageUtils from '@/utils/pageUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'

export default Vue.extend({
  props: {
    image: Object,
    color: String,
    pageIndex: Number,
    contentScaleRatio: {
      default: 1,
      type: Number
    }
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
      handler: function () {
        if (this.isColorBackground) {
          this.src = ''
        } else {
          this.previewAsLoading()
        }
      }
    },
    getImgDimension(newVal, oldVal) {
      this.handleDimensionUpdate(newVal, oldVal)
    }
  },
  async created() {
    const { srcObj } = this
    if (!srcObj || !srcObj.type) return
    console.log('in create hook')

    const { assetId } = this.image.config.srcObj
    if (srcObj.type === 'private') {
      const editorImg = this.getEditorViewImages
      if (!editorImg(assetId)) {
        await this.updateImages({ assetSet: new Set<string>([assetId]) })
        const src = ImageUtils.getSrc(this.image.config)
        ImageUtils.imgLoadHandler(src, () => {
          this.src = src
        })
      }
    }

    if (this.userId !== 'backendRendering') {
      this.previewAsLoading()
      const nextImg = new Image()
      nextImg.onerror = () => {
        if (srcObj.type === 'pexels') {
          this.setBgImageSrc({
            pageIndex: this.pageIndex,
            srcObj: { ...srcObj, userId: 'jpeg' }
          })
          nextImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj, this.getImgDimension, 'next'))
        }
      }
      nextImg.onload = () => {
        const preImg = new Image()
        preImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj, this.getImgDimension, 'pre'))
      }
      nextImg.src = ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(srcObj, this.getImgDimension, 'next'))
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
      const { srcObj, styles: { imgWidth, imgHeight } } = this.image.config as IImage
      return ImageUtils.getSrcSize(srcObj, Math.max(imgWidth, imgHeight) * (this.scaleRatio / 100))
    },
    srcObj(): SrcObj {
      return this.image.config.srcObj
    },
    flipStyles(): { transform: any } {
      const { horizontalFlip, verticalFlip } = this.image.config.styles
      return cssConverter.convertFlipStyle(horizontalFlip, verticalFlip)
    },
    imageSize(): { width: number, height: number, x: number, y: number } {
      const { image } = this
      return {
        width: image.config.styles.imgWidth * this.contentScaleRatio,
        height: image.config.styles.imgHeight * this.contentScaleRatio,
        x: image.posX * this.contentScaleRatio,
        y: image.posY * this.contentScaleRatio
      }
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
      const { flipStyles } = this
      return {
        width: `${this.imageSize.width}px`,
        height: `${this.imageSize.height}px`,
        transform: `translate(${this.imageSize.x}px, ${this.imageSize.y}px) ${flipStyles.transform}`
      }
    },
    adjustImgStyles(): { [key: string]: string | number } {
      return Object.assign(generalUtils.deepCopy(this.image.config.styles), {
        width: this.getPageSize(this.pageIndex).width,
        height: this.getPageSize(this.pageIndex).height,
        imgX: this.image.posX,
        imgY: this.image.posY
      })
    },
    bgStyles(): { [key: string]: string | number } {
      const { image } = this
      return {
        backgroundImage: `url(${this.src})`,
        width: `${this.imageSize.width}px`,
        height: `${this.imageSize.height}px`,
        backgroundSize: `${this.imageSize.width}px ${this.imageSize.height}px`,
        backgroundPosition: this.imageSize.x === -1 ? 'center center' : `${this.imageSize.x}px ${this.imageSize.y}px`,
        ...this.flipStyles
      }
    },
    cssFilterElms(): any[] {
      const { adjust } = this.image.config.styles
      const { width, height } = pageUtils.getPage(this.pageIndex)
      if (!adjust) return []

      const elms = []
      if (adjust.halation) {
        const position = {
          width: width / 2 * this.contentScaleRatio,
          x: width / 2 * this.contentScaleRatio,
          y: height / 2 * this.contentScaleRatio
        }
        elms.push(...imageAdjustUtil.getHalation(adjust.halation, position))
      }
      return elms
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapActions('brandkit', ['updateLogos']),
    ...mapMutations({
      setBgImageSrc: 'SET_backgroundImageSrc'
    }),
    onError() {
      let updater
      const srcObj = this.image.config.srcObj
      switch (srcObj.type) {
        case 'private':
          updater = async () => await this.updateImages({ assetSet: new Set<string>([this.image.config.srcObj.assetId]) })
          break
        case 'logo-private':
          updater = async () => await this.updateLogos({ assetSet: new Set<string>([this.image.config.srcObj.assetId]) })
          break
      }

      if (updater !== undefined) {
        try {
          updater().then(() => {
            const src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config))
            ImageUtils.imgLoadHandler(src, () => {
              this.src = src
            })
          })
        } catch (error) {
        }
      }
    },
    imgStyles(): Partial<IImage> {
      return this.stylesConverter()
    },
    async previewAsLoading() {
      let isPrimaryImgLoaded = false
      const config = this.image.config as IImage
      const urlId = ImageUtils.getImgIdentifier(this.image.config.srcObj)
      if (config.previewSrc) {
        const previewSrc = config.previewSrc
        ImageUtils.imgLoadHandler(previewSrc, () => {
          if (ImageUtils.getImgIdentifier(this.image.config.srcObj) === urlId && !isPrimaryImgLoaded) {
            this.src = previewSrc
          }
        })
      } else if (config.srcObj.type === 'background') {
        const panelPreviewSrc = this.image.config.panelPreviewSrc
        ImageUtils.imgLoadHandler(panelPreviewSrc, () => {
          if (ImageUtils.getImgIdentifier(this.image.config.srcObj) === urlId && !isPrimaryImgLoaded) {
            this.src = panelPreviewSrc
          }
        })
      }
      const src = ImageUtils.getSrc(this.image.config)
      return new Promise<void>((resolve, reject) => {
        ImageUtils.imgLoadHandler(src, () => {
          if (ImageUtils.getImgIdentifier(this.image.config.srcObj) === urlId) {
            isPrimaryImgLoaded = true
            this.src = src
            resolve()
          }
        }, () => {
          reject(new Error('cannot load the current image'))
        })
      })
    },
    stylesConverter(): { [key: string]: string } {
      return {
        width: `${this.imageSize.width}px`,
        height: `${this.imageSize.height}px`,
        transform: `translate(${this.imageSize.x}px, ${this.imageSize.y}px) ${this.flipStyles.transform}`
      }
    },
    setInBgSettingMode() {
      editorUtils.setInBgSettingMode(true)
    },
    handleDimensionUpdate(newVal: number, oldVal: number) {
      console.warn('handle dimension')
      const imgElement = this.$refs.body as HTMLImageElement
      if (this.image.config.previewSrc === undefined && imgElement) {
        imgElement.onload = async () => {
          if (newVal > oldVal) {
            await this.preLoadImg('next', newVal)
            this.preLoadImg('pre', newVal)
          } else {
            await this.preLoadImg('pre', newVal)
            this.preLoadImg('next', newVal)
          }
        }
        const currUrl = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config, newVal))
        const urlId = ImageUtils.getImgIdentifier(this.image.config.srcObj)
        ImageUtils.imgLoadHandler(currUrl, () => {
          if (ImageUtils.getImgIdentifier(this.image.config.srcObj) === urlId) {
            this.src = currUrl
          }
        })
      }
    },
    async preLoadImg(preLoadType: 'pre' | 'next', val: number) {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => {
          reject(new Error(`cannot preLoad the ${preLoadType}-image`))
        }
        img.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config, ImageUtils.getSrcSize(this.image.config.srcObj, val, preLoadType)))
      })
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
