<template lang="pug">
div(v-if="!image.config.imgContorl" class="nu-background-image" draggable="false" :style="mainStyles"  @click="setInBgSettingMode" @tap="dblTap")
  div(v-show="!isColorBackground && !(isBgImgCtrl && imgControlPageIdx === pageIndex)" class="nu-background-image__image" :style="imgStyles()")
    svg(v-if="isAdjustImage"
      class="nu-background-image__svg"
      :viewBox="svgViewBox"
      preserveAspectRatio="none"
      role="image")
      defs
        filter(:id="filterId"
          color-interpolation-filters="sRGB")
          component(v-for="(elm, idx) in svgFilterElms"
            :key="`${filterId + idx}`"
            :is="elm.tag"
            v-bind="elm.attrs")
            component(v-for="child in elm.child"
              :key="child.tag"
              :is="child.tag"
              v-bind="child.attrs")
              //- class="nu-background-image__adjust-picture"
      image(:xlink:href="finalSrc" ref="img"
        class="nu-background-image__adjust-image"
        :filter="`url(#${filterId})`"
        :width="svgImageWidth"
        :height="svgImageHeight"
        @error="onError"
        @load="onLoad")
    img(v-else-if="src" ref="img"
      :src="finalSrc"
      draggable="false"
      @error="onError"
      @load="onLoad")
  div(:style="filterContainerStyles()" class="filter-container")
    component(v-for="(elm, idx) in cssFilterElms"
      :key="`cssFilter${idx}`"
      :is="elm.tag"
      v-bind="elm.attrs")
</template>

<script lang="ts">
import { SrcObj } from '@/interfaces/gallery'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { IBrowserInfo } from '@/store/module/user'
import cssConverter from '@/utils/cssConverter'
import doubleTapUtils from '@/utils/doubleTapUtils'
import editorUtils from '@/utils/editorUtils'
import generalUtils from '@/utils/generalUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import imageShadowUtils from '@/utils/imageShadowUtils'
import ImageUtils from '@/utils/imageUtils'
import pageUtils from '@/utils/pageUtils'
import unitUtils from '@/utils/unitUtils'
import { defineComponent, PropType } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import NuAdjustImage from './NuAdjustImage.vue'

export default defineComponent({
  emits: [],
  props: {
    image: {
      type: Object,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
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
        const { width, height, physicalHeight, physicalWidth, unit = 'px' } = this.pageSize
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
    pageSize(): { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } {
      return pageUtils.removeBleedsFromPageSize(this.page)
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
        ...(this.isAdjustImage && { transform: 'translateZ(0)' }),
        margin: this.padding.split(' ').map(val => '-' + val).join(' '),
        padding: this.padding,
        opacity: this.image.config.styles.opacity / 100,
        backgroundColor: this.color
      }
    },
    isAdjustImage(): boolean {
      const { styles } = this.image.config
      const entries = Object
        .entries(styles.adjust || {})
        .filter(([key, val]) => typeof val === 'number' && val !== 0)
      return entries.length > 1 || (entries.length === 1 && entries[0][0] !== 'halation')
    },
    adjustImgStyles(): { [key: string]: string | number } {
      return Object.assign(generalUtils.deepCopy(this.image.config.styles), {
        width: this.pageSize.width,
        height: this.pageSize.height,
        imgX: this.imageSize.x,
        imgY: this.imageSize.y,
        imgWidth: this.imageSize.width,
        imgHeight: this.imageSize.height
      })
    },
    cssFilterElms(): any[] {
      const { adjust } = this.image.config.styles
      const { width, height } = this.pageSize
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
    },
    svgImageWidth(): number {
      const { imgWidth } = this.image.config.styles
      // return imgWidth * this.contentScaleRatio
      return Math.round(imgWidth * this.contentScaleRatio)
    },
    svgImageHeight(): number {
      const { imgHeight } = this.image.config.styles
      // return imgHeight * this.contentScaleRatio
      return Math.round(imgHeight * this.contentScaleRatio)
    },
    svgViewBox(): string {
      return `0 0 ${this.svgImageWidth} ${this.svgImageHeight}`
    },
    svgFilterElms(): any[] {
      const { adjust } = this.image.config.styles
      return imageAdjustUtil.convertAdjustToSvgFilter(adjust || {}, { styles: this.image.config.styles } as IImage)
    },
    filterId(): string {
      const browserInfo = this.$store.getters['user/getBrowserInfo'] as IBrowserInfo
      const browserIsSafari = browserInfo.name === 'Safari' && browserInfo.version !== '16.3' && generalUtils.OSversionCheck({ greaterThen: '16.0', lessThen: '16.3' })
      const osIsIos = browserInfo.os.family === 'iOS' && browserInfo.os.version !== '16.3' && generalUtils.OSversionCheck({ greaterThen: '16.0', lessThen: '16.3', version: browserInfo.os.version })
      if (browserIsSafari || osIsIos) {
        const { styles: { adjust }, id: layerId } = this.image.config
        const { blur = 0, brightness = 0, contrast = 0, halation = 0, hue = 0, saturate = 0, warm = 0 } = adjust
        const id = layerId + blur.toString() + brightness.toString() + contrast.toString() + halation.toString() + hue.toString() + saturate.toString() + warm.toString()
        return `filter__${id}`
      } else {
        const randomId = generalUtils.generateRandomString(5)
        return `filter__${randomId}`
      }
    },
    imageFilter(): string {
      if (this.svgFilterElms.length) {
        return `url(#${this.filterId})`
      }
      return ''
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapActions('brandkit', ['updateLogos']),
    ...mapMutations({
      setBgImageSrc: 'SET_backgroundImageSrc',
      setBgImgConfig: 'imgControl/SET_BG_CONFIG',
      setBgImageControl: 'SET_backgroundImageControl'
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
    dblTap(e: PointerEvent) {
      doubleTapUtils.click(e, {
        doubleClickCallback: () => {
          this.setBgImageControl({
            pageIndex: this.pageIndex,
            imgControl: true
          })
          editorUtils.setCurrActivePanel('crop')
        }
      })
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
    imgStyles(): Record<string, string> {
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

  &__adjust-image {
    // will-change: contents;
  }

  &__svg {
    display: block;
    height: 100%;
    position: absolute;
    width: 100%;
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
