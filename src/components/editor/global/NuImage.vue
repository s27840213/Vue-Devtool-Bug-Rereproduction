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
    div(v-if="showCanvas"
      class="canvas__wrapper"
      :style="canvasWrapperStyle()")
      canvas(ref="canvas")
    img(v-show="!isAdjustImage && !showCanvas"
      ref="img"
      :style="flipStyles()"
      :class="{ 'nu-image__picture' : true, 'layer-flip': flippedAnimation }"
      draggable="false"
      crossOrigin="Anonymous"
      :src="src"
      @error="onError()"
      @load="onLoad()")
    div(v-if="inProcess" class="canvas__process")
      svg-icon(class="spiner"
        :iconName="'spiner'"
        :iconColor="'white'"
        :iconWidth="'150px'")
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
import store from '@/store'
import { IAssetPhoto } from '@/interfaces/api'
import imgShadowUtils, { CANVAS_SCALE, CANVAS_SIZE } from '@/utils/imageShadowUtils'
import { IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { LayerType } from '@/store/types'

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
    this.handleInitLoad()
  },
  mounted() {
    const isPrimaryLayerFrame = layerUtils.getLayer(this.pageIndex, this.layerIndex).type === LayerType.frame &&
      (this.subLayerIndex !== -1 || typeof this.subLayerIndex !== 'undefined')
    if (!this.config.forRender && !isPrimaryLayerFrame) {
      this.handleNewShadowEffect()
    }
  },
  beforeDestroy() {
    if (this.config.inProcess) {
      this.setIsProcessing(false)
    }
  },
  data() {
    return {
      isOnError: false,
      src: ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config)),
      canvasScale: CANVAS_SCALE,
      canvasImg: undefined as undefined | HTMLImageElement
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
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
      }
    },
    srcObj: {
      handler: function () {
        this.perviewAsLoading()
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
    showCanvas(): boolean {
      return [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur].includes(this.currentShadowEffect)
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
      return this.config.forRender ?? false
    },
    inProcess(): boolean {
      return this.config.inProcess
    }
  },
  methods: {
    ...mapActions('user', ['updateImages']),
    ...mapMutations({
      UPDATE_shadowEffect: 'UPDATE_shadowEffect',
      setIsProcessing: 'bgRemove/SET_isProcessing'
    }),
    styles() {
      const { width, height, imgWidth, imgHeight, imgX, imgY } = this.config.styles
      const { inheritStyle = {} } = this
      return this.showCanvas ? {
        width: `${width}px`,
        height: `${height}px`,
        ...inheritStyle
      } : {
        width: `${imgWidth}px`,
        height: `${imgHeight}px`,
        transform: `translate(${imgX}px, ${imgY}px)`,
        ...inheritStyle
      }
    },
    canvasWrapperStyle() {
      return {
        width: `${this.config.styles.initWidth * this.canvasScale}px`,
        height: `${this.config.styles.initHeight * this.canvasScale}px`,
        transform: `scale(${this.config.styles.scale})`
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
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, this.getPreviewSize))
        const img = new Image()
        img.setAttribute('crossOrigin', 'Anonymous')

        const src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
        img.onload = () => {
          // If after onload the img, the config.srcObj is the same, set the src.
          if (ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config)) === src) {
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
    async handleInitLoad() {
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
    handleNewShadowEffect() {
      const canvas = this.$refs.canvas as HTMLCanvasElement
      const { currentEffect } = this.shadow
      switch (currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.frame:
        case ShadowEffectType.blur: {
          if (this.canvasImg) {
            // imgShadowUtils.draw(canvas, this.canvasImg as HTMLImageElement, this.config)
            imgShadowUtils.draw(canvas, this.canvasImg as HTMLImageElement, this.config, {
              coverImg: this.$refs.img as HTMLImageElement,
              layerInfo: {
                pageIndex: this.pageIndex,
                layerIndex: this.layerIndex,
                subLayerIdx: this.subLayerIndex
              }
            })
          } else {
            const _canvasImg = new Image()
            _canvasImg.crossOrigin = 'Anonymous'
            _canvasImg.onload = () => {
              canvas.setAttribute('width', `${_canvasImg.width * CANVAS_SCALE}`)
              canvas.setAttribute('height', `${_canvasImg.height * CANVAS_SCALE}`)
              this.canvasImg = _canvasImg
              imgShadowUtils.clearLayerData()
              imgShadowUtils.draw(canvas, _canvasImg, this.config, {
                coverImg: this.$refs.img as HTMLImageElement,
                layerInfo: {
                  pageIndex: this.pageIndex,
                  layerIndex: this.layerIndex,
                  subLayerIdx: this.subLayerIndex
                }
              })
            }
            _canvasImg.src = ImageUtils.getSrc(this.config, CANVAS_SIZE)
          }
          break
        }
        case ShadowEffectType.halo:
        case ShadowEffectType.projection:
        case ShadowEffectType.none:
          this.canvasImg = undefined
      }
    },
    updateShadowEffect(effects: IShadowEffects) {
      const { layerIndex, pageIndex, subLayerIndex: subLayerIdx } = this
      const layerInfo = { pageIndex, layerIndex, subLayerIdx }
      window.requestAnimationFrame(() => {
        this.UPDATE_shadowEffect({
          layerInfo,
          payload: {
            ...effects
          }
        })
        imgShadowUtils.draw(this.$refs.canvas as HTMLCanvasElement, this.canvasImg as HTMLImageElement, this.config, {
          coverImg: this.$refs.img as HTMLImageElement,
          layerInfo: {
            pageIndex: this.pageIndex,
            layerIndex: this.layerIndex,
            subLayerIdx: this.subLayerIndex
          }
        })
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
  display: flex;
  justify-content: center;
  align-items: center;
  &__picture {
    object-fit: cover;
    width: 100%;
    height: 100%;
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
}

.layer-flip {
  transition: transform 0.2s linear;
}
</style>
