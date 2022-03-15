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
    img(v-show="!isAdjustImage"
      ref="img"
      :style="flipStyles()"
      :class="{ 'nu-image__picture' : true, 'layer-flip': flippedAnimation }"
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
import store from '@/store'
import { IAssetPhoto } from '@/interfaces/api'
import imgShadowUtils from '@/utils/imageShadowUtils'
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
    const isPrimaryLayerFrame = layerUtils.getLayer(this.pageIndex, this.layerIndex).type === LayerType.frame &&
      (this.subLayerIndex !== -1 || typeof this.subLayerIndex !== 'undefined')
    if (!this.config.forRender && [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur]
      .includes(this.config.styles.shadow.currentEffect) && !isPrimaryLayerFrame) {
      this.handleNewShadowEffect(true)
    }
  },
  destroyed() {
    if (this.filter) {
      const svg = this.filter.parentElement
      svg && svg.remove()
    }
  },
  data() {
    return {
      isOnError: false,
      src: ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config)),
      filter: undefined as unknown as HTMLElement
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
      scaleRatio: 'getPageScaleRatio',
      assetId2Url: 'file/getEditorViewImageIndex'
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
    currentShadowEffect(): string {
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
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapMutations({
      UPDATE_shadowEffect: 'UPDATE_shadowEffect',
      UPDATE_shadowEffectState: 'UPDATE_shadowEffectState'
    }),
    styles() {
      const { imgWidth, imgHeight, imgX, imgY } = this.config.styles
      const { inheritStyle = {} } = this
      return {
        transform: `translate(${imgX}px, ${imgY}px)`,
        width: `${imgWidth}px`,
        height: `${imgHeight}px`,
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
      console.log('image on error')
      this.isOnError = true
      if (this.config.srcObj.type === 'private') {
        try {
          this.updateImages({ assetSet: `${this.config.srcObj.assetId}` }).then(() => {
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
      // First put a preview to this.src, then start to load the image user want. When loading finish,
      // if user still need that image, put it to this.src to replace preview, otherwise do nothing.
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
    handleNewShadowEffect(isInit = false) {
      const { filterId, currentEffect } = this.shadow
      if (isInit || (!filterId && [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur].includes(currentEffect))) {
        const newFilterId = imgShadowUtils.fitlerIdGenerator()
        this.filter = imgShadowUtils.addFilter(newFilterId, imgShadowUtils.getDefaultFilterAttrs()) as HTMLElement
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
        this.filter && imgShadowUtils.updateFilter(this.filter, this.config.styles)
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
