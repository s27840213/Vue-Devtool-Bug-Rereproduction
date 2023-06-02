<template lang="pug">
div(v-if="!config.imgControl || forRender || isBgImgControl" class="nu-image"
  :class="{ 'nu-image__shadow-container': shadowSrc || showCanvas}"
  :id="`nu-image-${config.id}`"
  :style="containerStyles"
  :cy-ready="cyReady"
  draggable="false")
  div(v-if="showCanvas"
    class="shadow__canvas-wrapper"
    :style="canvasWrapperStyle()")
    canvas(ref="canvas" :class="`shadow__canvas_${pageIndex}_${layerIndex}_${typeof subLayerIndex === 'undefined' ? -1 : subLayerIndex}`")
  div(v-if="shadowSrc && !config.isFrameImg"
    :id="inPreview ? '' : `nu-image-${config.id}__shadow`"
    class="shadow__picture"
    :style="imgShadowStyles()")
    img(ref="shadow-img"
      class="nu-image__picture-shadow"
      draggable="false"
      :src="shadowSrc"
      @error="onError")
  div(:class="{'nu-image__clipper': !imgControl}")
    //- :style="imgWrapperstyle()")
    div(class='nu-image__picture'
      :style="imgStyles()")
      svg(v-if="isAdjustImage()"
        :style="flipStyles"
        class="nu-image__svg"
        :class="{'layer-flip': flippedAnimation() }"
        :viewBox="`0 0 ${imgNaturalSize.width} ${imgNaturalSize.height}`"
        preserveAspectRatio="none"
        role="image")
        defs
          filter(:id="filterId"
            color-interpolation-filters="sRGB")
            component(v-for="(elm, idx) in svgFilterElms()"
              :key="`${filterId + idx}`"
              :is="elm.tag"
              v-bind="elm.attrs")
              component(v-for="child in elm.child"
                :key="child.tag"
                :is="child.tag"
                v-bind="child.attrs")
        image(:xlink:href="finalSrc" ref="img"
          :filter="`url(#${filterId})`"
          :width="imgNaturalSize.width"
          :height="imgNaturalSize.height"
          class="nu-image__img full-size"
          draggable="false"
          @error="onError"
          @load="onAdjustImgLoad($event, 'main')")
      img(v-else ref="img"
        :style="flipStyles"
        class="nu-image__img full-size"
        :class="{'layer-flip': flippedAnimation() }"
        :src="finalSrc"
        draggable="false"
        @error="onError"
        @load="onLoad($event, 'main')")
  template(v-if="hasHalation()")
    component(v-for="(elm, idx) in cssFilterElms()"
      class="nu-image__adjust"
      :key="`cssFilter${idx}`"
      :is="elm.tag"
      v-bind="elm.attrs")
</template>

