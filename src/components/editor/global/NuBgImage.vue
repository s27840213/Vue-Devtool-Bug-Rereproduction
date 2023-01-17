<template lang="pug">
  div(v-if="!image.config.imgContorl" class="nu-background-image" draggable="false" :style="mainStyles")
    div(v-show="!isColorBackground && !(isBgImgCtrl && imgControlPageIdx === pageIndex)" class="nu-background-image__image" :style="imgStyles()")
      div(v-if="isAdjustImage")
        nu-adjust-image(:src="finalSrc"
          @error="onError"
          :styles="adjustImgStyles"
          :contentScaleRatio="contentScaleRatio")
      img(v-else-if="src" :src="finalSrc"
        draggable="false"
        class="body"
        @error="onError"
        ref="body")
    div(:style="filterContainerStyles()" class="filter-container")
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
import imageShadowUtils from '@/utils/imageShadowUtils'
import unitUtils from '@/utils/unitUtils'

export default Vue.extend({
  props: {
    image: Object,
    color: String,
    pageIndex: Number,
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    padding: {
      type: String,
      default: '0'
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
          this.handleIsTransparent()
        }
      }
    },
    getImgDimension(newVal, oldVal) {
      this.handleDimensionUpdate(newVal, oldVal)
    },
    'image.config.imgControl'(val) {
      if (val) {
        this.setBgImgConfig(this.pageIndex)
      } else {
        this.setBgImgConfig(undefined)
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
        const src = ImageUtils.getSrc(this.image.config)
        ImageUtils.imgLoadHandler(src, () => {
          this.src = src
        })
      }
    }

    if (this.userId !== 'backendRendering') {
      this.handleIsTransparent()
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
      if (this.isAdjustImage) {
        this.handleIsTransparent()
      }
      this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config, this.getImgDimension))
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPageSize: 'getPageSize',
      getEditorViewImages: 'file/getEditorViewImages',
      imgControlPageIdx: 'imgControl/imgControlPageIdx',
      isBgImgCtrl: 'imgControl/isBgImgCtrl'
    }),
    ...mapState('user', ['imgSizeMap', 'userId', 'dpi']),
    configStyles(): IImageStyle {
      return this.image.config.styles
    },
    finalSrc(): string {
      if (this.$route.name === 'Preview') {
        return ImageUtils.appendCompQueryForVivipic(this.src)
      }
      return this.src
    },
    isColorBackground(): boolean {
      const { srcObj } = this.image.config
      return !srcObj || srcObj.assetId === ''
    },
    getImgDimension(): number | string {
      const { srcObj, styles: { imgWidth, imgHeight } } = this.image.config as IImage
      const { dpi } = this
      let renderW = imgWidth
      let renderH = imgHeight
      if (dpi !== -1) {
        const { width, height, physicalHeight, physicalWidth, unit = 'px' } = this.pageSizeData
        if (unit !== 'px' && physicalHeight && physicalWidth) {
          const physicaldpi = Math.max(height, width) / unitUtils.convert(Math.max(physicalHeight, physicalWidth), unit, 'in')
          renderW *= dpi / physicaldpi
          renderH *= dpi / physicaldpi
        } else {
          renderW *= dpi / 96
          renderH *= dpi / 96
        }
      }
      return ImageUtils.getSrcSize(srcObj, Math.max(renderW, renderH) * (this.scaleRatio / 100))
    },
    pageSizeData(): { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } {
      return this.getPageSize(this.pageIndex)
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
      const offset = 1
      const aspectRatio = image.config.styles.imgWidth / image.config.styles.imgHeight
      const width = image.config.styles.imgWidth + (aspectRatio < 1 ? offset * 2 : offset * 2 * aspectRatio)
      const height = image.config.styles.imgHeight + (aspectRatio > 1 ? offset * 2 : offset * 2 / aspectRatio)
      const x = image.posX - (aspectRatio < 1 ? offset : offset * aspectRatio)
      const y = image.posY - (aspectRatio > 1 ? offset : offset / aspectRatio)
      return {
        width: width * this.contentScaleRatio,
        height: height * this.contentScaleRatio,
        x: x * this.contentScaleRatio,
        y: y * this.contentScaleRatio
      }
    },
    mainStyles(): any {
      return {
        padding: this.padding,
        opacity: this.image.config.styles.opacity / 100,
        backgroundColor: this.color
      }
    },
    isAdjustImage(): boolean {
      const { styles } = this.image.config
      return Object
        .values(styles.adjust || {})
        .some(val => typeof val === 'number' && val !== 0)
    },
    adjustImgStyles(): { [key: string]: string | number } {
      return Object.assign(generalUtils.deepCopy(this.image.config.styles), {
        width: this.getPageSize(this.pageIndex).width,
        height: this.getPageSize(this.pageIndex).height,
        imgX: this.imageSize.x,
        imgY: this.imageSize.y,
        imgWidth: this.imageSize.width,
        imgHeight: this.imageSize.height
      })
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
      setBgImageSrc: 'SET_backgroundImageSrc',
      setBgImgConfig: 'imgControl/SET_BG_CONFIG'
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
            const src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config, this.getImgDimension))
            ImageUtils.imgLoadHandler(src, () => {
              this.src = src
            })
          })
        } catch (error) {
        }
      }
    },
    handleIsTransparent() {
      const img = new Image()
      const imgSize = ImageUtils.getSrcSize(this.image.config.srcObj, 100)
      img.src = ImageUtils.getSrc(this.image.config, imgSize) + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      img.crossOrigin = 'anoynous'
      img.onload = () => {
        this.$store.commit('SET_backgroundImageStyles', {
          pageIndex: this.pageIndex,
          styles: {
            shadow: {
              isTransparent: imageShadowUtils.isTransparentBg(img)
            }
          }
        })
      }
    },
    imgStyles(): Partial<IImage> {
      return this.stylesConverter()
    },
    filterContainerStyles() {
      return { margin: this.padding }
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
      } else if (this.image.config.panelPreviewSrc) {
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
        }, {
          error: () => {
            reject(new Error('cannot load the current image'))
          }
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
      //   if (!this.dblTabsFlag && this.isActive) {
      //   const touchtime = Date.now()
      //   const interval = 500
      //   const doubleTap = (e: PointerEvent) => {
      //     e.preventDefault()
      //     if (Date.now() - touchtime < interval && !this.dblTabsFlag) {
      //       /**
      //        * This is the dbl-click callback block
      //        */
      //       if (this.getLayerType === LayerType.image) {
      //         layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
      //         setTimeout(() => eventUtils.emit(PanelEvent.switchTab, 'crop'), 0)
      //       }
      //       this.dblTabsFlag = true
      //     }
      //   }
      //   this.eventTarget.addEventListener('pointerdown', doubleTap)
      //   setTimeout(() => {
      //     this.eventTarget.removeEventListener('pointerdown', doubleTap)
      //     this.dblTabsFlag = false
      //   }, interval)
      // }
    },
    handleDimensionUpdate(newVal: number, oldVal: number) {
      if (this.image.config.previewSrc === undefined) {
        const currUrl = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.image.config, newVal))
        const urlId = ImageUtils.getImgIdentifier(this.image.config.srcObj)
        ImageUtils.imgLoadHandler(currUrl, async () => {
          if (ImageUtils.getImgIdentifier(this.image.config.srcObj) === urlId) {
            this.src = currUrl
            if (newVal > oldVal) {
              await this.preLoadImg('next', newVal)
              this.preLoadImg('pre', newVal)
            } else {
              await this.preLoadImg('pre', newVal)
              this.preLoadImg('next', newVal)
            }
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
  // will-change: opacity, transform;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  &__picture {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
  text-align: left;

  &__color {
    position: relative;
    width: 100%;
    height: 100%;
  }

  &__image{
    position: relative;
    >img {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }
}

.body {
  transition: opacity 1s;
}

.filter-container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>
