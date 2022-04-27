<template lang="pug">
  div(class="nu-image"
    :style="styles"
    draggable="false")
    template(v-if="isAdjustImage")
      nu-adjust-image(v-show="isAdjustImage"
        :src="src"
        :styles="adjustImgStyles"
        :style="imgStyles")
    div(v-if="showCanvas && !isAdjustImage"
      class="canvas__wrapper"
      :style="canvasWrapperStyle")
      canvas(ref="canvas")
    div(v-show="!isAdjustImage"
      class="img-wrapper"
      :style="imgWrapperstyle")
      div(class='nu-image__picture'
        :style="imgStyles")
        img(ref="img"
          :style="flipStyles"
          :class="{'nu-image__picture': true, 'layer-flip': flippedAnimation }"
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
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'
import imgShadowUtils, { CANVAS_FLOATING_SCALE, CANVAS_SCALE, CANVAS_SIZE } from '@/utils/imageShadowUtils'
import { IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { ILayerInfo, LayerType } from '@/store/types'

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
    const isPrimaryLayerFrame = layerUtils.getLayer(this.pageIndex, this.layerIndex).type === LayerType.frame &&
      (this.subLayerIndex !== -1 || typeof this.subLayerIndex !== 'undefined')
    if (!this.config.forRender && !isPrimaryLayerFrame) {
      this.handleNewShadowEffect()
    }
    this.src = this.uploadingImagePreviewSrc === undefined ? this.src : this.uploadingImagePreviewSrc
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
      canvasShadowImg: undefined as undefined | HTMLImageElement
    }
  },
  watch: {
    getImgDimension(newVal, oldVal) {
      if (!this.isOnError && this.uploadingImagePreviewSrc === undefined) {
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
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
      }
    },
    srcObj: {
      handler: function () {
        !this.forRender && this.perviewAsLoading()
      },
      deep: true
    },
    shadowEffects(val) {
      if (this.$refs.canvas) {
        !this.forRender && this.currentShadowEffect !== ShadowEffectType.none && this.updateShadowEffect(val)
      }
    },
    currentShadowEffect() {
      if (this.$refs.canvas && !this.forRender) {
        this.handleNewShadowEffect()
      } else if (!this.forRender) {
        this.$nextTick(() => this.handleNewShadowEffect())
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
        ...inheritStyle
      }
    },
    canvasWrapperStyle(): any {
      return {
        width: `${this.config.styles.initWidth * this.canvasScale}px`,
        height: `${this.config.styles.initHeight * (this.currentShadowEffect === ShadowEffectType.floating ? CANVAS_FLOATING_SCALE : this.canvasScale)}px`,
        transform: `scale(${this.config.styles.scale})`
      }
    },
    imgWrapperstyle(): any {
      let clipPath = ''
      if (this.currentShadowEffect !== ShadowEffectType.none) {
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
        transform: `scale(${scaleX}, ${scaleY})`
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
      return this.shadow ? this.shadow.effects : { color: '#FFFFFF' }
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
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapMutations({
      UPDATE_shadowEffect: 'UPDATE_shadowEffect',
      setIsProcessing: 'bgRemove/SET_isProcessing'
    }),
    onError() {
      this.isOnError = true
      if (this.config.srcObj.type === 'private') {
        try {
          this.updateImages({ assetSet: new Set<string>([this.config.srcObj.assetId]) }).then(() => {
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
      /**
       *  First put a preview to this.src, then start to load the right-sized-image.
       *  As loading finished, if the right-sized-image is still need, put it to the image src to replace preview, otherwise doing nothing.
       **/
      if (this.uploadingImagePreviewSrc) {
        return
      }
      return new Promise<void>((resolve, reject) => {
        this.src = ImageUtils.getSrc(this.config, this.getPreviewSize)
        const src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
        const img = new Image()
        img.setAttribute('crossOrigin', 'Anonymous')
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
    async handleInitLoad() {
      const { type } = this.config.srcObj

      if (this.userId !== 'backendRendering') {
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
          }
        }
        preImg.onload = () => {
          const nextImg = new Image()
          nextImg.setAttribute('crossOrigin', 'Anonymous')
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
        return
      }
      imgShadowUtils.clearLayerData()
      const { currentEffect } = this.shadow
      switch (currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.frame:
        case ShadowEffectType.blur: {
          if (this.canvasShadowImg) {
            imgShadowUtils.draw(canvas, this.canvasShadowImg as HTMLImageElement, this.config, {
              layerInfo: {
                pageIndex: this.pageIndex,
                layerIndex: this.layerIndex,
                subLayerIdx: this.subLayerIndex
              }
            })
          } else {
            const previewImg = new Image()
            previewImg.crossOrigin = 'Anonymous'
            previewImg.onload = () => {
              canvas.setAttribute('width', `${previewImg.naturalWidth * CANVAS_SCALE}`)
              canvas.setAttribute('height', `${previewImg.naturalHeight * CANVAS_SCALE}`)
              this.canvasShadowImg = previewImg
              imgShadowUtils.draw(canvas, previewImg, this.config, {
                layerInfo
              })
            }
            previewImg.src = ImageUtils.getSrc(this.config,
              ['private', 'public'].includes(this.config.srcObj.type) ? 'smal' : CANVAS_SIZE)
          }
          break
        }
        case ShadowEffectType.imageMatched: {
          const img = this.$refs.img as HTMLImageElement
          if (canvas.width !== img.naturalWidth * CANVAS_SCALE) {
            canvas.setAttribute('width', `${img.naturalWidth * CANVAS_SCALE}`)
            canvas.setAttribute('height', `${img.naturalHeight * CANVAS_SCALE}`)
          }
          imgShadowUtils.drawImageMatchedShadow(canvas, img, this.config, {
            layerInfo
          })
          break
        }
        case ShadowEffectType.floating: {
          const img = this.$refs.img as HTMLImageElement
          if (canvas.height !== img.naturalHeight * CANVAS_FLOATING_SCALE) {
            canvas.setAttribute('width', `${img.naturalWidth * CANVAS_SCALE}`)
            canvas.setAttribute('height', `${img.naturalHeight * CANVAS_FLOATING_SCALE}`)
          }
          imgShadowUtils.drawFloatingShadow(canvas, img, this.config, {
            layerInfo
          })
          break
        }
        case ShadowEffectType.none:
          this.canvasShadowImg = undefined
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
            if (this.canvasShadowImg) {
              imgShadowUtils.draw(canvas, this.canvasShadowImg as HTMLImageElement, this.config, {
                layerInfo
              })
            }
            break
          case ShadowEffectType.imageMatched:
            imgShadowUtils.drawImageMatchedShadow(canvas, this.$refs.img as HTMLImageElement, this.config, {
              layerInfo
            })
            break
          case ShadowEffectType.floating:
            imgShadowUtils.drawFloatingShadow(canvas, this.$refs.img as HTMLImageElement, this.config, {
              layerInfo
            })
            break
          case ShadowEffectType.none:
            break
          default:
            generalUtils.assertUnreachable(this.currentShadowEffect)
        }
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
  .canvas {
    &__wrapper {
      pointer-events: none;
      flex-shrink: 0;
    }
    &__process {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: setColor(gray-1, 0.3);
    }
  }
  canvas {
    width: 100%;
    height: 100%;
  }
  .img-wrapper {
    position: absolute;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
