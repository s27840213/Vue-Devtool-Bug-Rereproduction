<template lang="pug">
div(class="nu-layer"
    :class="[inAllPagesMode ? 'click-disabled' : '', !config.locked && subLayerIndex === -1 && !isSubLayer ? `nu-layer--p${pageIndex}` : '']"
    :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
    :style="layerWrapperStyles"
    :id="`nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}`"
    ref="body")
  //- class="nu-layer"
  //- :id="div.main ? `nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}` : ''"
  //- :ref="div.main ? 'body' : ''"
  div(v-for="div in layerDivs"
      class="full-size"
      :style="layerStyles(div.noShadow, div.isTransparent)"
      @pointerdown="div.main ? onPointerDown($event) : null"
      @pointerup="div.main ? onPointerUp($event) : null"
      @contextmenu.prevent
      @click.right.stop="div.main ? onRightClick($event) : null"
      @dragenter="div.main ? dragEnter($event) : null"
      @dblclick="div.main ? dblClick($event) : null")
    div(class="full-size"
        :class="{'nu-layer__scale': applyLayerScale}" :ref="div.main ? 'scale' : ''"
        :style="scaleStyles()")
      div(class="nu-layer__flip full-size" :style="flipStyles")
          component(:is="`nu-${config.type}`"
            class="transition-none"
            :config="config"
            :imgControl="imgControl"
            :contentScaleRatio="contentScaleRatio"
            :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
            :page="page"
            :scaleRatio="scaleRatio"
            :primaryLayer="primaryLayer"
            :forRender="forRender"
            :isTransparent="div.isTransparent"
            :noShadow="div.noShadow")
          svg(v-if="config.isFrame && !config.isFrameImg && config.type === 'image' && config.active && !forRender"
            class="clip-contour full-size"
            :viewBox="`0 0 ${config.styles.initWidth} ${config.styles.initHeight}`")
            g(v-html="frameClipFormatter(config.clipPath)"
              :style="frameClipStyles")
    div(v-if="showSpinner" class="nu-layer__inProcess")
      square-loading
  div(v-if="isLine" class="nu-layer__line-mover"
    :style="lineMoverStyles()"
    ref="lineMover"
    :id="`nu-layer__line-mover_${pageIndex}_${layerIndex}_${subLayerIndex}`")
</template>

