<template lang="pug">
  div(v-if="!isImgControl || forRender || isBgImgControl" class="nu-image"
    :id="`nu-image-${config.id}`"
    :style="styles"
    draggable="false")
    div(v-if="showCanvas"
      class="shadow__canvas-wrapper"
      :style="canvasWrapperStyle")
      canvas(ref="canvas" :class="`shadow__canvas_${pageIndex}_${layerIndex}_${typeof subLayerIndex === 'undefined' ? -1 : subLayerIndex}`")
    div(v-if="shadowSrc && !config.isFrameImg"
      :id="`nu-image-${config.id}__shadow`"
      class="shadow__picture"
      :style="imgShadowStyles")
      img(ref="shadow-img"
        class="nu-image__picture-shadow"
        draggable="false"
        :src="shadowSrc"
        @error="onError"
        @load="onLoadShadow")
    div(class="img-wrapper"
      :style="imgWrapperstyle")
      div(class='nu-image__picture'
        :style="imgStyles")
        svg(v-if="isAdjustImage"
          :style="flipStyles"
          :class="{'layer-flip': flippedAnimation }"
          :viewBox="svgViewBox"
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
          g
            g(:filter="`url(#${filterId})`")
              image(:xlink:href="finalSrc" ref="img"
                class="nu-image__picture"
                draggable="false"
                @error="onError"
                @load="onLoad")
        img(v-else ref="img"
          :style="flipStyles"
          :class="{'nu-image__picture': true, 'layer-flip': flippedAnimation }"
          :src="finalSrc"
          draggable="false"
          @error="onError"
          @load="onLoad")
    template(v-if="hasHalation")
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
import { IGroup, IImage, ILayerIdentifier } from '@/interfaces/layer'
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import generalUtils from '@/utils/generalUtils'
import { IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { FunctionPanelType, ILayerInfo, LayerProcessType, LayerType } from '@/store/types'
import imageShadowUtils, { CANVAS_MAX_SIZE, CANVAS_SIZE, CANVAS_SPACE, DRAWING_TIMEOUT } from '@/utils/imageShadowUtils'
import eventUtils, { ImageEvent, PanelEvent } from '@/utils/eventUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import pageUtils from '@/utils/pageUtils'
import { IShadowAsset, IUploadShadowImg } from '@/store/module/shadow'
import stepsUtils from '@/utils/stepsUtils'
import groupUtils from '@/utils/groupUtils'
import imageShadowPanelUtils from '@/utils/imageShadowPanelUtils'
import logUtils from '@/utils/logUtils'
import { AxiosError } from 'axios'

export default Vue.extend({
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    subLayerIndex: Number,
    inheritStyle: Object,
    isBgImgControl: Boolean,
    imgControl: Boolean,
    /** This prop is used to present if this image-component is
     *  only used for rendering as image controlling */
    forRender: Boolean,
    primaryLayer: {
      type: Object,
      default: () => { return undefined }
    }
  },
  async created() {
    this.handleInitLoad()
    if (!this.config.isFrameImg && !this.isBgImgControl && !this.config.isFrame && !this.config.forRender) {
      this.handleShadowInit()
      if (typeof this.config.styles.shadow.isTransparent === 'undefined') {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        const size = ['unsplash', 'pexels'].includes(this.config.srcObj.type) ? 150 : 'prev'
        img.src = ImageUtils.getSrc(this.config, size) + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          canvas.setAttribute('width', img.naturalWidth.toString())
          canvas.setAttribute('height', img.naturalHeight.toString())
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height)
          imageShadowUtils.updateEffectProps(this.layerInfo, {
            isTransparent: imageShadowUtils.isTransparentBg(canvas)
          })
        }
      }
    }
  },
  mounted() {
    if (this.isBgImgControl) return
    this.src = this.config.previewSrc === undefined ? this.src : this.config.previewSrc
    eventUtils.on(ImageEvent.redrawCanvasShadow + this.config.id, () => {
      if (this.currentShadowEffect !== ShadowEffectType.none) {
        const isFloatingEffect = this.currentShadowEffect === ShadowEffectType.floating
        const redrawImmediately = !isFloatingEffect && (this.currentShadowEffect === ShadowEffectType.imageMatched || this.shadow.isTransparent)
        if (redrawImmediately) {
          this.redrawShadow()
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
        const imgSize = ImageUtils.getSrcSize(this.config.srcObj, 100)
        img.src = ImageUtils.getSrc(this.config, imgSize) + `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      } else {
        stepsUtils.record()
      }
    })
  },
  beforeDestroy() {
    if (!this.isBgImgControl) {
      if (this.config.inProcess) {
        this.setIsProcessing(LayerProcessType.none)
      }
      eventUtils.off(ImageEvent.redrawCanvasShadow + this.config.id)
    }
  },
  data() {
    return {
      isOnError: false,
      src: '',
      shadowBuff: {
        canvasShadowImg: undefined as undefined | HTMLImageElement,
        canvasSize: { width: 0, height: 0 },
        drawCanvasW: 0,
        drawCanvasH: 0,
        MAXSIZE: 0
      }
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
        this.shadowBuff.canvasShadowImg = undefined
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
        const shadow = (this.config as IImage).styles.shadow
        if (shadow.old && shadow.old.currentEffect !== shadow.currentEffect) {
          return
        }
        if (!this.forRender && this.$refs.canvas && !this.isUploadingShadowImg && this.currentShadowEffect !== ShadowEffectType.none) {
          this.updateShadowEffect(val)
        }
      },
      deep: true
    },
    currentShadowEffect(val) {
      console.warn('change', val)
      if (this.forRender || this.shadow.srcObj.type === 'upload' || this.getCurrFunctionPanelType !== FunctionPanelType.photoShadow) {
        return
      }
      if (this.$refs.canvas) {
        this.handleNewShadowEffect()
      } else {
        /** until the canvas is mounted */
        this.$nextTick(() => this.handleNewShadowEffect())
      }
    },
    showCanvas(val) {
      if (val && (this.config as IImage).styles.shadow.srcObj.type) {
        setTimeout(() => {
          this.handleNewShadowEffect(false)
        })
      }
    },
    'config.imgControl'(val) {
      if (val) {
        this.setImgConfig(this.layerInfo)
      } else {
        this.setImgConfig(undefined)
        this.handleDimensionUpdate()
      }
      if (this.forRender) {
        return
      }
      if (!this.config.imgControl && this.currentShadowEffect !== ShadowEffectType.none) {
        if (this.shadow.isTransparent && ![ShadowEffectType.floating].includes(this.currentShadowEffect)) {
          this.redrawShadow()
        } else if (this.currentShadowEffect === ShadowEffectType.imageMatched) {
          this.redrawShadow()
        }
      }
    },
    'shadow.srcObj': {
      handler: function (val) {
        if (!this.config.isFrameImg && val.type === '' && !this.config.forRender) {
          imageShadowUtils.setEffect(this.shadow.currentEffect, {}, this.layerInfo)
        }
        this.handleUploadShadowImg()
      },
      deep: true
    },
    uploadShadowImgs: {
      handler(val: Array<IUploadShadowImg>) {
        const latest = val[val.length - 1]
        const shadow = this.shadow
        if (shadow.srcObj.type === 'upload' && latest.id === shadow.srcObj.assetId) {
          const { pageIndex, layerIndex, subLayerIndex: subLayerIdx } = this
          const srcObj = latest.srcObj
          const shadowImgStyles = latest.styles
          imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, srcObj)
          imageShadowUtils.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, shadowImgStyles)
        }
      },
      deep: true
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
    ...mapState('user', ['imgSizeMap', 'userId', 'verUni']),
    ...mapState('shadow', ['uploadId', 'handleId', 'uploadShadowImgs']),
    isImgControl(): boolean {
      return this.config.imgControl
    },
    layerInfo(): ILayerInfo {
      const layerInfo = {
        pageIndex: this.pageIndex,
        layerIndex: this.layerIndex,
        subLayerIdx: this.subLayerIndex
      }
      const { primaryLayer } = this
      if (!this.config.isFrameImg && primaryLayer && primaryLayer.type === LayerType.frame && primaryLayer.decoration) {
        layerInfo.subLayerIdx--
      }
      return layerInfo
    },
    styles(): any {
      const { width, height } = this.config.styles
      return this.showCanvas ? {
        width: `${width}px`,
        height: `${height}px`
      } : {
        // Fix the safari rendering bug, add the following code can fix it...
        transform: 'translate(0,0)'
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
      const { adjustImgStyles: { adjust, width, height } } = this
      // @TODO: only for halation now
      if (Number.isNaN(adjust.halation) || !adjust.halation) {
        return []
      }
      const position = {
        width: width / 2,
        x: width / 2,
        y: height / 2
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
        // ...(this.isAdjustImage && this.svgFilterElms.length && { filter: `url(#${this.filterId})` })
      }
    },
    canvasWrapperStyle(): any {
      if (this.forRender) {
        return {}
      }
      const { scale, horizontalFlip, verticalFlip } = this.config.styles
      const { width, height } = this.shadowBuff.canvasSize

      return {
        width: `${width}px`,
        height: `${height}px`,
        // transform: `scale(${scale})`
        transform: `scaleX(${horizontalFlip ? -1 : 1}) scaleY(${verticalFlip ? -1 : 1}) scale(${scale})`
      }
    },
    imgWrapperstyle(): any {
      const { height, width } = this.config.styles
      let clipPath = ''
      if (!this.imgControl && !this.isBgImgControl) {
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
    imgShadowFlipStyle(): any {
      const { horizontalFlip, verticalFlip } = this.config.styles
      return {
        transform: `scaleX(${horizontalFlip ? -1 : 1}) scaleY(${verticalFlip ? -1 : 1})`
      }
    },
    imgShadowStyles(): any {
      if (this.forRender) {
        return {}
      }
      const { imgWidth, imgHeight, imgX, imgY } = this.shadow.styles
      const { scale, horizontalFlip, verticalFlip } = this.config.styles
      const xFactor = horizontalFlip ? -1 : 1
      const yFactor = verticalFlip ? -1 : 1
      return {
        width: imgWidth.toString() + 'px',
        height: imgHeight.toString() + 'px',
        transform: `translate(${xFactor * imgX * scale}px, ${yFactor * imgY * scale}px) scaleX(${horizontalFlip ? -1 : 1}) scaleY(${verticalFlip ? -1 : 1}) scale(${scale})`
      }
    },
    getImgDimension(): number {
      const { srcObj } = this.config
      const { imgWidth, imgHeight } = this.config.styles
      return ImageUtils.getSrcSize(srcObj, ImageUtils.getSignificantDimension(imgWidth, imgHeight) * (this.scaleRatio / 100))
    },
    getPreviewSize(): number {
      const sizeMap = this.imgSizeMap as Array<{ [key: string]: number | string }>
      return ImageUtils
        .getSrcSize(this.config.srcObj, sizeMap.flatMap(e => e.key === 'tiny' ? [e.size] : [])[0] as number || 150)
    },
    isAdjustImage(): boolean {
      const { styles: { adjust = {} } } = this.config
      const arr = Object.entries(adjust).filter(([_, v]) => typeof v === 'number' && v !== 0)
      return arr.length !== 0 && !(arr.length === 1 && arr[0][0] === 'halation')
    },
    hasHalation(): boolean {
      return this.config.styles.adjust.halation
    },
    showCanvas(): boolean {
      const { pageIndex, layerIndex, subLayerIndex, handleId } = this
      if (typeof pageIndex === 'undefined') {
        return false
      }
      const isCurrShadowEffectApplied = this.currentShadowEffect !== ShadowEffectType.none
      const isHandling = handleId.pageId === pageUtils.getPage(pageIndex).id && (() => {
        if (subLayerIndex !== -1 && typeof subLayerIndex !== 'undefined') {
          const primaryLayer = layerUtils.getLayer(pageIndex, layerIndex) as IGroup
          return primaryLayer.id === handleId.layerId && primaryLayer.layers[subLayerIndex].id === handleId.subLayerId
        } else {
          return layerUtils.getLayer(pageIndex, layerIndex).id === handleId.layerId
        }
      })()
      return isCurrShadowEffectApplied && isHandling
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
    inProcess(): boolean {
      return this.config.inProcess
    },
    // uploadingImagePreviewSrc(): string {
    //   return this.config.previewSrc
    // },
    finalSrc(): string {
      if (this.$route.name === 'Preview') {
        return ImageUtils.appendCompQueryForVivipic(this.src)
      }
      return this.src
    },
    parentLayerDimension(): number {
      const { width, height } = this.config.parentLayerStyles || {}
      const { imgWidth, imgHeight } = this.config.styles
      const imgRatio = imgWidth / imgHeight
      const maxSize = imgRatio > 1 ? height * imgRatio : width / imgRatio
      return ImageUtils.getSrcSize(this.config.srcObj, maxSize * (this.scaleRatio / 100))
    },
    shadowSrc(): string {
      if (!this.shadow || !this.shadow.srcObj) {
        return ''
      }
      return ImageUtils.getSrc(this.shadow.srcObj, ImageUtils.getSrcSize(this.shadow.srcObj, this.getImgDimension))
    },
    id(): ILayerIdentifier {
      return {
        pageId: pageUtils.getPage(this.pageIndex).id,
        layerId: typeof this.layerIndex !== 'undefined' && this.layerIndex !== -1
          ? layerUtils.getLayer(this.pageIndex, this.layerIndex).id : this.config.id,
        subLayerId: this.config.id
      }
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
    onError() {
      this.isOnError = true
      let updater
      const { srcObj, styles: { width, height } } = this.config
      if (ImageUtils.getSrcSize(srcObj, Math.max(width, height)) === 'xtra') {
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
      }

      if (updater !== undefined) {
        try {
          updater().then(() => {
            this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
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
    onLoad() {
      this.isOnError = false
    },
    onLoadShadow() {
      this.isOnError = false
      const shadowImg = this.$refs['shadow-img'] as HTMLImageElement
      if (!shadowImg.width || !shadowImg.height) {
        console.log('onloadShadow')
        imageShadowUtils.updateShadowSrc(this.layerInfo, { type: '', assetId: '', userId: '' })
        imageShadowUtils.setEffect(ShadowEffectType.none, {}, this.layerInfo)
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
    async perviewAsLoading() {
      if (this.config.previewSrc) {
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
        img.onerror = (error) => {
          reject(new Error(`cannot load the current image, src: ${this.src}`))
          fetch(img.src)
            .then(res => {
              const { status, statusText } = res
              this.logImgError(error, 'img src:', img.src, 'fetch result: ' + status + statusText)
            })
            .catch((e) => {
              if (img.src.indexOf('data:image/png;base64') !== 0) {
                this.logImgError(error, 'img src:', img.src, 'fetch result: ' + e)
              }
            })
        }
        img.src = src
      })
    },
    handleDimensionUpdate(newVal = 0, oldVal = 0) {
      const imgElement = this.$refs.img as HTMLImageElement
      const { srcObj, styles: { imgWidth, imgHeight } } = this.config
      const scale = this.config.isFrameImg ? 1 : (this.config.parentLayerStyles?.scale ?? 1)
      const currSize = ImageUtils.getSrcSize(srcObj, Math.max(imgWidth, imgHeight) * (this.scaleRatio / 100) * scale)
      if (!this.isOnError && this.config.previewSrc === undefined) {
        const { type } = this.config.srcObj
        if (type === 'background') return

        imgElement && (imgElement.onload = async () => {
          if (newVal > oldVal) {
            await this.preLoadImg('next', currSize)
            this.preLoadImg('pre', currSize)
          } else {
            await this.preLoadImg('pre', currSize)
            this.preLoadImg('next', currSize)
          }
        })
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, currSize))
      }
    },
    async preLoadImg(preLoadType: 'pre' | 'next', val: number) {
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
        img.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(this.config.srcObj, val, preLoadType)))
      })
    },
    async handleInitLoad() {
      const { type } = this.config.srcObj
      if (this.userId !== 'backendRendering') {
        await this.perviewAsLoading()
        const preImg = new Image()
        preImg.onerror = (error) => {
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
          fetch(preImg.src)
            .then(res => {
              const { status, statusText } = res
              this.logImgError(error, 'img src:', preImg.src, 'fetch result: ' + status + statusText)
            })
            .catch((e) => {
              if (preImg.src.indexOf('data:image/png;base64') !== 0) {
                this.logImgError(error, 'img src:', preImg.src, 'fetch result: ' + e)
              }
            })
        }
        preImg.onload = () => {
          const nextImg = new Image()
          nextImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(this.config.srcObj, this.getImgDimension, 'next')))
        }
        preImg.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config, ImageUtils.getSrcSize(this.config.srcObj, this.getImgDimension, 'pre')))
      } else {
        this.src = ImageUtils.appendOriginQuery(ImageUtils.getSrc(this.config))
      }
    },
    handleShadowInit() {
      if (this.forRender) return
      const { shadow } = this
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
              imageShadowUtils.updateEffectState(this.layerInfo, ShadowEffectType.none)
            }
          }
          break
        case '':
          console.log('handle shadowInit: __', this.isHandling)
          if (!this.isHandling && !this.isProcessing) {
            imageShadowUtils.updateEffectState(this.layerInfo, ShadowEffectType.none)
          }
      }
    },
    handleUploadShadowImg() {
      const { srcObj } = this.shadow
      if (srcObj.type === 'upload' && srcObj.assetId) {
        const uploadData = (this.uploadShadowImgs as Array<IUploadShadowImg>)
          .find((data: IUploadShadowImg) => data.id === srcObj.assetId)
        if (uploadData) {
          imageShadowUtils.updateShadowSrc(this.layerInfo, uploadData.srcObj)
          imageShadowUtils.updateShadowStyles(this.layerInfo, uploadData.styles)
        }
      }
    },
    async handleNewShadowEffect(clearShadowSrc = true) {
      const { canvas, layerInfo, shadowBuff } = this
      if (!canvas || this.isUploadingShadowImg) {
        if (!canvas) {
          imageShadowUtils.setIsProcess(this.layerInfo, false)
          imageShadowUtils.setProcessId()
          imageShadowUtils.setHandleId()
          console.warn('the canvas is undefined')
        }
        return
      }
      clearShadowSrc && this.clearShadowSrc()
      const { currentEffect } = this.shadow
      const hasShadowSrc = this.shadow.srcObj.type && this.shadow.srcObj.type !== 'upload' && this.shadow.srcObj.assetId
      if (currentEffect !== ShadowEffectType.none) {
        const { id } = this
        // imageShadowUtils.setHandleId(id)
        imageShadowUtils.setProcessId(id)
        !hasShadowSrc && imageShadowUtils.setIsProcess(layerInfo, true)
      }

      let img = new Image()
      if (!['unsplash', 'pixels'].includes(this.config.srcObj.type) && !this.shadowBuff.MAXSIZE) {
        const res = await ImageUtils.getImgSize(this.config.srcObj, false)
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
            img.crossOrigin = 'anonymous'
            img.src = ImageUtils.getSrc(this.config,
              ['unsplash', 'pexels'].includes(this.config.srcObj.type) ? CANVAS_SIZE : 'smal') +
              `${this.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
            await new Promise<void>((resolve) => {
              img.onload = async () => {
                this.shadowBuff.canvasShadowImg = img
                const isSVG = await imageShadowPanelUtils.isSVG(img.src, this.config)
                if (isSVG) {
                  imageShadowPanelUtils.svgImageSizeFormatter(img, 510, () => {
                    /** svgImageSizeFormatter change the img src, need to use onload to catch the changed img */
                    img.onload = () => {
                      this.shadowBuff.MAXSIZE = CANVAS_MAX_SIZE
                      resolve()
                    }
                    img.onerror = () => {
                      console.log('img load error')
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
          imageShadowUtils.updateShadowSrc(this.layerInfo, { type: '', assetId: '', userId: '' })
          imageShadowUtils.setProcessId()
          imageShadowUtils.clearLayerData()
          return
      }

      imageShadowUtils.updateEffectProps(this.layerInfo, {
        maxsize: shadowBuff.MAXSIZE,
        middsize: Math.max(img.naturalWidth, img.naturalHeight)
      })

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
        pageId: pageUtils.getPage(this.pageIndex).id,
        drawCanvasW: _drawCanvasW,
        drawCanvasH: _drawCanvasH,
        layerInfo,
        cb: () => {
          this.clearShadowSrc()
          console.log('finish', currentEffect)
        }
      }
      imageShadowUtils.drawingInit(canvas, img, this.config, params)
      switch (currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.frame:
        case ShadowEffectType.blur:
          imageShadowUtils.drawShadow(canvasList, img, this.config, params)
          break
        case ShadowEffectType.imageMatched:
          imageShadowUtils.drawImageMatchedShadow(canvasList, img, this.config, params)
          break
        case ShadowEffectType.floating: {
          imageShadowUtils.drawFloatingShadow(canvasList, img, this.config, params)
          break
        }
      }
    },
    updateShadowEffect(effects: IShadowEffects) {
      const { layerInfo, canvas, shadowBuff } = this
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
        switch (this.currentShadowEffect) {
          case ShadowEffectType.shadow:
          case ShadowEffectType.blur:
          case ShadowEffectType.frame:
            if (shadowBuff.canvasShadowImg as HTMLImageElement) {
              imageShadowUtils.drawShadow(canvasList, shadowBuff.canvasShadowImg as HTMLImageElement, this.config, {
                layerInfo,
                drawCanvasW,
                drawCanvasH,
                cb: () => this.shadow.srcObj.type && this.clearShadowSrc()
              })
            }
            break
          case ShadowEffectType.imageMatched:
            if (shadowBuff.canvasShadowImg as HTMLImageElement) {
              imageShadowUtils.drawImageMatchedShadow(canvasList, shadowBuff.canvasShadowImg as HTMLImageElement, this.config, {
                layerInfo,
                drawCanvasW,
                drawCanvasH,
                cb: () => this.shadow.srcObj.type && this.clearShadowSrc()
              })
            }
            break
          case ShadowEffectType.floating:
            if (shadowBuff.canvasShadowImg as HTMLImageElement) {
              imageShadowUtils.drawFloatingShadow(canvasList, shadowBuff.canvasShadowImg as HTMLImageElement, this.config, {
                layerInfo,
                drawCanvasW,
                drawCanvasH,
                cb: () => this.shadow.srcObj.type && this.clearShadowSrc()
              })
            }
            break
          case ShadowEffectType.none:
            break
          default:
            generalUtils.assertUnreachable(this.currentShadowEffect)
        }
      })
    },
    clearShadowSrc() {
      if (this.handleId.pageId && this.handleId.layerId) {
        imageShadowUtils.updateShadowSrc(this.layerInfo, { type: '', assetId: '', userId: '' })
      }
    },
    redrawShadow() {
      const id = {
        pageId: pageUtils.getPage(this.pageIndex).id,
        layerId: typeof this.layerIndex !== 'undefined' && this.layerIndex !== -1
          ? layerUtils.getLayer(this.pageIndex, this.layerIndex).id : this.config.id,
        subLayerId: this.config.id
      }
      imageShadowUtils.setHandleId(id)
      imageShadowUtils.updateShadowSrc(this.layerInfo, { type: '', assetId: '', userId: '' })
      layerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, { scale: 1 }, this.subLayerIndex)
      groupUtils.deselect()
      groupUtils.select(this.pageIndex, [this.layerIndex])
      if (typeof this.subLayerIndex && this.subLayerIndex !== -1) {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { active: true }, this.subLayerIndex)
      }
      this.$nextTick(() => {
        const primarylayerId = layerUtils.getLayer(this.layerInfo.pageIndex, this.layerInfo.layerIndex).id
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
              imageShadowUtils.updateShadowSrc(this.layerInfo, {
                ...(this.config as IImage).styles.shadow.srcObj,
                // only used to make Vue update the value, this userId is not meaningful
                userId: 'ver=' + generalUtils.generateRandomString(8)
              })
            })
        }
      }
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
    height: 100%;
  }

  &__picture-shadow {
    position: absolute;
    top: 0px;
    left: 0px;
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
