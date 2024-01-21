<template lang="pug">
div(class="nu-layer flex-center"
:class="[inAllPagesMode || isLine ? 'click-disabled' : 'clickable', !config.locked && subLayerIndex === -1 && !isSubLayer ? `nu-layer--p${pageIndex}` : '', primaryLayer?.type === 'frame' && !forRender ? 'transform-origin-0' : '']"
    :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
    :data-p-index="pageIndex"
    :style="layerWrapperStyles"
    :id="`nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}`"
    ref="body")
  //- class="nu-layer"
  //- :id="`nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}`"
  //- ref="body"
  div(class="full-size pos-left"
      :class="{'preserve3D': !isTouchDevice && isMultipleSelect}"
      :style="layerStyles()"
      @pointerdown="onPointerdown"
      @tap="dblTap"
      @contextmenu.prevent
      @click.right.stop="onRightClick($event)"
      @dragenter="dragEnter($event)"
      @dblclick="dblClick($event)")
    div(class="nu-layer__scale full-size pos-left"
        :class="{'preserve3D': !isTouchDevice && isMultipleSelect}" ref="scale"
        :style="scaleStyles()")
      div(class="nu-layer__flip full-size" :class="{'preserve3D': !isTouchDevice && isMultipleSelect}" :style="flipStyles")
          component(:is="`nu-${config.type}`"
            class="transition-none"
            :class="{'preserve3D': !isTouchDevice && isMultipleSelect}"
            :config="config"
            :imgControl="imgControl"
            :contentScaleRatio="contentScaleRatio"
            :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
            :page="page"
            :primaryLayer="primaryLayer"
            :prePrimaryLayerIndex="prePrimaryLayerIndex"
            :forRender="forRender"
            :inPreview="inPreview")
          svg(v-if="showSvgContour"
            class="clip-contour full-size"
            :viewBox="`0 0 ${config.styles.initWidth} ${config.styles.initHeight}`")
            g(v-html="frameClipFormatter(config.clipPath)"
              :style="frameClipStyles")
    div(v-if="showSpinner" class="nu-layer__inProcess")
      square-loading
  div(v-if="isLine" class="nu-layer__line-mover"
    :class="[inAllPagesMode ? 'click-disabled' : 'clickable']"
    :style="lineMoverStyles()"
    ref="lineMover"
    :id="inPreview ? '' : `nu-layer__line-mover_${pageIndex}_${layerIndex}_${subLayerIndex}`"
    @contextmenu.prevent
    @click.right.stop="onRightClick($event)")
</template>

