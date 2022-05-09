<template lang="pug">
  div(class="nu-image"
    :style="styles()"
    draggable="false")
    template(v-if="isAdjustImage")
      nu-adjust-image(v-show="isAdjustImage"
        :class="{ 'layer-flip': flippedAnimation }"
        :src="finalSrc"
        :styles="adjustImgStyles"
        :style="flipStyles()")
    img(v-show="!isAdjustImage"
      ref="img"
      :style="flipStyles()"
      :class="{ 'nu-image__picture' : true, 'layer-flip': flippedAnimation }"
      draggable="false"
      :src="finalSrc"
      @error="onError()"
      @load="onLoad()")
</template>

<script lang="ts">
import Vue from 'vue'
import NuAdjustImage from './NuAdjustImage.vue'
import ImageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import frameUtils from '@/utils/frameUtils'
import { IImage, IStyle } from '@/interfaces/layer'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'
import imgShadowUtils from '@/utils/imageShadowUtils'
import { IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'

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
      src: ''
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
        if (!this.forRender) {
          if (typeof this.subLayerIndex !== 'undefined') {
            this.handleDimensionUpdate(this.parentLayerDimension, 0)
          } else {
            this.perviewAsLoading()
          }
        }
      },
      deep: true
    },
    scale() {
      !this.forRender && this.updateShadowEffect(this.shadowEffects)
    },
    shadowEffects(val) {
      !this.forRender && this.updateShadowEffect(val)
    },
    currentShadowEffect() {
      !this.forRender && this.handleNewShadowEffect()
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    ...mapState('user', ['imgSizeMap', 'userId', 'verUni']),
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
    currentShadowEffect(): string {
      return this.shadow ? this.shadow.currentEffect : ''
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
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapActions('brandkit', ['updateLogos']),
    ...mapMutations({
      UPDATE_shadowEffect: 'UPDATE_shadowEffect',
      UPDATE_shadowEffectState: 'UPDATE_shadowEffectState',
      setIsProcessing: 'bgRemove/SET_isProcessing'
    }),
    styles() {
      const { imgWidth, imgHeight, imgX, imgY } = this.config.styles
      const { inheritStyle = {} } = this
      return {
        width: `${imgWidth}px`,
        height: `${imgHeight}px`,
        transform: `translate(${imgX}px, ${imgY}px)`,
        ...inheritStyle
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
      if (!this.isOnError && this.uploadingImagePreviewSrc === undefined) {
        const { type } = this.config.srcObj
        if (type === 'background') return

        const imgElement = this.$refs.img as HTMLImageElement
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
      const { filterId, currentEffect } = this.shadow
      if ((!filterId && [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur].includes(currentEffect))) {
        const newFilterId = imgShadowUtils.fitlerIdGenerator()
        this.updateShadowEffect(this.shadowEffects)

        const { layerIndex, pageIndex, subLayerIndex: subLayerIdx } = this
        const layerInfo = { layerIndex, pageIndex, subLayerIdx }
        this.UPDATE_shadowEffectState({
          layerInfo,
          payload: {
            filterId: newFilterId
          }
        })
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
