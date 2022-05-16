<template lang="pug">
  div(class="nu-image"
    :style="styles"
    draggable="false")
    div(v-if="showCanvas && !shadowSrc"
      class="shadow__canvas-wrapper"
      :style="canvasWrapperStyle")
      canvas(ref="canvas")
    div(v-else-if="shadowSrc"
      class="shadow__picture"
      :style="imgShadowStyles")
      img(ref="img"
        :style="flipStyles"
        :class="{'nu-image__picture': true, 'layer-flip': flippedAnimation }"
        draggable="false"
        :src="shadowSrc"
        @error="onError()"
        @load="onLoad()")
    //- template(v-if="isAdjustImage")
    //- nu-adjust-image(v-if="isAdjustImage"
    //-   :src="finalSrc"
    //-   :styles="adjustImgStyles"
    //-   :style="imgStyles")
    template(v-if="isAdjustImage")
      svg(:viewBox="svgViewBox"
        :width="svgImageWidth"
        :height="svgImageHeight"
        preserveAspectRatio="none"
        role="image")
        defs
          filter(:id="filterId"
            color-interpolation-filters="sRGB")
            component(v-for="(elm, idx) in svgFilterElms"
              :key="`svgFilter${idx}`"
              :is="elm.tag"
              v-bind="elm.attrs")
              component(v-for="child in elm.child"
                :key="child.tag"
                :is="child.tag"
                v-bind="child.attrs")
    div(class="img-wrapper"
      :style="imgWrapperstyle")
      div(class='nu-image__picture'
        :style="imgStyles")
        img(ref="img"
          :style="flipStyles"
          :class="{'nu-image__picture': true, 'layer-flip': flippedAnimation }"
          :src="finalSrc"
          draggable="false"
          @error="onError()"
          @load="onLoad ()")
    template(v-if="isAdjustImage")
      component(v-for="(elm, idx) in cssFilterElms"
        :key="`cssFilter${idx}`"
        :is="elm.tag"
        v-bind="elm.attrs")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import frameUtils from '@/utils/frameUtils'