<script lang="ts">
import i18n from '@/i18n'
import { IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IGroup, IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { IShadowAsset, IUploadShadowImg } from '@/store/module/shadow'
import { IBrowserInfo } from '@/store/module/user'
import { FunctionPanelType, ILayerInfo, LayerProcessType, LayerType } from '@/store/types'
import eventUtils, { ImageEvent } from '@/utils/eventUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import imageShadowUtils, { CANVAS_MAX_SIZE, CANVAS_SIZE, CANVAS_SPACE } from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import logUtils from '@/utils/logUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import unitUtils from '@/utils/unitUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { notify } from '@kyvg/vue3-notification'
import { AxiosError } from 'axios'
import { PropType, defineComponent } from 'vue'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import NuAdjustImage from './NuAdjustImage.vue'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object,
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
    layerIndex: {
      type: Number,
      required: true
    },
    subLayerIndex: {
      type: Number,
      default: -1
    },
    isBgImgControl: {
      type: Boolean,
      default: false
    },
    imgControl: {
      type: Boolean,
      default: false
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    /** This prop is used to present if this image-component is
     *  only used for rendering as image controlling */
    forRender: Boolean,
    primaryLayer: {
      type: Object,
      default: () => { return undefined }
    },
    priPrimaryLayerIndex: {
      type: Number,
      default: -1
    },
    inPreview: {
      default: false,
      type: Boolean
    }
  },
  async created() {
    this.src = this.config.panelPreviewSrc ?? imageUtils.getSrc(this.config, this.getPreviewSize())
    this.handleInitLoad()
    const isPrimaryLayerFrame = layerUtils.getCurrLayer.type === LayerType.frame
    if (!this.config.isFrameImg && !this.isBgImgControl && !this.config.isFrame && !this.config.forRender && !isPrimaryLayerFrame) {
      this.handleShadowInit()
    }
  },
  mounted() {
    if (this.isBgImgControl) return
    this.src = this.config.previewSrc === undefined ? this.src : this.config.previewSrc
    eventUtils.on(ImageEvent.redrawCanvasShadow + this.config.id, () => {
      if (this.currentShadowEffect() !== ShadowEffectType.none) {
        const isFloatingEffect = this.currentShadowEffect() === ShadowEffectType.floating
        const redrawImmediately = !isFloatingEffect && (this.currentShadowEffect() === ShadowEffectType.imageMatched || this.shadow().isTransparent)
        if (redrawImmediately) {
          this.redrawShadow()
          return
        }
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const isTransparent = imageShadowUtils.isTransparentBg(img)
          imageShadowUtils.updateEffectProps({
            pageIndex: this.pageIndex,
            layerIndex: this.layerIndex,
            subLayerIdx: this.subLayerIndex
          }, { isTransparent })
          if (!redrawImmediately) {
            imageShadowUtils.setHandleId()
            isTransparent && this.redrawShadow()
          }
        }
        img.onerror = (e) => {
          logUtils.setLog('Nu-image: img onload error in mounted hook: src:' + img.src + 'error:' + e.toString())
        }
        const imgSize = imageUtils.getSrcSize(this.config.srcObj, 100)
        img.src = imageUtils.getSrc(this.config, imgSize) + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      } else {
        stepsUtils.record()
      }
    })

    // this.canvas = this.$refs.canvas as HTMLCanvasElement | undefined
  },
  beforeUnmount() {
    if (!this.isBgImgControl) {
      if (this.config.inProcess) {
        this.setIsProcessing(LayerProcessType.none)
      }
      eventUtils.off(ImageEvent.redrawCanvasShadow + this.config.id)
    }
  },
  unmounted() {
    this.hasDestroyed = true
    if (this.config.srcObj.type === 'local') {
      // URL.revokeObjectURL(this.config.srcObj.assetId)
    }
  },
  data() {
    return {
      hasDestroyed: false,
      isOnError: false,
      src: '',
      errorSrcIdentifier: { identifier: '', retry: 0 },
      shadowBuff: {
        canvasShadowImg: undefined as undefined | HTMLImageElement,
        canvasSize: { width: 0, height: 0 },
        drawCanvasW: 0,
        drawCanvasH: 0,
        MAXSIZE: 0
      },
      imgNaturalSize: {
        width: 0,
        height: 0
      },
      initialized: false,
    }
  },
  watch: {
    getImgDimension(newVal, oldVal) {
      this.handleDimensionUpdate(newVal, oldVal)
    },
    'config.srcObj': {
      handler: function () {
        this.shadowBuff.canvasShadowImg = undefined
        if (this.forRender) {
          return
        }
        this.previewAsLoading()
        this.handleIsTransparent()
      },
      deep: true
    },
    'config.styles.shadow.effects': {
      handler(val) {
        const shadow = (this.config as IImage).styles.shadow
        if (shadow.old && shadow.old.currentEffect !== shadow.currentEffect) {
          return
        }
        if (!this.forRender && this.$refs.canvas && !this.isUploadingShadowImg && this.currentShadowEffect() !== ShadowEffectType.none) {
          this.updateShadowEffect(val)
        }
      },
      deep: true
    },
    'config.styles.shadow.currentEffect'() {
      if (this.forRender || this.shadow().srcObj.type === 'upload' || this.getCurrFunctionPanelType !== FunctionPanelType.photoShadow) {
        return
      }
      if (this.$refs.canvas) {
        this.handleNewShadowEffect()
      } else {
        /** until the canvas is mounted */
        setTimeout(() => this.handleNewShadowEffect(), 0)
      }
    },
    showCanvas(val) {
      if (val) {
        setTimeout(() => {
          this.handleNewShadowEffect(false)
        })
      }
    },
    'config.imgControl'(val) {
      if (val) {
        const { subLayerIdx } = this.layerInfo()
        const isSubLayer = typeof subLayerIdx !== 'undefined' && subLayerIdx !== -1
        const currLayer = this.primaryLayer ? this.primaryLayer : this.config
        const isInFrame = isSubLayer && currLayer.type === LayerType.frame && (currLayer as IFrame).clips[subLayerIdx || 0].type === LayerType.image
        const isInGroup = isSubLayer && currLayer.type === LayerType.group && (currLayer as IGroup).layers[subLayerIdx || 0].type === LayerType.image
        if ((!isSubLayer && currLayer.type === LayerType.image) || isInFrame || isInGroup) {
          this.setImgConfig(this.layerInfo())
        }
      } else {
        groupUtils.deselect()
        this.setImgConfig(undefined)
        this.$nextTick(() => {
          const reSelecting = () => {
            const isSubLayer = this.subLayerIndex !== -1 && typeof this.subLayerIndex !== 'undefined'
            const targetIdx = isSubLayer ? ((this.config as IImage).parentLayerStyles?.zindex ?? 0) - 1 : this.config.styles.zindex - 1
            groupUtils.deselect()
            groupUtils.select(this.pageIndex, [targetIdx])
            if (isSubLayer) {
              const { pageIndex, layerIndex, subLayerIdx } = this.layerInfo()
              if (this.primaryLayer?.type === LayerType.group) {
                layerUtils.updateLayerProps(pageIndex, layerIndex, { active: true }, subLayerIdx)
              } else if (this.primaryLayer?.type === LayerType.frame) {
                frameUtils.updateFrameLayerProps(pageIndex, layerIndex, subLayerIdx ?? 0, { active: true })
              }
            }
          }
          if (layerUtils.layerIndex === -1 && !this.isDuringCopy) {
            reSelecting()
          }
          if (this.isDuringCopy) {
            const start = Date.now()
            const timer = setInterval(() => {
              if (Date.now() - start > 10000) {
                clearInterval(timer)
              }
              if (!this.isDuringCopy) {
                reSelecting()
                clearInterval(timer)
              }
            }, 300)
          }
        })
        this.handleDimensionUpdate()
      }
      if (this.forRender) {
        return
      }
      if (!this.config.imgControl && this.currentShadowEffect() !== ShadowEffectType.none) {
        if (this.shadow().isTransparent && ![ShadowEffectType.floating].includes(this.currentShadowEffect())) {
          this.redrawShadow()
        } else if (this.currentShadowEffect() === ShadowEffectType.imageMatched) {
          this.redrawShadow()
        }
      }
    },
    'config.styles.shadow.srcObj': {
      handler: function (val) {
        if (!this.config.isFrameImg && val.type === '' && !this.config.forRender) {
          imageShadowUtils.setEffect(this.shadow().currentEffect, {}, this.layerInfo())
        }
        this.handleUploadShadowImg()
      },
      deep: true
    },
    uploadShadowImgs: {
      handler(val: Array<IUploadShadowImg>) {
        const latest = val[val.length - 1]
        const shadow = this.shadow()
        if (shadow.srcObj.type === 'upload' && latest.id === shadow.srcObj.assetId) {
          const { pageIndex, layerIndex, subLayerIndex: subLayerIdx } = this
          const srcObj = latest.srcObj
          const shadowImgStyles = latest.styles
          imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, srcObj)
          imageShadowUtils.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, shadowImgStyles)
        }
      },
      deep: true
    },
    isBlurImg(val) {
      const { imgWidth, imgHeight } = this.config.styles
      const src = imageUtils.getSrc(this.config, val ? imageUtils.getSrcSize(this.config.srcObj, Math.max(imgWidth, imgHeight)) : this.getImgDimension)
      imageUtils.imgLoadHandler(src, () => {
        this.src = src
      })
    }
  },
  components: { NuAdjustImage },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel',
      isProcessing: 'shadow/isProcessing'
    }),
    ...mapState('vivisticker', ['isDuringCopy']),
    ...mapState('user', ['imgSizeMap', 'userId', 'verUni', 'dpi']),
    ...mapState('shadow', ['uploadId', 'handleId', 'uploadShadowImgs']),
    ...mapState('mobileEditor', {
      inAllPagesMode: 'mobileAllPageMode',
    }),
    cyReady(): boolean {
      // Uploading image, wait for polling
      if (this.src.startsWith('data:image') || !this.initialized) return false
      return true
    },
    finalSrc(): string {
      let src = this.src
      if (this.$route.name === 'Preview') {
        return imageUtils.appendCompQueryForVivipic(this.src)
      }
      src = imageUtils.appendQuery(src, `ver=${generalUtils.generateRandomString(4)}`)
      return src
    },
    shadowSrc(): string {
      if (!this.shadow() || !this.shadow().srcObj) {
        return ''
      }
      const src = imageUtils.getSrc(this.shadow().srcObj, imageUtils.getSrcSize(this.shadow().srcObj, this.getImgDimension))
      if (this.$route.name === 'Preview') {
        return imageUtils.appendCompQueryForVivipic(src)
      }
      return src
    },
    flipStyles(): any {
      const { horizontalFlip, verticalFlip } = this.config.styles
      let scaleX = horizontalFlip ? -1 : 1
      let scaleY = verticalFlip ? -1 : 1

      if (typeof this.subLayerIndex !== 'undefined' && this.subLayerIndex !== -1) {
        const primaryLayer = this.primaryLayer ? this.primaryLayer : this.config
        if (primaryLayer.type === 'frame' && this.config.srcObj.type === 'frame') {
          scaleX = primaryLayer.styles.horizontalFlip ? -1 : 1
          scaleY = primaryLayer.styles.verticalFlip ? -1 : 1
        }
      }
      if (scaleX !== 1 || scaleY !== 1) {
        return {
          transform: `scale(${scaleX}, ${scaleY})`
        }
      }
      return {}
    },
    filterId(): string {
      const browserInfo = this.$store.getters['user/getBrowserInfo'] as IBrowserInfo
      const browserIsSafari = browserInfo.name === 'Safari' && browserInfo.version !== '16.3' && generalUtils.versionCheck({ greaterThan: '16.0', lessThan: '16.3' })
      const osIsIos = browserInfo.os.family === 'iOS' && browserInfo.os.version !== '16.3' && generalUtils.versionCheck({ greaterThan: '16.0', lessThan: '16.3', version: browserInfo.os.version })
      if (browserIsSafari || osIsIos) {
        const { styles: { adjust }, id: layerId } = this.config
        const { blur = 0, brightness = 0, contrast = 0, halation = 0, hue = 0, saturate = 0, warm = 0 } = adjust
        const id = layerId + blur.toString() + brightness.toString() + contrast.toString() + halation.toString() + hue.toString() + saturate.toString() + warm.toString()
        return `filter__${id}`
      } else {
        const randomId = generalUtils.generateRandomString(5)
        return `filter__${randomId}`
      }
    },
    showCanvas(): boolean {
      const { subLayerIndex, handleId } = this
      if (this.page === undefined) {
        return false
      }
      const currentShadowEffect = (this.config as IImage).styles.shadow.currentEffect
      const isCurrShadowEffectApplied = currentShadowEffect !== ShadowEffectType.none
      const isHandling = handleId?.pageId === this.page.id && (() => {
        if (subLayerIndex !== -1 && typeof subLayerIndex !== 'undefined') {
          const { primaryLayer = {} } = this
          return primaryLayer.id === handleId.layerId && primaryLayer.layers[subLayerIndex].id === handleId.subLayerId
        } else {
          return this.config.id === handleId.layerId
        }
      })()
      return isCurrShadowEffectApplied && isHandling
    },
    containerStyles(): any {
      const { width, height } = this.scaledConfig()
      const styles = {
        // in vivisticker the following code would lead the non-fluent UX
        // ...(this.isAdjustImage() && !this.inAllPagesMode && { transform: 'translateZ(0)' }),
      }
      return this.showCanvas ? {
        ...styles,
        width: `${width}px`,
        height: `${height}px`
      } : {
        ...styles
        // Fix the safari rendering bug, add the following code can fix it...
        // transform: 'translate(0,0)'
      }
    },
    getImgDimension(): number | string {
      const { srcObj } = this.config
      const { imgWidth, imgHeight } = this.config.styles
      let renderW = imgWidth
      let renderH = imgHeight
      const primaryLayer = this.primaryLayer
      const isPrimaryFrameImg = primaryLayer && primaryLayer.type === LayerType.frame && primaryLayer.clips[0].isFrameImg
      if (!this.forRender && (this.config.parentLayerStyles || primaryLayer) && !isPrimaryFrameImg && srcObj.type !== 'ios') {
        const { scale = 1 } = this.config.parentLayerStyles || primaryLayer?.styles || {}
        renderW *= scale
        renderH *= scale
      }
      const { dpi } = this
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
      return imageUtils.getSrcSize(srcObj, imageUtils.getSignificantDimension(renderW, renderH) * (this.scaleRatio * 0.01))
    },
    pageSize(): { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } {
      return this.page.isEnableBleed ? pageUtils.removeBleedsFromPageSize(this.page) : this.page
    },
    isBlurImg(): boolean {
      return !!this.config.styles.adjust?.blur
    }
  },
  methods: {
    ...mapActions('file', ['updateImages']),
    ...mapActions('brandkit', ['updateLogos']),
    ...mapMutations({
      UPDATE_shadowEffect: 'UPDATE_shadowEffect',
      setIsProcessing: 'bgRemove/SET_isProcessing',
      setImgConfig: 'imgControl/SET_CONFIG'
    }),
    getErrorSrcIdentifier(config: IImage) {
      const { srcObj, styles } = config
      return srcObj.type + srcObj.assetId + srcObj.userId + (styles.adjust.blur > 0 ? '_blur' : '')
    },
    onError() {
      if (this.errorSrcIdentifier.identifier === this.getErrorSrcIdentifier(this.config as IImage)) {
        if (this.errorSrcIdentifier.retry === 3) {
          return
        }
        this.errorSrcIdentifier.retry++
      } else {
        this.errorSrcIdentifier.identifier = this.getErrorSrcIdentifier(this.config as IImage)
        this.errorSrcIdentifier.retry = 1
      }

      const { srcObj, styles: { width, height } } = this.config
      this.isOnError = true
      let updater
      if (imageUtils.getSrcSize(srcObj, Math.max(width, height)) === 'xtra') {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, {
          srcObj: {
            ...srcObj,
            maxSize: 'larg'
          }
        })
        return
      }
      switch (srcObj.type) {
        case 'private':
          updater = async () => await this.updateImages({ assetSet: new Set<string>([srcObj.assetId]) })
          break
        case 'logo-private':
          updater = async () => await this.updateLogos({ assetSet: new Set<string>([srcObj.assetId]) })
          break
        case 'ios': {
          if (this.primaryLayer?.type === LayerType.frame) {
            frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex,
              {
                type: 'frame',
                assetId: '',
                userId: ''
              }
            )
            frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
              imgWidth: (this.config as IImage).styles.width,
              imgHeight: (this.config as IImage).styles.height,
              imgX: 0,
              imgY: 0,
              opacity: 100,
              adjust: {}
            })
            this.src = imageUtils.getSrc(this.config)
            window.requestAnimationFrame(() => {
              vivistickerUtils.isAnyIOSImgOnError = true
              let subLayerIdx = this.subLayerIndex
              if ((this.primaryLayer as IFrame).decoration) {
                subLayerIdx++
              }
              if (this.priPrimaryLayerIndex !== -1) {
                vivistickerUtils.setLoadingFlag(this.priPrimaryLayerIndex, this.layerIndex, subLayerIdx)
              } else {
                vivistickerUtils.setLoadingFlag(this.layerIndex, subLayerIdx)
              }
            })
          }
        }
      }

      if (updater !== undefined) {
        try {
          updater().then(() => {
            const { imgWidth, imgHeight } = this.config.styles
            this.src = imageUtils.appendOriginQuery(imageUtils.getSrc(this.config, this.isBlurImg ? imageUtils.getSrcSize(this.config.srcObj, Math.max(imgWidth, imgHeight)) : this.getImgDimension))
          })
        } catch (error) {
          if (this.src.indexOf('data:image/png;base64') !== 0) {
            fetch(this.src)
              .then(res => {
                const { status, statusText } = res
                this.logImgError(error, 'fetch result: ' + status + statusText)
              })
              .catch((e) => {
                this.logImgError(error, 'fetch result: ' + e)
              })
          }
        }
      }
    },
    onAdjustImgLoad(e: Event, type?: string) {
      if (type === 'main') {
        let subLayerIdx = this.subLayerIndex
        if (this.primaryLayer && (this.primaryLayer as IFrame).decoration) {
          subLayerIdx++
        }

        // detect if SVG image rendered
        const rendering = () => {
          const elImg = this.$refs.img as SVGImageElement
          if (elImg.width.baseVal.value || elImg.height.baseVal.value) {
            // Render complete
            if (this.priPrimaryLayerIndex !== -1) vivistickerUtils.setLoadingFlag(this.priPrimaryLayerIndex, this.layerIndex, subLayerIdx)
            else vivistickerUtils.setLoadingFlag(this.layerIndex, subLayerIdx)
          } else {
            // Rendering
            window.requestAnimationFrame(rendering)
          }
        }
        window.requestAnimationFrame(rendering)
      }
      imageUtils.imgLoadHandler(this.src, (img) => {
        if (this.imgNaturalSize.width !== img.width || this.imgNaturalSize.height !== img.height) {
          this.imgNaturalSize.width = img.width
          this.imgNaturalSize.height = img.height
        }
      })
    },
    onLoad(e: Event, type?: string) {
      if (type === 'main') {
        let subLayerIdx = this.subLayerIndex
        if (this.primaryLayer && (this.primaryLayer as IFrame).decoration) {
          subLayerIdx++
        }
        console.log(this.priPrimaryLayerIndex, this.layerIndex, subLayerIdx)
        if (this.priPrimaryLayerIndex !== -1) {
          vivistickerUtils.setLoadingFlag(this.priPrimaryLayerIndex, this.layerIndex, subLayerIdx)
        } else {
          vivistickerUtils.setLoadingFlag(this.layerIndex, subLayerIdx)
        }
      }
      this.isOnError = false
      const img = e.target as HTMLImageElement
      if (this.imgNaturalSize.width !== img.width || this.imgNaturalSize.height !== img.height) {
        this.imgNaturalSize.width = img.width
        this.imgNaturalSize.height = img.height
      }
      const physicalRatio = img.naturalWidth / img.naturalHeight
      const layerRatio = this.config.styles.imgWidth / this.config.styles.imgHeight
      if (physicalRatio && layerRatio && Math.abs(physicalRatio - layerRatio) > 0.1 && this.config.srcObj.type !== 'frame') {
        const newW = this.config.styles.imgHeight * physicalRatio
        const offsetW = this.config.styles.imgWidth - newW
        if (this.primaryLayer?.type === 'frame') {
          frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
            imgWidth: newW,
            imgX: this.config.styles.imgX + offsetW / 2
          })
        } else {
          layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, {
            imgWidth: newW,
            imgX: this.config.styles.imgX + offsetW / 2
          }, this.subLayerIndex)
        }
      }
    },
    logImgError(error: unknown, ...infos: Array<string>) {
      if (this.src.indexOf('data:image/png;base64') !== 0) return

      const { pageIndex, layerIndex, subLayerIndex } = this
      const { srcObj: { type, assetId, userId } } = this.config as IImage
      const e = error as Error | AxiosError
      let log =
        `pageIndex: ${pageIndex}, layerIndex: ${layerIndex}, subLayerIndex: ${subLayerIndex}\n` +
        `srcObj: { type: ${type}, assetId: ${assetId}, userId: ${userId} }\n` +
        `Error config src: ${this.src}`
      infos.forEach(info => { log += `\n${info}` })
      console.warn(log)
      logUtils.setLog(log)
    },
    async previewAsLoading() {
      if (this.config.previewSrc) {
        return
      }
      let isPrimaryImgLoaded = false
      const urlId = imageUtils.getImgIdentifier(this.config.srcObj)
      const previewSrc = this.config.panelPreviewSrc ?? imageUtils.getSrc(this.config, this.getPreviewSize())
      imageUtils.imgLoadHandler(previewSrc, () => {
        if (imageUtils.getImgIdentifier(this.config.srcObj) === urlId && !isPrimaryImgLoaded) {
          this.src = previewSrc
        }
      })

      const { imgWidth, imgHeight } = this.config.styles
      const src = imageUtils.appendOriginQuery(imageUtils.getSrc(this.config, this.isBlurImg ? imageUtils.getSrcSize(this.config.srcObj, Math.max(imgWidth, imgHeight)) : this.getImgDimension))
      return new Promise<void>((resolve, reject) => {
        imageUtils.imgLoadHandler(src, () => {
          if (imageUtils.getImgIdentifier(this.config.srcObj) === urlId) {
            isPrimaryImgLoaded = true
            this.src = src
            resolve()
          }
        }, {
          error: () => {
            reject(new Error(`cannot load the current image, src: ${this.src}`))
            if (this.primaryLayer?.type === LayerType.frame) {
              if (this.config.srcObj.type === 'ios') {
                frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex,
                  {
                    type: 'frame',
                    assetId: '',
                    userId: ''
                  }
                )
                frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
                  imgWidth: (this.config as IImage).styles.width,
                  imgHeight: (this.config as IImage).styles.height,
                  imgX: 0,
                  imgY: 0,
                  opacity: 100,
                  adjust: {}
                })
                this.src = imageUtils.getSrc(this.config)
              }
            } else {
              fetch(src)
                .then(res => {
                  const { status, statusText } = res
                  this.logImgError('img loading error, img src:', src, 'fetch result: ' + status + statusText)
                })
                .catch((e) => {
                  if (src.indexOf('data:image/png;base64') !== 0) {
                    this.logImgError('img loading error, img src:', src, 'fetch result: ' + e)
                  }
                })
            }
          }
        })
      })
    },
    handleDimensionUpdate(newVal = 0, oldVal = 0) {
      if (this.config.srcObj.type === 'ios') return
      if (this.isBlurImg) return
      if (!this.isOnError && this.config.previewSrc === undefined) {
        const { type } = this.config.srcObj
        if (type === 'background') return
        const currUrl = imageUtils.appendOriginQuery(imageUtils.getSrc(this.config, this.getImgDimension))
        const urlId = imageUtils.getImgIdentifier(this.config.srcObj)
        imageUtils.imgLoadHandler(currUrl, async () => {
          if (imageUtils.getImgIdentifier(this.config.srcObj) === urlId) {
            this.src = currUrl
            if (newVal > oldVal) {
              await this.preLoadImg('next', this.getImgDimension)
              this.preLoadImg('pre', this.getImgDimension)
            } else {
              await this.preLoadImg('pre', this.getImgDimension)
              this.preLoadImg('next', this.getImgDimension)
            }
          }
        })
      }
    },
    async preLoadImg(preLoadType: 'pre' | 'next', val: number | string) {
      return new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = (error) => {
          reject(new Error(`cannot preLoad the ${preLoadType}-image`))
          fetch(img.src)
            .then(res => {
              const { status, statusText } = res
              this.logImgError(error, 'img src:', img.src, 'fetch result: ' + status + statusText)
            })
            .catch((e) => {
              this.logImgError(error, 'img src:', img.src, 'fetch result: ' + e)
            })
        }
        img.src = imageUtils.appendOriginQuery(imageUtils.getSrc(this.config, imageUtils.getSrcSize(this.config.srcObj, val, preLoadType)))
      })
    },
    handleIsTransparent() {
      if (this.forRender || ['frame', 'tmp', 'group'].includes(this.primaryLayer?.type ?? '')) return
      const imgSize = imageUtils.getSrcSize(this.config.srcObj, 100)
      const src = imageUtils.getSrc(this.config, imgSize) + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      imageUtils.imgLoadHandler(src,
        (img) => {
          if (!this.hasDestroyed) {
            const isTransparent = imageShadowUtils.isTransparentBg(img)
            imageShadowUtils.updateEffectProps(this.layerInfo(), { isTransparent })
            if (!isTransparent && this.config.styles.adjust.blur > 0) {
              this.$forceUpdate()
            }
          }
        }, { crossOrigin: true }
      )
    },
    async handleInitLoad() {
      if (this.userId !== 'backendRendering') {
        this.handleIsTransparent()
        await this.previewAsLoading()
      } else {
        if (this.isAdjustImage()) {
          this.handleIsTransparent()
        }
        const { imgWidth, imgHeight } = this.config.styles
        this.src = imageUtils.appendOriginQuery(imageUtils.getSrc(this.config, this.isBlurImg ? imageUtils.getSrcSize(this.config.srcObj, Math.max(imgWidth, imgHeight)) : this.getImgDimension))
      }
      this.initialized = true
    },
    handleShadowInit() {
      if (this.forRender) return
      const shadow = this.shadow()
      switch (shadow.srcObj.type) {
        case 'shadow-private':
          this.fetchShadowImg()
          break
        case 'upload':
          if (shadow.srcObj.assetId) {
            console.log('handle shadowInit: upload')
            this.handleUploadShadowImg()
          } else {
            console.log('handle shadowInit: upload')
            if (!this.isHandling && !this.isProcessing) {
              imageShadowUtils.updateEffectState(this.layerInfo(), ShadowEffectType.none)
            }
          }
          break
      }
    },
    handleUploadShadowImg() {
      const { srcObj } = this.shadow()
      if (srcObj.type === 'upload' && srcObj.assetId) {
        const uploadData = (this.uploadShadowImgs as Array<IUploadShadowImg>)
          .find((data: IUploadShadowImg) => data.id === srcObj.assetId)
        if (uploadData) {
          imageShadowUtils.updateShadowSrc(this.layerInfo(), uploadData.srcObj)
          imageShadowUtils.updateShadowStyles(this.layerInfo(), uploadData.styles)
        }
      }
    },
    async handleNewShadowEffect(clearShadowSrc = true) {
      const { layerInfo, shadowBuff } = this
      const canvas = this.$refs.canvas as HTMLCanvasElement

      if (!canvas || this.isUploadingShadowImg) {
        if (!canvas) {
          imageShadowUtils.setIsProcess(this.layerInfo(), false)
          imageShadowUtils.setProcessId()
          imageShadowUtils.setHandleId()
          console.warn('the canvas is undefined')
        }
        return
      }
      clearShadowSrc && this.clearShadowSrc()
      const { currentEffect } = this.shadow()
      const hasShadowSrc = this.shadow().srcObj.type && this.shadow().srcObj.type !== 'upload' && this.shadow().srcObj.assetId
      if (currentEffect !== ShadowEffectType.none) {
        imageShadowUtils.setProcessId(this.id())
        !hasShadowSrc && imageShadowUtils.setIsProcess(layerInfo(), true)
      }

      let img = new Image()
      if (!['unsplash', 'pixels'].includes(this.config.srcObj.type) && !this.shadowBuff.MAXSIZE) {
        const res = await imageUtils.getImgSize(this.config.srcObj, false)
        if (res) {
          this.shadowBuff.MAXSIZE = Math.min(Math.max(res.data.height, res.data.width), CANVAS_MAX_SIZE)
        }
      } else if (['unsplash', 'pixels'].includes(this.config.srcObj.type)) {
        this.shadowBuff.MAXSIZE = CANVAS_MAX_SIZE
      }

      switch (currentEffect) {
        case ShadowEffectType.imageMatched:
        case ShadowEffectType.floating:
        case ShadowEffectType.shadow:
        case ShadowEffectType.frame:
        case ShadowEffectType.blur: {
          if (!shadowBuff.canvasShadowImg) {
            if (this.config.previewSrc && this.config.previewSrc.includes('data:image/png;base64')) {
              layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { previewSrc: '' })
            }
            img.crossOrigin = 'anonymous'
            img.src = imageUtils.getSrc(this.config,
              ['unsplash', 'pexels'].includes(this.config.srcObj.type) ? CANVAS_SIZE : 'smal') +
              `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
            await new Promise<void>((resolve) => {
              img.onerror = () => {
                console.log('img load error')
                notify({ group: 'copy', text: `${i18n.global.t('NN0351')}` })
                resolve()
              }
              img.onload = async () => {
                this.shadowBuff.canvasShadowImg = img
                const isSVG = await imageShadowPanelUtils.isSVG(img.src, this.config as IImage)
                if (isSVG) {
                  imageShadowPanelUtils.svgImageSizeFormatter(img, 510, () => {
                    /** svgImageSizeFormatter change the img src, need to use onload to catch the changed img */
                    img.onload = () => {
                      this.shadowBuff.MAXSIZE = CANVAS_MAX_SIZE
                      resolve()
                    }
                  })
                } else {
                  resolve()
                }
              }
            })
          } else {
            img = shadowBuff.canvasShadowImg as HTMLImageElement
          }
          break
        }
        case ShadowEffectType.none:
          imageShadowUtils.updateShadowSrc(this.layerInfo(), { type: '', assetId: '', userId: '' })
          imageShadowUtils.setProcessId()
          imageShadowUtils.clearLayerData()
          return
      }

      imageShadowUtils.updateEffectProps(this.layerInfo(), {
        maxsize: shadowBuff.MAXSIZE,
        middsize: Math.max(img.naturalWidth, img.naturalHeight)
      })

      /**
       * Check if the image is Transparent, only check as the isTransparent flag is undefined and false
       */
      if (typeof this.config.styles.shadow.isTransparent === 'undefined') {
        canvas.setAttribute('width', `${img.naturalWidth}`)
        canvas.setAttribute('height', `${img.naturalHeight}`)
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height)
        imageShadowUtils.updateEffectProps(layerInfo(), {
          isTransparent: imageShadowUtils.isTransparentBg(canvas)
        })
      }

      /**
       * Calculate canvas parameters
       */
      // small size preview
      const { width, height, imgWidth, imgHeight, shadow } = this.config.styles
      const _mappingScale = shadow.middsize / shadow.maxsize
      let _drawCanvasW = 0
      let _drawCanvasH = 0
      let _canvasW = 0
      let _canvasH = 0
      const isStaticShadow = currentEffect === ShadowEffectType.floating ||
        (!shadow.isTransparent && [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur].includes(shadow.currentEffect))
      if (isStaticShadow) {
        const ratio = currentEffect === ShadowEffectType.floating ? img.naturalWidth / img.naturalHeight : width / height
        _drawCanvasW = Math.round(ratio > 1 ? 1600 : 1600 * ratio)
        _drawCanvasH = Math.round(ratio > 1 ? 1600 / ratio : 1600)
        _canvasW = _drawCanvasW + CANVAS_SPACE
        _canvasH = _drawCanvasH + CANVAS_SPACE
      } else {
        _canvasW = img.naturalWidth + CANVAS_SPACE * _mappingScale
        _canvasH = img.naturalHeight + CANVAS_SPACE * _mappingScale
        _drawCanvasW = Math.round(img.naturalWidth * width / imgWidth)
        _drawCanvasH = Math.round(img.naturalHeight * height / imgHeight)
      }
      this.shadowBuff.canvasSize.width = _canvasW * width / _drawCanvasW
      this.shadowBuff.canvasSize.height = _canvasH * height / _drawCanvasH
      this.shadowBuff.drawCanvasW = _drawCanvasW
      this.shadowBuff.drawCanvasH = _drawCanvasH
      canvas.setAttribute('width', `${_canvasW}`)
      canvas.setAttribute('height', `${_canvasH}`)

      let canvasList = [canvas]
      if (this.isShowPagePanel) {
        const { pageIndex, layerIndex, subLayerIndex } = this
        canvasList = [
          ...document
            .querySelectorAll(`.shadow__canvas_${pageIndex}_${layerIndex}_${typeof subLayerIndex === 'undefined' ? -1 : subLayerIndex}`)
        ] as HTMLCanvasElement[]
      }

      const params = {
        pageId: this.page.id,
        drawCanvasW: _drawCanvasW,
        drawCanvasH: _drawCanvasH,
        layerInfo: layerInfo(),
        cb: () => {
          this.clearShadowSrc()
        }
      }
      imageShadowUtils.drawingInit(canvas, img, this.config as IImage, params)
      switch (currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.frame:
        case ShadowEffectType.blur:
          imageShadowUtils.drawShadow(canvasList, img, this.config as IImage, params)
          break
        case ShadowEffectType.imageMatched:
          imageShadowUtils.drawImageMatchedShadow(canvasList, img, this.config as IImage, params)
          break
        case ShadowEffectType.floating: {
          imageShadowUtils.drawFloatingShadow(canvasList, img, this.config as IImage, params)
          break
        }
      }
    },
    updateShadowEffect(effects: IShadowEffects) {
      const { shadowBuff } = this
      const canvas = this.$refs.canvas as HTMLCanvasElement
      const layerInfo = this.layerInfo()
      const { drawCanvasW, drawCanvasH } = shadowBuff
      if (!canvas || this.isUploadingShadowImg) {
        console.log('can not get canvas')
        return
      }

      let canvasList = [canvas]
      if (this.isShowPagePanel) {
        const { pageIndex, layerIndex, subLayerIndex } = this
        canvasList = [
          ...document
            .querySelectorAll(`.shadow__canvas_${pageIndex}_${layerIndex}_${typeof subLayerIndex === 'undefined' ? -1 : subLayerIndex}`)
        ] as HTMLCanvasElement[]
      }

      window.requestAnimationFrame(() => {
        this.UPDATE_shadowEffect({
          layerInfo,
          payload: {
            ...effects
          }
        })
        switch (this.currentShadowEffect()) {
          case ShadowEffectType.shadow:
          case ShadowEffectType.blur:
          case ShadowEffectType.frame:
            if (shadowBuff.canvasShadowImg as HTMLImageElement) {
              imageShadowUtils.drawShadow(canvasList, shadowBuff.canvasShadowImg as HTMLImageElement, this.config as IImage, {
                layerInfo,
                drawCanvasW,
                drawCanvasH,
                cb: () => this.shadow().srcObj.type && this.clearShadowSrc()
              })
            }
            break
          case ShadowEffectType.imageMatched:
            if (shadowBuff.canvasShadowImg as HTMLImageElement) {
              imageShadowUtils.drawImageMatchedShadow(canvasList, shadowBuff.canvasShadowImg as HTMLImageElement, this.config as IImage, {
                layerInfo,
                drawCanvasW,
                drawCanvasH,
                cb: () => this.shadow().srcObj.type && this.clearShadowSrc()
              })
            }
            break
          case ShadowEffectType.floating:
            if (shadowBuff.canvasShadowImg as HTMLImageElement) {
              imageShadowUtils.drawFloatingShadow(canvasList, shadowBuff.canvasShadowImg as HTMLImageElement, this.config as IImage, {
                layerInfo,
                drawCanvasW,
                drawCanvasH,
                cb: () => this.shadow().srcObj.type && this.clearShadowSrc()
              })
            }
            break
          case ShadowEffectType.none:
            break
          default:
            generalUtils.assertUnreachable(this.currentShadowEffect() as never)
        }
      })
    },
    clearShadowSrc() {
      if (this.handleId.pageId && this.handleId.layerId) {
        imageShadowUtils.updateShadowSrc(this.layerInfo(), { type: '', assetId: '', userId: '' })
      }
    },
    redrawShadow() {
      const id = {
        pageId: this.page.id,
        layerId: typeof this.layerIndex !== 'undefined' && this.layerIndex !== -1
          ? layerUtils.getLayer(this.pageIndex, this.layerIndex).id : this.config.id,
        subLayerId: this.config.id
      }
      imageShadowUtils.setHandleId(id)
      imageShadowUtils.updateShadowSrc(this.layerInfo(), { type: '', assetId: '', userId: '' })
      layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { scale: 1 }, this.subLayerIndex)
      groupUtils.deselect()
      groupUtils.select(this.pageIndex, [this.layerIndex])
      if (typeof this.subLayerIndex && this.subLayerIndex !== -1) {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { active: true }, this.subLayerIndex)
      }
      this.$nextTick(() => {
        const primarylayerId = layerUtils.getLayer(this.layerInfo().pageIndex, this.layerInfo().layerIndex).id
        const layerData = {
          primarylayerId,
          config: this.config,
          layerInfo: this.layerInfo
        }
        imageShadowPanelUtils.handleShadowUpload(layerData)
      })
    },
    fetchShadowImg() {
      const { assetId } = (this.config as IImage).styles.shadow.srcObj
      const shadowImgs = (this.$store.getters['shadow/shadowImgs'] as Map<number, IShadowAsset>)
      if (typeof assetId === 'number') {
        if (!shadowImgs.has(assetId)) {
          this.$store.dispatch('shadow/ADD_SHADOW_IMG', [assetId])
            .then(() => {
              imageShadowUtils.updateShadowSrc(this.layerInfo(), {
                ...(this.config as IImage).styles.shadow.srcObj,
                // only used to make Vue update the value, this userId is not meaningful
                userId: 'ver=' + generalUtils.generateRandomString(8)
              })
            })
        }
      }
    },
    layerInfo(): ILayerInfo {
      const layerInfo = {
        pageIndex: this.pageIndex,
        layerIndex: this.layerIndex,
        subLayerIdx: this.subLayerIndex
      }
      return layerInfo
    },
    scaledConfig(): { [index: string]: string | number } {
      const { width, height, imgWidth, imgHeight, imgX, imgY } = this.config.styles as IImageStyle
      return {
        width: width * this.contentScaleRatio,
        height: height * this.contentScaleRatio,
        imgWidth: imgWidth * this.contentScaleRatio,
        imgHeight: imgHeight * this.contentScaleRatio,
        imgX: imgX * this.contentScaleRatio,
        imgY: imgY * this.contentScaleRatio
      }
    },
    cssFilterElms() {
      const { adjust, width, height } = this.adjustImgStyles()
      // @TODO: only for halation now
      if (Number.isNaN(adjust.halation) || !adjust.halation) {
        return []
      }
      const position = {
        width: width / 2 * this.contentScaleRatio,
        x: width / 2 * this.contentScaleRatio,
        y: height / 2 * this.contentScaleRatio
      }
      return imageAdjustUtil.getHalation(adjust.halation, position)
    },
    svgFilterElms() {
      const { adjust } = this.adjustImgStyles()
      return imageAdjustUtil.convertAdjustToSvgFilter(adjust || {}, this.config as IImage)
    },
    canvasWrapperStyle() {
      if (this.forRender) {
        return {}
      }
      const { scale, horizontalFlip, verticalFlip } = this.config.styles
      const { width, height } = this.shadowBuff.canvasSize

      return {
        width: `${width * this.contentScaleRatio}px`,
        height: `${height * this.contentScaleRatio}px`,
        // transform: `scale(${scale})`
        transform: `scaleX(${horizontalFlip ? -1 : 1}) scaleY(${verticalFlip ? -1 : 1}) scale(${scale})`
      }
    },
    imgStyles() {
      let { imgX, imgY, imgHeight, imgWidth } = this.scaledConfig()
      if (this.isBgImgControl) {
        imgX = 0
        imgY = 0
      }
      return {
        transform: `translate(${imgX}px, ${imgY}px)`,
        width: `${imgWidth}px`,
        height: `${imgHeight}px`
      }
    },
    imgShadowStyles() {
      if (this.forRender) {
        return {}
      }
      const { imgWidth, imgHeight, imgX, imgY } = this.shadow().styles
      const { scale, horizontalFlip, verticalFlip } = this.config.styles
      const xFactor = (horizontalFlip ? -1 : 1) * this.contentScaleRatio
      const yFactor = (verticalFlip ? -1 : 1) * this.contentScaleRatio
      return {
        width: (imgWidth * this.contentScaleRatio).toString() + 'px',
        height: (imgHeight * this.contentScaleRatio).toString() + 'px',
        transform: `translate(${xFactor * imgX * scale}px, ${yFactor * imgY * scale}px) scaleX(${horizontalFlip ? -1 : 1}) scaleY(${verticalFlip ? -1 : 1}) scale(${scale})`
      }
    },
    getPreviewSize(): number | string {
      const sizeMap = this.imgSizeMap as Array<{ [key: string]: number | string }>
      return imageUtils
        .getSrcSize(this.config.srcObj, sizeMap?.flatMap(e => e.key === 'tiny' ? [e.size] : [])[0] as number || 320)
    },
    isAdjustImage(): boolean {
      const { styles: { adjust = {} } } = this.config
      const arr = Object.entries(adjust).filter(([, v]) => typeof v === 'number' && v !== 0)
      return arr.length !== 0 && !(arr.length === 1 && arr[0][0] === 'halation')
    },
    hasHalation(): boolean {
      return this.config.styles.adjust?.halation
    },
    adjustImgStyles() {
      let styles = this.config.styles
      if (this.isBgImgControl) {
        styles = generalUtils.deepCopy(this.config.styles)
        Object.assign(styles.adjust, {
          halation: 0
        })
      }
      return styles
    },
    flippedAnimation(): boolean {
      const primaryLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex)
      if (typeof this.subLayerIndex !== 'undefined' && this.subLayerIndex !== -1 && primaryLayer.type === 'frame') {
        return false
      } else {
        return true
      }
    },
    shadow(): IShadowProps {
      return (this.config as IImage).styles.shadow
    },
    currentShadowEffect(): ShadowEffectType {
      return this.shadow().currentEffect
    },
    // uploadingImagePreviewSrc(): string {
    //   return this.config.previewSrc
    // },
    id(): ILayerIdentifier {
      return {
        pageId: this.page.id,
        layerId: typeof this.layerIndex !== 'undefined' && this.layerIndex !== -1
          ? layerUtils.getLayer(this.pageIndex, this.layerIndex).id : this.config.id,
        subLayerId: this.config.id
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-image {
  width: 100%;
  height: 100%;

  &__shadow-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__clipper {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  &__img {
    object-fit: cover;
    display: block;
  }

  &__picture {
    touch-action: none;
    -webkit-touch-callout: none;
    user-select: none;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
  }

  &__picture-shadow {
    touch-action: none;
    -webkit-touch-callout: none;
    user-select: none;
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
  }

  &__svg {
    display: block;
  }

  &__adjust {
    pointer-events: none;
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
</style>