<script lang="ts">
import SquareLoading from '@/components/global/SqureLoading.vue'
import LazyLoad from '@/components/LazyLoad.vue'
import i18n from '@/i18n'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IGroup, IImage, ILayer, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ILayerInfo, LayerType, SidebarPanelType } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import CssConveter from '@/utils/cssConverter'
import DragUtils from '@/utils/dragUtils'
import editorUtils from '@/utils/editorUtils'
import eventUtils, { ImageEvent } from '@/utils/eventUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import mathUtils from '@/utils/mathUtils'
import MouseUtils from '@/utils/mouseUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import SubControllerUtils from '@/utils/subControllerUtils'
import textBgUtils from '@/utils/textBgUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import uploadUtils from '@/utils/uploadUtils'
import { AnyTouchEvent } from '@any-touch/shared'
import { notify } from '@kyvg/vue3-notification'
import Svgpath from 'svgpath'
import { defineComponent, PropType } from 'vue'
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
    dataPindex: {
      default: '-1',
      type: String
    },
    inTmp: {
      type: Boolean,
      default: false
    },
    primaryScale: {
      type: Number,
      default: 1
    },
    lazyLoadTarget: {
      default: '.editor-view',
      type: String
    },
    forceRender: {
      default: true,
      type: Boolean
    },
    forRender: {
      default: false,
      type: Boolean
    },
    handleUnrender: {
      default: false,
      type: Boolean
    }
    /**
     * @Note Vuex Props
    //  */
    // currSelectedInfo: Object as PropType<ICurrSelectedInfo>,
    // scaleRatio: Number,
    // getCurrFunctionPanelType: Number,
    // isUploadingShadowImg: Boolean,
    // isHandling: Boolean,
    // isShowPagePanel: Boolean,
    // imgSizeMap: Array as PropType<Array<{ [key: string]: string | number }>>,
    // userId: String,
    // verUni: String,
    // uploadId: Object as PropType<ILayerIdentifier>,
    // handleId: Object as PropType<ILayerIdentifier>,
    // uploadShadowImgs: Array as PropType<Array<IUploadShadowImg>>
  },
  data() {
    return {
      LayerType,
      eventTarget: null as unknown as HTMLElement,
      dblTabsFlag: false,
      initPos: { x: 0, y: 0 },
      movingByControlPoint: false,
      isControlling: false,
      isDoingGestureAction: false,
      isHandleMovingHandler: false,
      isMoved: false,
      isPointerDownFromSubController: false,
      dragUtils: this.isSubLayer ? new DragUtils(layerUtils.getLayer(this.pageIndex, this.layerIndex).id, this.config.id) : new DragUtils(this.config.id),
      movingUtils: null as unknown as MovingUtils,
      imgBuff: {} as {
        styles: { [key: string]: number | boolean },
        srcObj: { type: string, assetId: string | number, userId: string },
        panelPreviewSrc: ''
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
    Object.defineProperty(layerInfo, 'pageIndex', {
      get() {
        return props.pageIndex
      }
    })
    Object.defineProperty(layerInfo, 'layerIndex', {
      get() {
        return props.layerIndex
      }
    })
    Object.defineProperty(layerInfo, 'subLayerIdx', {
      get() {
        return props.subLayerIndex
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
      const moveStart = this.movingUtils.moveStart.bind(this.movingUtils)
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
      body.addEventListener(this.$isTouchDevice() ? 'pointerenter' : 'mouseenter', this.onFrameMouseEnter)
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
      inAllPagesMode: 'mobileAllPageMode',
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
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode',
      isProcessImgShadow: 'shadow/isProcessing',
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio',
      currFunctionPanelType: 'getCurrFunctionPanelType',
      isUploadingShadowImg: 'shadow/isUploading',
      isHandling: 'shadow/isHandling',
      isShowPagePanel: 'page/getShowPagePanel',
      isHandleShadow: 'shadow/isHandling',
      renderForPDF: 'user/getRenderForPDF',
      useMobileEditor: 'getUseMobileEditor'
    }),
    applyLayerScale(): boolean {
      const isImg = this.config.type === 'image'
      const isUnscalableShape = this.config.type === 'shape' && ['D', 'E'].includes(this.config.category)
      return !isImg && !isUnscalableShape
    },
    lazyloadSize(): { height: number, width: number } {
      const { config, contentScaleRatio } = this
      switch (config.type) {
        case LayerType.image:
          return {
            width: config.styles.width * contentScaleRatio,
            height: config.styles.height * contentScaleRatio
          }
        default: {
          return {
            width: config.styles.width * contentScaleRatio / config.styles.scale,
            height: config.styles.height * contentScaleRatio / config.styles.scale
          }
        }
      }
    },
    layerInfo(): ILayerInfo {
      return {
        pageIndex: this.pageIndex,
        layerIndex: this.layerIndex
      }
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
      const clipPath = !this.forRender && this.config.clipPath &&
        !this.config.isFrameImg && this.primaryLayer?.type === 'frame'
        ? `path('${new Svgpath(this.config.clipPath).scale(this.contentScaleRatio).toString()}')` : ''
      const pointerEvents = this.getPointerEvents
      const outline = this.outlineStyles()
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles, pageUtils._3dEnabledPageIndex !== this.pageIndex, this.contentScaleRatio),
        {
          outline,
          willChange: !this.isSubLayer && this.isDragging && !this.useMobileEditor ? 'transform' : '',
          pointerEvents,
          clipPath,
          ...this.transformStyle
        }
      )
      if (this.isImgCtrl || this.inFrame || this.$isTouchDevice() || this.useMobileEditor) {
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
    isDragging(): boolean {
      return (this.config as ILayer).dragging
    },
    isActive(): boolean {
      return this.config.active
    },
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    contentEditable(): boolean {
      return this.config.contentEditable
    },
    getLayerType(): string {
      return this.config.type
    },
    isLine(): boolean {
      return this.config.type === 'shape' && this.config.category === 'D'
    },
    frameClipStyles(): any {
      return {
        fill: '#00000000',
        stroke: this.config?.active ? (this.config.isFrameImg ? '#F10994' : '#7190CC') : 'none',
        strokeWidth: `${(this.config.isFrameImg ? 3 : 7) / (this.primaryLayer as IFrame).styles.scale * (100 / this.scaleRatio)}px`
      }
    },
    getPointerEvents(): string {
      const { isControlling } = this.movingUtils ?? {}
      switch (this.config.type) {
        case LayerType.image:
          return isControlling ? 'none' : ''
        case LayerType.shape: {
          if (this.primaryLayer && this.primaryLayer.type === LayerType.frame) {
            return 'none'
          }
        }
      }
      return ''
    },
    layerDivs() {
      if (this.$router.currentRoute.value.name === 'Preview' && this.renderForPDF && this.config.type === 'text') {
        return [
          { noShadow: false, isTransparent: true },
          { noShadow: true, isTransparent: false, main: true }
        ]
      } else {
        return [{ noShadow: false, isTransparent: false, main: true }]
      }
    },
    isOk2HandleFrameMouseEnter(): boolean {
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
    layerStyles(noShadow: boolean, isTransparent: boolean): any {
      switch (this.config.type) {
        case LayerType.text: {
          const textEffectStyles = TextEffectUtils.convertTextEffect(this.config as IText)
          const textBgStyles = textBgUtils.convertTextEffect(this.config.styles)
          if (noShadow) {
            textEffectStyles.textShadow = 'none'
          }
          return {
            willChange: this.useMobileEditor ? '' : ('text-shadow' + (this.isDragging ? ', transform' : '')),
            '--base-stroke': `${textEffectStyles.webkitTextStroke?.split('px')[0] ?? 0}px`,
            ...(isTransparent && { '-webkit-filter': 'opacity(1)' }),
            ...textEffectStyles,
            ...textBgStyles,
          }
        }
        case LayerType.shape: {
          return {
            'mix-blend-mode': this.config.styles.blendMode
          }
        }
      }
    },
    lineMoverStyles(): { [key: string]: string } {
      if (!this.isLine) return {}
      // const { x, y, width, height, rotate } = controlUtils.getControllerStyleParameters(this.config.point, this.config.styles, this.isLine, this.config.size?.[0])
      const { width: lineW, height: lineH, rotate } = controlUtils.getControllerStyleParameters(this.config.point, this.config.styles, this.isLine, this.config.size?.[0])
      const { width, height } = this.config.styles
      const lineLength = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))
      const x = width * 0.5 - lineLength * 0.5
      const y = height * 0.5 - Math.abs(lineH * mathUtils.cos(rotate) * 0.5)
      const page = this.page
      const { bleeds } = pageUtils.getPageSizeWithBleeds(page)
      let transform = `translate(${(page.isEnableBleed ? x + bleeds.left : x) * this.contentScaleRatio}px, ${(page.isEnableBleed ? y + bleeds.top : y) * this.contentScaleRatio}px)`
      if (rotate) {
        transform += ` rotate(${rotate}deg)`
      }
      return {
        transform,
        width: `${lineW * this.contentScaleRatio}px`,
        height: `${lineH * this.contentScaleRatio}px`
      }
    },
    outlineStyles() {
      if (this.primaryLayer && this.primaryLayer.type === 'tmp') {
        return `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid #7190CC`
      } else {
        return ''
      }
    },
    toggleHighlighter(evt: MouseEvent, pageIndex: number, layerIndex: number, shown: boolean) {
      layerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    hasSelectedLayer(): boolean {
      return this.currSelectedInfo.layers.length > 0
    },
    getLayerPos(): { x: number, y: number } {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    subLayerInTmpStyles(layer: ILayer) {
      return (layer.type === 'shape' && layer.category === 'D') ? {} : { outline: this.inTmp ? `${2 / this.primaryScale}px solid #7190CC` : {} }
    },
    pageScaleRatio(): number {
      return pageUtils.scaleRatio / 100
    },
    compensationRatio(): number {
      return Math.max(1, this.pageScaleRatio())
    },
    translateStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config as IFrame))
      const transform = isImgType ? `scale(${1 / (this.compensationRatio())})` : `scale(${1 / (this.compensationRatio())})`
      /**
      * If layer type is group, we need to set its transform-style to flat, or its order will be affect by the inner layer.
      * And if type is tmp and its zindex value is larger than 0 (default is 0, isn't 0 means its value has been reassigned before), we need to set it to flat too.
      */
      return {
        transform,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
    },
    scaleStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { scale, scaleX, scaleY } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config as IFrame))
      let transform = isImgType ? `scale(${this.compensationRatio()})` : `scale(${scale * (this.contentScaleRatio)})`
      if (!isImgType && this.compensationRatio() !== 1 && scaleX !== 1 && scaleY !== 1) {
        transform += `scale(${this.compensationRatio()}) scaleX(${scaleX}) scaleY(${scaleY})`
      }
      const hasActualScale = transform !== 'scale(1)'
      const styles = {
        ...(hasActualScale && {
          width: `${this.config.styles.initWidth}px`,
          height: `${this.config.styles.initHeight}px`,
          transform
        }),
        ...(pageUtils._3dEnabledPageIndex === this.pageIndex && { transformStyle: type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d' })
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
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, subLayerIdx, { active: true })
      }
      this.$nextTick(() => {
        popupUtils.openPopup('layer', { event, layerIndex: this.layerIndex })
      })
    },
    onPress(event: AnyTouchEvent) {
      if (this.primaryLayer && this.primaryLayer.type === 'tmp') {
        return
      }
      const initPos = { x: this.initPos.x, y: this.initPos.y }
      this.initPos.x = -1
      this.initPos.y = -1
      if (this.config.styles.x - initPos.x !== 0 || this.config.styles.y - initPos.y !== 0) {
        return
      }
      if (!this.isActive) {
        groupUtils.deselect()
        groupUtils.select(this.pageIndex, [this.layerIndex])
      }
      if (this.getLayerType === 'text') {
        layerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { editing: false, shown: false, contentEditable: false, isTyping: false })
      }

      this.movingUtils && this.movingUtils.removeListener()
      editorUtils.setInMultiSelectionMode(true)
    },
    onPointerUp(e: PointerEvent) {
      // console.log(e.target)
      // if (this.isImgCtrl && this.imgCtrlConfig.id !== this.config.id) {
      //   imageUtils.setImgControlDefault()
      // }
    },
    onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement
      /**
       * Prevent double clicking of img will propagate and set the img-ctrl to default immediately.
       */
      if (this.isImgCtrl && !['IMG', 'path', 'image'].includes(target.tagName)) {
        imageUtils.setImgControlDefault()
      }
      this.initPos.x = this.config.styles.x
      this.initPos.y = this.config.styles.y
    },
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    dblClick(e: MouseEvent) {
      e.stopPropagation()
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
    onFrameMouseEnter(e: MouseEvent | PointerEvent) {
      if (!this.hasHandledFrameMouseEnter && this.isOk2HandleFrameMouseEnter) {
        this.hasHandledFrameMouseEnter = true
        this.handleFrameMouseEnter(e)
      }
    },
    handleFrameMouseEnter(e: MouseEvent | PointerEvent) {
      e.stopPropagation()
      const currLayer = layerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image && this.isMoving && (currLayer as IImage).previewSrc === undefined) {
        const { srcObj, panelPreviewSrc } = this.config
        const clips = generalUtils.deepCopy(this.primaryLayer?.clips) as Array<IImage>
        const clip = clips[this.subLayerIndex]

        Object.assign(this.imgBuff, {
          srcObj: {
            ...srcObj
          },
          panelPreviewSrc,
          styles: {
            imgX: clip.styles.imgX,
            imgY: clip.styles.imgY,
            imgWidth: clip.styles.imgWidth,
            imgHeight: clip.styles.imgHeight,
            adjust: clip.styles.adjust
          }
        })

        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          srcObj: { ...currLayer.srcObj },
          ...((currLayer as IImage).panelPreviewSrc && { panelPreviewSrc: (currLayer as IImage).panelPreviewSrc as string })
        })
        layerUtils.updateLayerStyles(layerUtils.pageIndex, layerUtils.layerIndex, { opacity: 35 })
        layerUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { isHoveringFrame: true })

        const { imgWidth, imgHeight, imgX, imgY } = MouseUtils
          .clipperHandler(layerUtils.getCurrLayer as IImage, clip.clipPath, clip.styles).styles

        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          adjust: { ...currLayer.styles.adjust },
          imgWidth,
          imgHeight,
          imgX,
          imgY
        })
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
        })

        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
          ...this.imgBuff.styles
        })
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
        frameUtils.updateFrameLayerProps(this.pageIndex, newIndex, this.subLayerIndex, { active: true })
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
      /**
       * use layerUtils.getLayer is bcz the frame may be included in the group
       */
      if (this.config.type !== LayerType.image || layerUtils.getLayer(this.pageIndex, this.layerIndex)?.type !== LayerType.frame) {
        return
      }
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
            panelPreviewSrc: clips[this.subLayerIndex].panelPreviewSrc,
            styles: {
              imgX: clip.styles.imgX,
              imgY: clip.styles.imgY,
              imgWidth: clip.styles.imgWidth,
              imgHeight: clip.styles.imgHeight,
              adjust: clip.styles.adjust
            }
          })
          frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.currDraggedPhoto.srcObj)
          frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { panelPreviewSrc: this.currDraggedPhoto.panelPreviewSrc })

          Object.assign(clip.srcObj, this.currDraggedPhoto.srcObj)
          const { imgWidth, imgHeight, imgX, imgY } = MouseUtils
            .clipperHandler(this.currDraggedPhoto, clip.clipPath, clip.styles).styles

          frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, {
            imgWidth,
            imgHeight,
            imgX,
            imgY
          })
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
        frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.srcObj)
        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.styles)
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { panelPreviewSrc: this.imgBuff.panelPreviewSrc })
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
        } else if (this.getLayerType === 'image') {
          if (this.isHandleShadow) {
            const replacedImg = new Image()
            replacedImg.crossOrigin = 'anonynous'
            replacedImg.onload = () => {
              const isTransparent = imageShadowUtils.isTransparentBg(replacedImg)
              const layerInfo = { pageIndex: this.pageIndex, layerIndex: this.layerIndex }
              imageShadowUtils.updateEffectProps(layerInfo, { isTransparent })
            }
            const size = ['unsplash', 'pexels'].includes(this.config.srcObj.type) ? 150 : 'prev'
            const src = imageUtils.getSrc(this.config, size)
            replacedImg.src = src + `${src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
            // return
          } else {
            eventUtils.emit(ImageEvent.redrawCanvasShadow + this.config.id)
          }
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
  pointer-events: initial;
  // top: 0;
  // left: 0;
  // display: flex;
  // width: 100px;
  // height: 100px;
  align-items: center;
  justify-content: center;
  // content-visibility: auto;
  // box-shadow: inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
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
  }
  &__flip {
    transition: transform 0.2s linear;
  }
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

.spiner {
  animation: rotation 0.5s infinite linear;
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