import { IImage } from '@/interfaces/layer'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'
import { IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { ILayerInfo, LayerType } from '@/store/types'
import imageShadowUtils, { CANVAS_SCALE, CANVAS_SIZE, CANVAS_SPACE } from '@/utils/imageShadowUtils'
import eventUtils, { ImageEvent, PanelEvent } from '@/utils/eventUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import pageUtils from '@/utils/pageUtils'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    inheritStyle: Object,
    isBgImgControl: Boolean,
    imgControl: Boolean
  },
  async created() {
    this.handleInitLoad()
  },
  mounted() {
    this.src = this.uploadingImagePreviewSrc === undefined ? this.src : this.uploadingImagePreviewSrc
    eventUtils.on(ImageEvent.redrawCanvasShadow, () => {
      if (this.currentShadowEffect === ShadowEffectType.imageMatched) {
        this.redrawShadow(true)
      } else if (this.currentShadowEffect !== ShadowEffectType.none) {
        if (this.shadow.isTransparent) {
          this.redrawShadow()
        } else {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const isTransparent = imageShadowUtils.isTransparentBg(img)
            imageShadowUtils.updateEffectProps({
              pageIndex: this.pageIndex,
              layerIndex: this.layerIndex,
              subLayerIdx: this.subLayerIndex
            }, { isTransparent })
            isTransparent && this.redrawShadow()
          }
          const imgSize = ImageUtils.getSrcSize(this.config.srcObj.type, 100)
          img.src = ImageUtils.getSrc(this.config, imgSize) + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
        }
      }
    })
  },
  beforeDestroy() {
    if (this.config.inProcess) {
      this.setIsProcessing(false)
    }
  },
  data() {
    return {
      isOnError: false,
      src: '',
      canvasScale: CANVAS_SCALE,
      canvasShadowImg: {
        shadow: undefined as undefined | HTMLImageElement,
        imageMatched: undefined as undefined | HTMLImageElement,
        floating: undefined as undefined | HTMLImageElement
      },
      canvasSize: { width: 0, height: 0 }
    }
  },
  watch: {
    getImgDimension(newVal, oldVal) {
      this.handleDimensionUpdate(newVal, oldVal)
    },
    parentLayerDimension(newVal, oldVal) {
      this.handleDimensionUpdate(newVal, oldVal)
    },
    srcObj: {
      handler: function () {
        if (this.forRender) {
          return
        }
        if (typeof this.subLayerIndex !== 'undefined') {
          this.handleDimensionUpdate(this.parentLayerDimension, 0)
        } else {
          this.perviewAsLoading()
        }
      },
      deep: true
    },
    shadowEffects: {
      handler(val) {
        if (this.$refs.canvas) {
          !this.forRender && this.currentShadowEffect !== ShadowEffectType.none && this.updateShadowEffect(val)
        }
      },
      deep: true
    },
    currentShadowEffect() {
      if (this.forRender) {
        return
      }
      if (this.$refs.canvas) {
        this.handleNewShadowEffect()
      } else {
        this.$nextTick(() => this.handleNewShadowEffect())
      }
    },
    shadowSrc() {
      if (!this.shadowSrc && this.currentShadowEffect !== ShadowEffectType.none && !this.forRender) {
        if (this.canvas) {
          this.handleNewShadowEffect()
        } else {
          this.$nextTick(() => {
            this.handleNewShadowEffect()
          })
        }
      }
      if (!this.shadowSrc) {
        (this.canvasShadowImg as any)[this.currentShadowEffect] = undefined
      }
    },
    'config.imgControl'() {
      if (this.forRender) {
        return
      }
      if (!this.config.imgControl && this.currentShadowEffect !== ShadowEffectType.none) {
        if (this.shadow.isTransparent) {
          this.redrawShadow(true)
        } else if (this.currentShadowEffect === ShadowEffectType.imageMatched) {
          this.redrawShadow(true)
        }
      }
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    ...mapState('user', ['imgSizeMap', 'userId', 'verUni']),
    layerInfo(): ILayerInfo {
      return {
        pageIndex: this.pageIndex,
        layerIndex: this.layerIndex,
        subLayerIdx: this.subLayerIndex
      }
    },
    styles(): any {
      const { width, height } = this.config.styles
      const { inheritStyle = {} } = this
      return this.showCanvas ? {
        width: `${width}px`,
        height: `${height}px`,
        ...inheritStyle
      } : {
        // Fix the safari rendering bug, add the following code can fix it...
        transform: 'translate(0,0)',
        ...inheritStyle
      }
    },
    svgImageWidth(): number {
      const { imgWidth } = this.adjustImgStyles
      return imgWidth
    },
    svgImageHeight(): number {
      const { imgHeight } = this.adjustImgStyles
      return imgHeight
    },
    svgViewBox(): string {
      return `0 0 ${this.svgImageWidth} ${this.svgImageHeight}`
    },
    cssFilterElms(): any[] {
      const { adjustImgStyles: { adjust, width, imgX, imgY, height } } = this
      // @TODO: only for halation now
      if (Number.isNaN(adjust.halation) || !adjust.halation) {
        return []
      }
      const position = {
        width: width / 2,
        x: Math.abs(imgX) + width / 2,
        y: Math.abs(imgY) + height / 2
      }
      return imageAdjustUtil.getHalation(adjust.halation, position)
    },
    filterId(): string {
      const randomId = generalUtils.generateRandomString(5)
      return `filter__${randomId}`
    },
    svgFilterElms(): any[] {
      const { adjust } = this.adjustImgStyles
      return imageAdjustUtil.convertAdjustToSvgFilter(adjust || {})
    },
    canvasWrapperStyle(): any {
      if (this.forRender) {
        return {}
      }
      const { width, height } = this.canvasSize
      return {
        width: `${width}px`,
        height: `${height}px`,
        transform: `scale(${this.config.styles.scale})`
      }
    },
    imgWrapperstyle(): any {
      let clipPath = ''
      if (!this.imgControl) {
        const { height, width } = this.config.styles
        clipPath = `path('M0,0h${width}v${height}h${-width}z`
      }
      return {
        clipPath
      }
    },
    imgStyles(): any {
      const { imgX, imgY, imgHeight, imgWidth } = this.config.styles
      return {
        transform: `translate(${imgX}px, ${imgY}px)`,
        width: `${imgWidth}px`,
        height: `${imgHeight}px`
      }
    },
    imgShadowStyles(): any {
      if (this.forRender) {
        return {}
      }
      const { imgWidth, imgHeight, imgX, imgY } = this.shadow.styles
      const { scale } = this.config.styles
      return {
        width: imgWidth.toString() + 'px',
        height: imgHeight.toString() + 'px',
        transform: `translate(${imgX * scale}px, ${imgY * scale}px) scale(${scale})`
      }
    },
    flipStyles(): any {
      const { horizontalFlip, verticalFlip } = this.config.styles
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
        transform: `scale(${scaleX}, ${scaleY})`,
        ...(this.isAdjustImage && this.svgFilterElms.length && { filter: `url(#${this.filterId})` })
      }
    },
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
    showCanvas(): boolean {
      // return [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur].includes(this.currentShadowEffect)
      return this.currentShadowEffect !== ShadowEffectType.none
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
    },
    shadow(): IShadowProps {
      return (this.config as IImage).styles.shadow
    },
    shadowEffects(): IShadowEffects {
      return this.shadow.effects
    },
    currentShadowEffect(): ShadowEffectType {
      return this.shadow.currentEffect
    },
    canvas: {
      get(): HTMLCanvasElement | undefined {
        return this.$refs.canvas as HTMLCanvasElement | undefined
      },
      cache: false
    },
    scale(): number {
      return this.config.styles.scale
    },
    primaryLayerType(): string {
      const primaryLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex)
      return primaryLayer.type
    },
    /** This prop is used to present if this image-component is
     *  only used for rendering as image controlling */
    forRender(): boolean {
      return (this.config.forRender || this.imgControl) ?? false
    },
    inProcess(): boolean {
      return this.config.inProcess
    },
    uploadingImagePreviewSrc(): string {
      return this.config.previewSrc
    },
    finalSrc(): string {
      if (this.$route.name === 'Preview') {
        return ImageUtils.appendCompQueryForVivipic(this.src)
      }
      return this.src
    },
    parentLayerDimension(): number {
      const { width, height } = this.config.parentLayerStyles || {}
      return ImageUtils.getSrcSize(this.config.srcObj.type, ImageUtils.getSignificantDimension(width, height) * (this.scaleRatio / 100))
    },
    shadowSrc(): string {
      return ImageUtils.getSrc(this.shadow.srcObj, ImageUtils.getSrcSize(this.shadow.srcObj.type, this.getImgDimension))
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapActions('brandkit', ['updateLogos']),
    ...mapMutations({
      UPDATE_shadowEffect: 'UPDATE_shadowEffect',
      setIsProcessing: 'bgRemove/SET_isProcessing'
    }),
    onError() {
      this.isOnError = true
      let updater
      if (this.config.srcObj.type === 'private') {
        updater = async () => await this.updateImages({ assetSet: new Set<string>([this.config.srcObj.assetId]) })
      }
      if (this.config.srcObj.type === 'logo-private') {
        updater = async () => await this.updateLogos({ assetSet: new Set<string>([this.config.srcObj.assetId]) })
      }
      if (updater !== undefined) {
        try {
          updater().then(() => {
            this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
          })
        } catch (error) {
        }
      }
    },
    onLoad() {
      this.isOnError = false
    },
    async perviewAsLoading() {
      if (this.uploadingImagePreviewSrc) {
        return
      }
      /**
       *  First put a preview to this.src, then start to load the right-sized-image.
       *  As loading finished, if the right-sized-image is still need, put it to the image src to replace preview, otherwise doing nothing.
       **/
      return new Promise<void>((resolve, reject) => {
        this.src = ImageUtils.getSrc(this.config, this.getPreviewSize)
        const src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
        const img = new Image()
        img.onload = () => {
          // If after onload the img, the config.srcObj is the same, set the src.
          if (ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config)) === src) {
            this.src = src
          }
          resolve()
        }
        img.onerror = () => {
          reject(new Error(`cannot load the current image, src: ${this.src}`))
        }
        img.src = src
      })
    },
    handleDimensionUpdate(newVal: number, oldVal: number) {
      const imgElement = this.$refs.img as HTMLImageElement
      if (!this.isOnError && this.uploadingImagePreviewSrc === undefined && imgElement) {
        const { type } = this.config.srcObj
        if (type === 'background') return

        imgElement.onload = async () => {
          if (newVal > oldVal) {
            await this.preLoadImg('next', newVal)
            this.preLoadImg('pre', newVal)
          } else {
            await this.preLoadImg('pre', newVal)
            this.preLoadImg('next', newVal)
          }
        }
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, newVal))
      }
    },
    async preLoadImg(preLoadType: 'pre' | 'next', val: number) {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error(`cannot preLoad the ${preLoadType}-image`))
        img.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(this.config.srcObj.type, val, preLoadType)))
      })
    },
    async handleInitLoad() {
      const { type } = this.config.srcObj
      if (this.userId !== 'backendRendering') {
        await this.perviewAsLoading()
        const preImg = new Image()
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
          }
        }
        preImg.onload = () => {
          const nextImg = new Image()
          nextImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'next')))
        }
        preImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(type, this.getImgDimension, 'pre')))
      } else {
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
      }
    },
    handleNewShadowEffect() {
      const { canvas, layerInfo } = this
      if (!canvas) {
        console.warn('there is no canvas!')
        return
      }
      imageShadowUtils.clearLayerData()
      imageShadowUtils.updateEffectProps(this.layerInfo, { hasPaintOnCanvas: false })
      const { width, height } = this.config.styles
      const spaceScale = Math.max((height > width ? height : width) / CANVAS_SIZE, 0.3)
      const _canvasW = (width + CANVAS_SPACE * spaceScale)
      const _canvasH = (height + CANVAS_SPACE * spaceScale)
      const canvasRatio = _canvasH / _canvasW
      const canvasW = _canvasW >= _canvasH ? CANVAS_SIZE : CANVAS_SIZE / canvasRatio
      const canvasH = _canvasW < _canvasH ? CANVAS_SIZE : CANVAS_SIZE * canvasRatio
      const drawCanvasW = width * canvasW / _canvasW
      const drawCanvasH = height * canvasH / _canvasH

      this.canvasSize.width = _canvasW
      this.canvasSize.height = _canvasH

      canvas.setAttribute('width', `${canvasW}`)
      canvas.setAttribute('height', `${canvasH}`)

      const { currentEffect } = this.shadow
      switch (currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.frame:
        case ShadowEffectType.blur: {
          if (this.canvasShadowImg.shadow && this.canvasShadowImg.shadow.src === this.src) {
            imageShadowUtils.drawShadow(canvas, this.canvasShadowImg.shadow as HTMLImageElement, this.config, {
              drawCanvasW,
              drawCanvasH,
              layerInfo
            })
          } else {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              imageShadowUtils.drawShadow(canvas, img, this.config, {
                drawCanvasW,
                drawCanvasH,
                layerInfo
              })
              this.canvasShadowImg.shadow = img
            }
            img.src = ImageUtils.getSrc(this.config,
              ['private', 'public'].includes(this.config.srcObj.type) ? 'smal' : CANVAS_SIZE) +
              `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
          }
          break
        }
        case ShadowEffectType.imageMatched: {
          if (this.canvasShadowImg.imageMatched && this.canvasShadowImg.imageMatched.src === this.src) {
            imageShadowUtils.drawImageMatchedShadow(canvas, this.canvasShadowImg.imageMatched, this.config, {
              drawCanvasW,
              drawCanvasH,
              layerInfo
            })
          } else {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = this.src + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
            img.onload = () => {
              imageShadowUtils.drawImageMatchedShadow(canvas, img, this.config, {
                drawCanvasW,
                drawCanvasH,
                layerInfo
              })
              this.canvasShadowImg.imageMatched = img
            }
          }
          break
        }
        case ShadowEffectType.floating: {
          if (this.canvasShadowImg.floating && this.canvasShadowImg.floating.src === this.src) {
            imageShadowUtils.drawFloatingShadow(canvas, this.canvasShadowImg.floating, this.config, {
              layerInfo,
              drawCanvasW,
              drawCanvasH
            })
          } else {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              imageShadowUtils.drawFloatingShadow(canvas, img, this.config, {
                layerInfo,
                drawCanvasW,
                drawCanvasH
              })
              this.canvasShadowImg.floating = img
            }
            img.src = this.src + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
          }
          break
        }
        case ShadowEffectType.none:
          this.canvasShadowImg.imageMatched = undefined
          this.canvasShadowImg.shadow = undefined
          this.canvasShadowImg.floating = undefined
          imageShadowUtils.updateShadowSrc(this.layerInfo, { type: '', assetId: '', userId: '' })
      }
    },
    updateShadowEffect(effects: IShadowEffects) {
      const { layerInfo, canvas } = this
      if (!canvas) {
        return
      }

      window.requestAnimationFrame(() => {
        this.UPDATE_shadowEffect({
          layerInfo,
          payload: {
            ...effects
          }
        })
        switch (this.currentShadowEffect) {
          case ShadowEffectType.shadow:
          case ShadowEffectType.blur:
          case ShadowEffectType.frame:
            if (this.canvasShadowImg.shadow as HTMLImageElement) {
              imageShadowUtils.drawShadow(canvas, this.canvasShadowImg.shadow as HTMLImageElement, this.config, { layerInfo })
            }
            break
          case ShadowEffectType.imageMatched:
            if (this.canvasShadowImg.imageMatched as HTMLImageElement) {
              imageShadowUtils.drawImageMatchedShadow(canvas, this.canvasShadowImg.imageMatched as HTMLImageElement, this.config, { layerInfo })
            }
            break
          case ShadowEffectType.floating:
            if (this.canvasShadowImg.floating as HTMLImageElement) {
              imageShadowUtils.drawFloatingShadow(canvas, this.canvasShadowImg.floating as HTMLImageElement, this.config, { layerInfo })
            }
            break
          case ShadowEffectType.none:
            break
          default:
            generalUtils.assertUnreachable(this.currentShadowEffect)
        }
      })
    },
    redrawShadow(openPanel = false) {
      imageShadowUtils.updateShadowSrc(this.layerInfo, { type: '', assetId: '', userId: '' })
      layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { scale: 1 }, this.subLayerIndex)
      this.$nextTick(() => {
        this.handleNewShadowEffect()
        openPanel && eventUtils.emit(PanelEvent.showPhotoShadow)
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
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  &__picture {
    object-fit: cover;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height:100%;
  }

  .img-wrapper {
    position: absolute;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
}

.shadow {
  &__canvas-wrapper {
    position: absolute;
    pointer-events: none;
    flex-shrink: 0;
  }
  &__picture {
    position: absolute;
    pointer-events: none;
  }
}

canvas {
  width: 100%;
  height: 100%;
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