<script lang="ts">
import LazyLoad from '@/components/LazyLoad.vue'
import SquareLoading from '@/components/global/SqureLoading.vue'
import i18n from '@/i18n'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { AllLayerTypes, IFrame, IGroup, IImage, ILayer, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ILayerInfo, LayerType, SidebarPanelType } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import CssConveter from '@/utils/cssConverter'
import doubleTapUtils from '@/utils/doubleTapUtils'
import DragUtils from '@/utils/dragUtils'
import eventUtils, { PanelEvent } from '@/utils/eventUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import MouseUtils from '@/utils/mouseUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
import popupUtils from '@/utils/popupUtils'
import shapeUtils from '@/utils/shapeUtils'
import stepsUtils from '@/utils/stepsUtils'
import SubControllerUtils from '@/utils/subControllerUtils'
import uploadUtils from '@/utils/uploadUtils'
import vuexUtils from '@/utils/vuexUtils'
import { notify } from '@kyvg/vue3-notification'
import Svgpath from 'svgpath'
import { PropType, defineComponent } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  emits: ['onSubDrop'],
  components: {
    SquareLoading,
    LazyLoad
  },
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
    imgControl: {
      type: Boolean
    },
    snapUtils: Object,
    primaryLayer: {
      type: Object as PropType<IGroup | IFrame | ITmp>,
      default: undefined
    },
    isSubLayer: {
      type: Boolean,
      default: false
    },
    inFrame: {
      type: Boolean,
      default: false
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    dataIndex: {
      default: '-1',
      type: String
    },
    forRender: {
      default: false,
      type: Boolean
    },
    // Used by this.$props.prePrimaryLayerIndex in mounted
    // eslint-disable-next-line vue/no-unused-properties
    prePrimaryLayerIndex: {
      default: -1,
      type: Number
    },
    inPreview: {
      default: false,
      type: Boolean
    }
  },
  data() {
    return {
      dragUtils: this.isSubLayer ? new DragUtils(layerUtils.getLayer(this.pageIndex, this.layerIndex).id, this.config.id) : new DragUtils(this.config.id),
      movingUtils: null as unknown as MovingUtils,
      imgBuff: {} as {
        styles: { [key: string]: number | boolean },
        srcObj: { type: string, assetId: string | number, userId: string },
        previewSrc: ''
      },
      hasHandledFrameMouseEnter: false
    }
  },
  mounted() {
    /**
     * Use definedProperty to bind some props of the vue.$props with the movingUtils
     * thus, we are unnecessary to watching these props and update them manually
     */
    const body = this.$refs.body as HTMLElement
    const lineMover = this.$refs.lineMover as HTMLElement
    const props = this.$props
    const layerInfo = {} as ILayerInfo
    Object.defineProperties(layerInfo, {
      pageIndex: {
        get() {
          return props.pageIndex
        }
      },
      layerIndex: {
        get() {
          return props.layerIndex
        }
      },
      subLayerIdx: {
        get() {
          return props.subLayerIndex
        }
      }
    })
    Object.defineProperty(layerInfo, 'prePrimaryLayerIndex', {
      get() {
        return props.prePrimaryLayerIndex
      }
    })
    const _config = { config: this.config }
    Object.defineProperty(_config, 'config', {
      get() {
        return props.config
      }
    })

    const data = {
      _config: _config,
      component: this,
      snapUtils: this.snapUtils,
      layerInfo,
      body
    }

    if (this.subLayerIndex === -1) {
      this.movingUtils = new MovingUtils(data as any)
      const moveStart = (e: PointerEvent) => {
        if (pointerEvtUtils.pointerIds.length <= 1) {
          this.movingUtils.moveStart(e)
        }
      }
      if (this.isLine) {
        lineMover.addEventListener('pointerdown', moveStart)
      } else {
        body.addEventListener('pointerdown', moveStart)
      }
    } else {
      Object.defineProperty(_config, 'primaryLayer', {
        get() {
          return props.primaryLayer
        }
      })
      const subCtrlUtils = new SubControllerUtils(data as any)
      const pointerdown = subCtrlUtils.onPointerdown.bind(subCtrlUtils)
      if (this.isLine) {
        lineMover.addEventListener('pointerdown', pointerdown)
      } else {
        body.addEventListener('pointerdown', pointerdown)
      }
    }
    if (this.primaryLayer && this.primaryLayer.type === LayerType.frame && this.config.type === LayerType.image) {
      body.addEventListener(this.$isTouchDevice() ? 'pointermove' : 'mousemove', this.onFrameMouseMove)
    }
  },
  unmounted() {
    this.movingUtils && this.movingUtils.removeListener()
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState('shadow', ['processId', 'handleId', 'uploadId']),
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapState('mobileEditor', {
      mobilePagePreview: 'mobileAllPageMode',
      isPinchingEditor: 'isPinchingEditor'
    }),
    ...mapState('imgControl', {
      imgCtrlConfig: 'image'
    }),
    ...mapGetters('imgControl', ['isBgImgCtrl', 'isImgCtrl']),
    ...mapGetters('text', ['getDefaultFonts']),
    ...mapGetters({
      lastSelectedLayerIndex: 'getLastSelectedLayerIndex',
      currSubSelectedInfo: 'getCurrSubSelectedInfo',
      currHoveredPageIndex: 'getCurrHoveredPageIndex',
      isProcessImgShadow: 'shadow/isProcessing',
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel',
      isHandleShadow: 'shadow/isHandling',
      renderForPDF: 'user/getRenderForPDF',
      useMobileEditor: 'getUseMobileEditor',
      showPcPagePreivew: 'page/getIsShowPagePreview',
      controllerHidden: 'webView/getControllerHidden',
      layerOffset: 'canvasResize/getLayerOffset'
    }),
    ...vuexUtils.mapGetters('stk', {
      isDuringCopy: false,
    }, {
      isDuringCopy: 'vivisticker/getIsDuringCopy',
    }),
    inAllPagesMode(): boolean {
      return this.mobilePagePreview || this.showPcPagePreivew
    },
    flipStyles(): any {
      if (this.config.type === LayerType.image) {
        return {}
      }
      const { horizontalFlip, verticalFlip } = this.config.styles
      let transform = ''
      if (horizontalFlip) {
        transform += 'scaleX(-1)'
      }
      if (verticalFlip) {
        transform += 'scaleY(-1)'
      }
      if (transform) {
        return { transform }
      } else {
        return {}
      }
    },
    layerWrapperStyles(): any {
      let clipPath
      if (!this.forRender && this.config.clipPath && !this.config.isFrameImg && this.primaryLayer?.type === 'frame') {
        // vvpic mobile and charmix should consider the pageScaleRatio
        const pathScaleRatio = (this.$isPic && this.$isTouchDevice()) || this.$isCm ? this.contentScaleRatio * this.scaleRatio * 0.01 : this.contentScaleRatio
        clipPath = `path('${new Svgpath(this.config.clipPath).scale(pathScaleRatio).toString()}')`
      }

      const pointerEvents = this.getPointerEvents
      const outline = this.outlineStyles()
      const _f = this.contentScaleRatio * (this.$isTouchDevice() ? this.scaleRatio * 0.01 : 1)
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles, pageUtils._3dEnabledPageIndex !== this.pageIndex, _f, { offset: this.layerOffset }),
        {
          outline,
          outlineOffset: `-${1 * (100 / this.scaleRatio) * this.contentScaleRatio}px`,
          willChange: this.config.active && !this.isSubLayer ? 'transform' : '',
          pointerEvents,
          clipPath,
          'mix-blend-mode': this.config.styles.blendMode,
          ...(this.getLayerType === 'shape' && this.$route.name !== 'Preview' && { overflow: 'hidden' }), // solving https://www.notion.so/vivipic/1-43-svg-9de4bd6782614852b503997f7e9256a2?pvs=4
          ...this.transformStyle
        }
      )
      if (this.primaryLayer?.type === 'frame' && this.config.type === 'image') {
        if (this.$isStk) {
          styles.transform += `scale(${this.$store.state.pageScaleRatio / 100})`
        }
        styles.width = `${this.config.styles.width * _f}px`
        styles.height = `${this.config.styles.height * _f}px`
      }
      if (!this.isImgCtrl && !this.inFrame && !this.$isTouchDevice() && !this.useMobileEditor) {
        styles.transform += `translateZ(${this.config.styles.zindex}px)`
      }
      return styles
    },
    showSpinner(): boolean {
      const { config } = this
      const shadow = this.config.styles.shadow
      const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj.type && shadow.srcObj.type !== 'upload'
      const isHandleShadow = config.inProcess === 'imgShadow' && !hasShadowSrc
      const isHandleBgRemove = config.inProcess === 'bgRemove'
      return isHandleBgRemove || isHandleShadow
    },
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    getLayerType(): string {
      return this.config.type
    },
    isLine(): boolean {
      return shapeUtils.isLine(this.config as AllLayerTypes)
    },
    frameClipStyles(): any {
      return {
        fill: '#00000000',
        stroke: this.config?.active ? (this.config.isFrameImg ? '#F10994' : generalUtils.getOutlineColor()) : 'none',
        strokeWidth: `${7 / (this.primaryLayer as IFrame).styles.scale * (100 / this.scaleRatio)}px`
      }
    },
    getPointerEvents(): string {
      switch (this.config.type) {
        case LayerType.image: {
          const controlState = this.$store.state.controlState
          if (controlState.type === 'move' && controlState.phase === 'moving' && controlState.layerInfo.layerIndex === this.layerIndex) {
            return 'none'
          } else return ''
        }
        case LayerType.shape: {
          if (this.primaryLayer && this.primaryLayer.type === LayerType.frame) {
            return 'none'
          }
        }
      }
      return ''
    },
    isOk2HandleFrameMouseEnter(): boolean {
      if (this.prePrimaryLayerIndex !== -1 && layerUtils.getLayer(this.pageIndex, this.prePrimaryLayerIndex).locked) {
        return false
      }
      if (this.config.type !== LayerType.image || this.primaryLayer?.type !== LayerType.frame) {
        return false
      }
      if ((this.primaryLayer ? this.primaryLayer : this.config).locked) {
        return false
      }
      if (layerUtils.layerIndex !== this.layerIndex && imageUtils.isImgControl()) {
        return false
      }
      if ((layerUtils.getCurrLayer as IImage).id === this.uploadId.layerId) {
        return false
      }
      return layerUtils.getCurrLayer.type === LayerType.image && this.isMoving
    },
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    },
    isMultipleSelect(): boolean {
      return (this.currSelectedInfo as ICurrSelectedInfo).layers.length > 1
    },
    showSvgContour(): boolean {
      const { config } = this
      return config.active && config.isFrame && !config.isFrameImg && config.type === 'image' && !this.forRender && this.config.clipPath && !frameUtils.checkIsRect(this.config.clipPath) && !this.isDuringCopy
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      setCurrSidebarPanel: 'SET_currSidebarPanelType',
      setMoving: 'SET_moving',
      setImgConfig: 'imgControl/SET_CONFIG',
      setBgConfig: 'imgControl/SET_BG_CONFIG',
      setCurrDraggedPhoto: 'SET_currDraggedPhoto'
    }),
    frameClipFormatter(clippath: string) {
      return frameUtils.frameClipFormatter(clippath)
    },
    layerStyles(): any {
      switch (this.config.type) {
        case LayerType.shape: {
          return {
            // 'mix-blend-mode': this.config.styles.blendMode,
            ...shapeUtils.isLine(this.config as AllLayerTypes) ? { pointerEvents: 'none' } : {}
          }
        }
      }
    },
    onPointerdown() {
      if (this.subLayerIndex !== -1 && this.isImgCtrl) {
        imageUtils.setImgControlDefault()
      }
    },
    lineMoverStyles(): { [key: string]: string } {
      if (!this.isLine) return {}
      const { x, y, width, height, rotate } = controlUtils.getControllerStyleParameters(this.config.point, this.config.styles, this.isLine, this.$isTouchDevice(), this.config.size?.[0])
      const { x: layerX, y: layerY } = this.config.styles
      const page = this.page
      const { bleeds } = pageUtils.getPageSizeWithBleeds(page)
      let transform = `translate(${((page.isEnableBleed ? x + bleeds.left : x) - layerX) * this.contentScaleRatio}px, ${((page.isEnableBleed ? y + bleeds.top : y) - layerY) * this.contentScaleRatio}px)`
      if (rotate) {
        transform += ` rotate(${rotate}deg)`
      }
      const isShrinkSizeAsPinchPage = generalUtils.isPic && generalUtils.isTouchDevice()
      return {
        transform,
        width: `${width * this.contentScaleRatio * (isShrinkSizeAsPinchPage ? pageUtils.scaleRatio * 0.01 : 1)}px`,
        height: `${height * this.contentScaleRatio * (isShrinkSizeAsPinchPage ? pageUtils.scaleRatio * 0.01 : 1)}px`
      }
    },
    outlineStyles() {
      if (this.primaryLayer && this.primaryLayer.type === 'tmp') {
        return `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid ${generalUtils.getOutlineColor()}`
      } else {
        return ''
      }
    },
    scaleStyles(): { [index: string]: string } {
      const { scale, scaleX, scaleY, zindex } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config as IFrame))
      const styles = {
        ...(pageUtils._3dEnabledPageIndex === this.pageIndex && { transformStyle: type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d' })
      } as Record<string, string>

      if (!isImgType) {
        const _f = this.contentScaleRatio * (this.$isTouchDevice() ? this.scaleRatio * 0.01 : 1)
        let transform
        if (type === 'text' || (type === 'shape' && this.config.category !== 'D')) {
          transform = `scale(${scale * _f}) ${scaleX !== 1 ? `scaleX(${scaleX})` : ''} ${scaleY !== 1 ? `scaleY(${scaleY})` : ''}`
        } else {
          transform = `scale(${scale}) ${scaleX !== 1 ? `scaleX(${scaleX})` : ''} ${scaleY !== 1 ? `scaleY(${scaleY})` : ''}`
        }
        if (transform !== 'scale(1)') {
          switch (this.config.type) {
            case LayerType.shape: {
              if (this.config.category === 'D') {
                styles.width = `${this.config.styles.initWidth * _f}px`
                styles.height = `${this.config.styles.initHeight * _f}px`
              } else {
                styles.width = `${this.config.styles.initWidth}px`
                styles.height = `${this.config.styles.initHeight}px`
              }
              break
            }
            case LayerType.text: {
              styles.width = `${this.config.styles.width / this.config.styles.scale}px`
              styles.height = `${this.config.styles.height / this.config.styles.scale}px`
              break
            }
            default: {
              styles.width = `${this.config.styles.initWidth * _f}px`
              styles.height = `${this.config.styles.initHeight * _f}px`
            }
          }
          styles.transform = transform
        }
      }
      return styles
    },
    isLocked(): boolean {
      return this.config.locked
    },
    onRightClick(event: MouseEvent) {
      if (this.$isTouchDevice()) {
        // in touch device, right click will be triggered by long click
        event.preventDefault()
        return
      }
      /**
       * If current-selected-layer is exact this layer, record the sub-active-layer.
       * After deselecting, set it to active
       */
      const subLayerIdx = layerUtils.layerIndex === this.layerIndex ? layerUtils.subLayerIdx : -1

      if (this.currSelectedInfo.pageIndex !== this.pageIndex || this.currSelectedInfo.index !== this.layerIndex) {
        groupUtils.deselect()
        groupUtils.select(this.pageIndex, [this.layerIndex])
      }

      if (this.getLayerType === 'frame') {
        if (this.prePrimaryLayerIndex === -1) {
          frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, subLayerIdx, { active: true })
        }
      }
      this.$nextTick(() => {
        popupUtils.openPopup('layer', { event, layerIndex: this.layerIndex })
      })
    },
    dblTap(e: PointerEvent) {
      doubleTapUtils.click(e, {
        doubleClickCallback: () => {
          if (this.getLayerType !== LayerType.image ||
            this.prePrimaryLayerIndex !== -1 ||
            ['none', 'crop-exclude'].includes(this.$store.state.allowLayerAction )) return

          layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
          if (generalUtils.isCm) {
            eventUtils.emit(PanelEvent.switchTab, 'crop-flip')
          } else {
            eventUtils.emit(PanelEvent.switchTab, 'crop')
          }
        }
      })
    },
    dblClick(e: MouseEvent) {
      e.stopPropagation()
      if (this.isPinchingEditor) return
      const isSubLayer = this.subLayerIndex !== -1
      if (isSubLayer) {
        if (!this.primaryLayer || this.isHandleShadow) return
        let updateSubLayerProps = null as any
        let target = undefined as ILayer | undefined
        switch (this.primaryLayer.type) {
          case LayerType.group:
            target = (this.primaryLayer as IGroup).layers[this.subLayerIndex]
            updateSubLayerProps = layerUtils.updateSubLayerProps
            if (!target.active) {
              return
            }
            break
          case LayerType.frame:
            target = (this.primaryLayer as IFrame).clips[this.subLayerIndex]
            updateSubLayerProps = frameUtils.updateFrameLayerProps
            if (!target.active || (target as IImage).srcObj.type === 'frame') {
              return
            }
            break
          default:
            return
        }
        if (target.type === LayerType.image && !target.inProcess) {
          updateSubLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { imgControl: true })
        }
      } else {
        if (this.getLayerType !== 'image' || this.isLocked()) return
        if (this.currSelectedInfo.index < 0) {
          groupUtils.select(this.pageIndex, [this.layerIndex])
        }
        switch (this.getLayerType) {
          case LayerType.image: {
            const { shadow } = (this.config as IImage).styles
            const needRedrawShadow = shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent
            if (!(this.isHandleShadow && needRedrawShadow)) {
              controlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { imgControl: true })
            }
          }
        }
      }
    },
    onFrameMouseMove(e: MouseEvent | PointerEvent) {
      if (!this.hasHandledFrameMouseEnter && this.isOk2HandleFrameMouseEnter) {
        this.hasHandledFrameMouseEnter = true
        this.handleFrameMouseEnter(e)
      }
    },
    handleFrameMouseEnter(e: MouseEvent | PointerEvent) {
      e.stopPropagation()
      if (this.prePrimaryLayerIndex !== -1 && layerUtils.getLayer(this.pageIndex, this.prePrimaryLayerIndex).locked) {
        return
      }
      const currLayer = layerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image && this.isMoving) {
        const { srcObj, previewSrc } = this.config
        const clips = generalUtils.deepCopy(this.primaryLayer?.clips) as Array<IImage>
        const clip = clips[this.subLayerIndex]

        Object.assign(this.imgBuff, {
          srcObj: {
            ...srcObj
          },
          previewSrc,
          styles: {
            imgX: clip.styles.imgX,
            imgY: clip.styles.imgY,
            imgWidth: clip.styles.imgWidth,
            imgHeight: clip.styles.imgHeight,
            adjust: clip.styles.adjust,
            horizontalFlip: clip.styles.horizontalFlip,
            verticalFlip: clip.styles.verticalFlip
          }
        })

        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          srcObj: { ...currLayer.srcObj },
          ...((currLayer as IImage).previewSrc && { previewSrc: (currLayer as IImage).previewSrc as string })
        }, this.prePrimaryLayerIndex)
        layerUtils.updateLayerStyles(layerUtils.pageIndex, layerUtils.layerIndex, { opacity: 35 })
        layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { isHoveringFrame: true })

        const { imgWidth, imgHeight, imgX, imgY } = MouseUtils
          .clipperHandler(layerUtils.getCurrLayer as IImage, clip.clipPath, clip.styles).styles

        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          adjust: { ...currLayer.styles.adjust },
          imgWidth,
          imgHeight,
          imgX,
          imgY,
          horizontalFlip: this.primaryLayer && layerUtils.getCurrLayer.styles.horizontalFlip !== this.primaryLayer.styles.horizontalFlip,
          verticalFlip: this.primaryLayer && layerUtils.getCurrLayer.styles.verticalFlip !== this.primaryLayer.styles.verticalFlip
        }, this.prePrimaryLayerIndex)
        const body = this.$refs.body as HTMLElement
        body.addEventListener(this.$isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
        body.addEventListener(this.$isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
      }
    },
    onFrameMouseLeave(e: MouseEvent | PointerEvent) {
      this.hasHandledFrameMouseEnter = false
      if (this.currDraggedPhoto.srcObj.type !== '') return
      if (this.config.type !== LayerType.image || this.primaryLayer?.type !== LayerType.frame) {
        return
      }
      e.stopPropagation()
      const currLayer = layerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image && this.isMoving) {
        layerUtils.updateLayerStyles(layerUtils.pageIndex, layerUtils.layerIndex, { opacity: 100 })
        layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { isHoveringFrame: false })
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          srcObj: { ...this.imgBuff.srcObj }
        }, this.prePrimaryLayerIndex)

        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          ...this.imgBuff.styles
        }, this.prePrimaryLayerIndex)
      }
      const body = this.$refs.body as HTMLElement
      body.removeEventListener(this.$isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
      body.removeEventListener(this.$isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
    },
    onFrameMouseUp(e: MouseEvent) {
      this.hasHandledFrameMouseEnter = false
      if (this.currDraggedPhoto.srcObj.type !== '') return
      const currLayer = layerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image) {
        layerUtils.deleteLayer(layerUtils.pageIndex, layerUtils.layerIndex)
        const newIndex = this.layerIndex > layerUtils.layerIndex ? this.layerIndex - 1 : this.layerIndex
        groupUtils.set(this.pageIndex, newIndex, [this.primaryLayer as IFrame])
        frameUtils.updateFrameLayerProps(this.pageIndex, newIndex, this.subLayerIndex, { active: true }, this.prePrimaryLayerIndex)
        stepsUtils.record()
      }
      const body = this.$refs.body as HTMLElement
      body.removeEventListener(this.$isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
      body.removeEventListener(this.$isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
    },
    dragEnter(e: DragEvent) {
      if (this.primaryLayer && this.primaryLayer.type) {
        return this.onFrameDragEnter(e)
      }
      this.onLayerDragEnter(e)
    },
    onFrameDragEnter(e: DragEvent) {
      if (!e.target || !['IMG', 'image'].includes((e.target as HTMLElement).tagName)) return
      if (this.config.type !== LayerType.image) return
      if (this.prePrimaryLayerIndex !== -1 && layerUtils.getLayer(this.pageIndex, this.prePrimaryLayerIndex).locked) return

      const { primaryLayer } = this
      if (primaryLayer && !primaryLayer.locked) {
        const body = this.$refs.body as HTMLElement
        body.addEventListener('dragleave', this.onFrameDragLeave)
        body.addEventListener('drop', this.onFrameDrop)
        e.stopPropagation()

        if (this.currDraggedPhoto.srcObj.type !== '' && !this.currDraggedPhoto.isPreview) {
          const clips = generalUtils.deepCopy(primaryLayer.clips) as Array<IImage>
          const clip = clips[this.subLayerIndex]
          Object.assign(this.imgBuff, {
            srcObj: {
              ...clips[this.subLayerIndex].srcObj
            },
            previewSrc: clips[this.subLayerIndex].previewSrc,
            styles: {
              imgX: clip.styles.imgX,
              imgY: clip.styles.imgY,
              imgWidth: clip.styles.imgWidth,
              imgHeight: clip.styles.imgHeight,
              adjust: clip.styles.adjust,
              horizontalFlip: clip.styles.horizontalFlip,
              verticalFlip: clip.styles.verticalFlip
            }
          })
          frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.currDraggedPhoto.srcObj, this.prePrimaryLayerIndex)
          frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { previewSrc: this.currDraggedPhoto.previewSrc }, this.prePrimaryLayerIndex)

          Object.assign(clip.srcObj, this.currDraggedPhoto.srcObj)
          const { imgWidth, imgHeight, imgX, imgY } = MouseUtils
            .clipperHandler(this.currDraggedPhoto, clip.clipPath, clip.styles).styles

          frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
            imgWidth,
            imgHeight,
            imgX,
            imgY,
            horizontalFlip: this.primaryLayer && this.primaryLayer.styles.horizontalFlip,
            verticalFlip: this.primaryLayer && this.primaryLayer.styles.verticalFlip
          }, this.prePrimaryLayerIndex)
        }
      }
    },
    onFrameDragLeave(e: DragEvent) {
      if (!e.target || !['IMG', 'image'].includes((e.target as HTMLElement).tagName)) return
      e.stopPropagation()
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.onFrameDragLeave)
      body.removeEventListener('drop', this.onFrameDrop)
      const primaryLayer = this.primaryLayer as IFrame
      if (this.currDraggedPhoto.srcObj.type !== '' && !primaryLayer.locked) {
        frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.srcObj, this.prePrimaryLayerIndex)
        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.styles, this.prePrimaryLayerIndex)
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { previewSrc: this.imgBuff.previewSrc }, this.prePrimaryLayerIndex)
      }
    },
    onFrameDrop(e: DragEvent) {
      e.stopPropagation()
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.onFrameDragLeave)
      body.removeEventListener('drop', this.onFrameDrop)
      stepsUtils.record()
      this.setCurrDraggedPhoto({
        srcObj: {
          type: '',
          assetId: '',
          userId: ''
        }
      })
      if (this.primaryLayer?.locked) {
        this.$emit('onSubDrop', { e })
      }
    },
    onLayerDragEnter(e: DragEvent) {
      if (!e.target || !['IMG', 'image'].includes((e.target as HTMLElement).tagName)) return
      const body = this.$refs.body as HTMLElement
      const dragSrcObj = this.$store.state.currDraggedPhoto.srcObj
      if (this.getLayerType === 'image' && dragSrcObj.assetId !== this.config.srcObj.assetId) {
        body.addEventListener('dragleave', this.layerDragLeave)
        body.addEventListener('drop', this.layerOnDrop)
        const shadow = (this.config as IImage).styles.shadow
        const shadowEffectNeedRedraw = shadow.isTransparent || shadow.currentEffect === ShadowEffectType.imageMatched
        const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj?.type && shadow.srcObj?.type !== 'upload'
        const handleWithNoCanvas = this.config.inProcess === 'imgShadow' && !hasShadowSrc
        if (!handleWithNoCanvas && (!this.isHandleShadow || (this.handleId.layerId !== this.config.id && !shadowEffectNeedRedraw))) {
          this.dragUtils.onImageDragEnter(e, this.pageIndex, this.config as IImage)
        } else {
          notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          body.removeEventListener('dragleave', this.layerDragLeave)
          body.removeEventListener('drop', this.layerOnDrop)
        }
      }
    },
    layerDragLeave(e: DragEvent) {
      if (!e.target || !['IMG', 'image'].includes((e.target as HTMLElement).tagName)) return
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.layerDragLeave)
      body.removeEventListener('drop', this.layerOnDrop)
      if (this.getLayerType === 'image') {
        this.dragUtils.onImageDragLeave(e, this.pageIndex)
      }
    },
    layerOnDrop(e: DragEvent) {
      e.stopPropagation()
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('dragleave', this.layerDragLeave)
      body.removeEventListener('drop', this.layerOnDrop)

      const dt = e.dataTransfer
      if (e.dataTransfer?.getData('data')) {
        if (!this.currDraggedPhoto.srcObj.type || this.getLayerType !== 'image') {
          this.dragUtils.itemOnDrop(e, this.pageIndex)
        }
      } else if (dt && dt.files.length !== 0) {
        const files = dt.files
        this.setCurrSidebarPanel(SidebarPanelType.file)
        uploadUtils.uploadAsset('image', files, {
          addToPage: true
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-layer {
  touch-action: none;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  &:focus {
    background-color: rgba(168, 218, 220, 1);
  }
  &__line-mover {
    touch-action: none;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0;
    height: 0;
    // pointer-events: initial;
  }
  &__BG {
    position: absolute;
    left: 0;
  }
  &__inProcess {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: setColor(gray-1, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__scale {
    transform-origin: top left;
    transform-origin: 0 0;
  }
  &__flip {
    transition: transform 0.2s linear;
  }
}

.clickable {
  pointer-events: initial;
}

.img-shadow-effect {
  position: absolute;
  pointer-events: none;
  display: block;
  border-radius: 100px/50px;
}

.test-index {
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 18px;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 5px setColor(blue-1);
  z-index: 100;
}

.test-angle {
  width: 100%;
  position: absolute;
  bottom: -80px;
  font-size: 18px;
  color: white;
  font-weight: bold;
  text-shadow: 2px 2px 5px setColor(blue-1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.clip-contour {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pos-left {
  position: absolute;
  left: 0;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
