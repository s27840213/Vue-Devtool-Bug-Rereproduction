<template lang="pug">
  div
    div(v-for="div in layerDivs"
        class="nu-layer" :class="!config.locked && subLayerIndex === -1 ? `nu-layer--p${pageIndex}` : ''"
        :style="layerStyles(div.noShadow, div.isTransparent)"
        :ref="div.main ? 'body' : null"
        :id="div.main ? `nu-layer_${pageIndex}_${layerIndex}_${subLayerIndex}` : null"
        :data-index="dataIndex === '-1' ? `${subLayerIndex}` : dataIndex"
        :data-p-index="pageIndex"
        v-press="isTouchDevice() && div.main ? onPress : -1"
        @pointerdown="div.main ? onPointerDown($event) : null"
        @pointerup="div.main ? onPointerUp($event) : null"
        @contextmenu.prevent
        @click.right.stop="div.main ? onRightClick($event) : null"
        @dragenter="div.main ? dragEnter($event) : null"
        @dblclick="div.main ? dblClick($event) : null")
      div(class="layer-translate posAbs"
          :style="translateStyles()")
        div(class="layer-scale posAbs" :ref="div.main ? 'scale' : null"
            :style="scaleStyles()")
          nu-clipper(:config="config"
              :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
              :imgControl="imgControl" :contentScaleRatio="contentScaleRatio")
            lazy-load(:target="lazyLoadTarget"
                :rootMargin="'300px 0px 300px 0px'"
                :minHeight="lazyloadSize.height"
                :minWidth="lazyloadSize.width"
                :threshold="[0]"
                :handleUnrender="handleUnrender"
                :anamationEnabled="false"
                :forceRender="isSubLayer || forceRender")
              component(:is="`nu-${config.type}`"
                class="transition-none"
                :config="config"
                :imgControl="imgControl"
                :contentScaleRatio="contentScaleRatio"
                :pageIndex="pageIndex" :layerIndex="layerIndex" :subLayerIndex="subLayerIndex"
                :scaleRatio="scaleRatio"
                :isPagePreview="isPagePreview"
                :forRender="forRender"
                :isTransparent="div.isTransparent"
                :noShadow="div.noShadow"
                v-bind="$attrs")
          svg(class="clip-contour full-width" v-if="config.isFrame && !config.isFrameImg && config.type === 'image' && config.active && !forRender"
            :viewBox="`0 0 ${config.styles.initWidth} ${config.styles.initHeight}`")
            g(v-html="frameClipFormatter(config.clipPath)"
              :style="frameClipStyles")
      div(v-if="showSpinner()" class="nu-layer__inProcess")
        square-loading
</template>

<script lang="ts">
import Vue from 'vue'
import { ILayerInfo, LayerType, SidebarPanelType } from '@/store/types'
import CssConveter from '@/utils/cssConverter'
import MouseUtils from '@/utils/mouseUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import textBgUtils from '@/utils/textBgUtils'
import layerUtils from '@/utils/layerUtils'
import SquareLoading from '@/components/global/SqureLoading.vue'
import frameUtils from '@/utils/frameUtils'
import { mapGetters, mapMutations, mapState } from 'vuex'
import pageUtils from '@/utils/pageUtils'
import { IFrame, IGroup, IImage, ILayer } from '@/interfaces/layer'
import LazyLoad from '@/components/LazyLoad.vue'
import SubControllerUtils from '@/utils/subControllerUtils'
import generalUtils from '@/utils/generalUtils'
import { MovingUtils } from '@/utils/movingUtils'
import DragUtils from '@/utils/dragUtils'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import i18n from '@/i18n'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import eventUtils, { ImageEvent } from '@/utils/eventUtils'
import uploadUtils from '@/utils/uploadUtils'
import groupUtils from '@/utils/groupUtils'
import controlUtils from '@/utils/controlUtils'
import { AnyTouchEvent } from '@any-touch/shared'
import editorUtils from '@/utils/editorUtils'
import popupUtils from '@/utils/popupUtils'
import stepsUtils from '@/utils/stepsUtils'
import Svgpath from 'svgpath'

export default Vue.extend({
  inheritAttrs: false,
  components: {
    SquareLoading,
    LazyLoad
  },
  props: {
    config: Object,
    pageIndex: Number,
    layerIndex: Number,
    imgControl: Boolean,
    snapUtils: Object,
    primaryLayer: {
      type: Object,
      default: undefined
    },
    subLayerIndex: {
      type: Number,
      default: -1
    },
    isSubLayer: {
      type: Boolean,
      default: false
    },
    isFrame: {
      type: Boolean,
      default: false
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    isPagePreview: {
      default: false,
      type: Boolean
    },
    'data-index': {
      default: '-1',
      type: String
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
      }
    }
  },
  mounted() {
    /**
     * Use definedProperty to bind some props of the vue.$props with the movingUtils
     * thus, we are unnecessary to watching these props and update them manually
     */
    const body = (this.$refs.body as HTMLElement[])[0]
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
      this.movingUtils = new MovingUtils(data)
      const moveStart = this.movingUtils.moveStart.bind(this.movingUtils)
      body.addEventListener('pointerdown', moveStart)
    } else {
      const subCtrlUtils = new SubControllerUtils(data)
      const pointerdown = subCtrlUtils.onPointerdown.bind(subCtrlUtils)
      body.addEventListener('pointerdown', pointerdown)
    }
    if (this.primaryLayer && this.primaryLayer.type === LayerType.frame && this.config.type === LayerType.image) {
      body.addEventListener(generalUtils.isTouchDevice() ? 'pointerenter' : 'mouseenter', this.onFrameMouseEnter)
    }
  },
  destroyed() {
    this.movingUtils && this.movingUtils.removeListener()
  },
  computed: {
    ...mapState('text', ['sel', 'props']),
    ...mapState('shadow', ['processId', 'handleId', 'uploadId']),
    ...mapState(['isMoving', 'currDraggedPhoto']),
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
      renderForPDF: 'user/getRenderForPDF'
    }),
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
        strokeWidth: `${(this.config.isFrameImg ? 3 : 7) / this.primaryLayer.styles.scale * (100 / this.scaleRatio)}px`
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
      if (this.$router.currentRoute.name === 'Preview' && this.renderForPDF && this.config.type === 'text') {
        return [
          { noShadow: false, isTransparent: true },
          { noShadow: true, isTransparent: false, main: true }
        ]
      } else {
        return [{ noShadow: false, isTransparent: false, main: true }]
      }
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
      const clipPath = !this.forRender && this.config.clipPath &&
        !this.config.isFrameImg && this.primaryLayer?.type === 'frame'
        ? `path('${new Svgpath(this.config.clipPath).scale(this.contentScaleRatio).toString()}')` : ''
      const pointerEvents = this.getPointerEvents
      const outline = this.outlineStyles()
      const styles = Object.assign(
        CssConveter.convertDefaultStyle(this.config.styles, pageUtils._3dEnabledPageIndex !== this.pageIndex, this.contentScaleRatio),
        {
          outline,
          willChange: !this.isSubLayer && this.isDragging ? 'transform' : '',
          pointerEvents,
          clipPath
        }
      )
      switch (this.config.type) {
        case LayerType.text: {
          const textEffectStyles = TextEffectUtils.convertTextEffect(this.config)
          const textBgStyles = textBgUtils.convertTextEffect(this.config.styles)
          Object.assign(
            styles,
            textEffectStyles,
            textBgStyles,
            {
              willChange: 'text-shadow' + (this.isDragging ? ', transform' : ''),
              '--base-stroke': `${textEffectStyles.webkitTextStroke?.split('px')[0] ?? 0}px`
            }
          )
          if (noShadow) {
            styles.textShadow = 'none'
          }
          if (isTransparent) {
            styles['-webkit-filter'] = 'opacity(1)'
          }
          break
        }
        case LayerType.shape: {
          Object.assign(
            styles,
            { 'mix-blend-mode': this.config.styles.blendMode }
          )
        }
      }
      return styles
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
    pageScaleRatio(): number {
      return pageUtils.scaleRatio / 100
    },
    compensationRatio(): number {
      return Math.max(1, this.pageScaleRatio())
    },
    showSpinner(): boolean {
      const { config } = this
      const shadow = this.config.styles.shadow
      const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj.type && shadow.srcObj.type !== 'upload'
      const isHandleShadow = config.inProcess === 'imgShadow' && !hasShadowSrc
      const isHandleBgRemove = config.inProcess === 'bgRemove'
      return isHandleBgRemove || isHandleShadow
    },
    isTouchDevice(): boolean {
      return generalUtils.isTouchDevice()
    },
    translateStyles(): { [index: string]: string } {
      const { zindex } = this.config.styles
      const { type } = this.config
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config))
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
      const isImgType = type === LayerType.image || (type === LayerType.frame && frameUtils.isImageFrame(this.config))

      const styles = {
        transform: isImgType ? `scale(${this.compensationRatio()})` : `scale(${scale * (this.contentScaleRatio)}) scale(${this.compensationRatio()}) scaleX(${scaleX}) scaleY(${scaleY})`,
        'transform-style': pageUtils._3dEnabledPageIndex !== this.pageIndex ? 'initial' : type === 'group' || this.config.isFrame ? 'flat' : (type === 'tmp' && zindex > 0) ? 'flat' : 'preserve-3d'
      }
      return styles
    },
    isLocked(): boolean {
      return this.config.locked
    },
    onRightClick(event: MouseEvent) {
      if (this.isTouchDevice()) {
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
      if (this.isImgCtrl && !['IMG', 'path'].includes(target.tagName)) {
        imageUtils.setImgControlDefault()
      }
      this.initPos.x = this.config.styles.x
      this.initPos.y = this.config.styles.y
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
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
          case LayerType.image:
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
    onFrameMouseEnter(e: MouseEvent) {
      if (this.config.type !== LayerType.image || this.primaryLayer.type !== LayerType.frame) {
        return
      }
      if (layerUtils.layerIndex !== this.layerIndex && imageUtils.isImgControl()) {
        return
      }
      if (layerUtils.getLayer(this.pageIndex, this.layerIndex).locked && this.currDraggedPhoto.srcObj.type === '') {
        return
      }
      if ((layerUtils.getCurrLayer as IImage).id === this.uploadId.layerId) {
        return
      }
      e.stopPropagation()
      const currLayer = layerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image && this.isMoving && (currLayer as IImage).previewSrc === undefined) {
        const { srcObj, panelPreviewSrc } = this.config
        const clips = generalUtils.deepCopy(this.primaryLayer.clips) as Array<IImage>
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
        const body = (this.$refs.body as HTMLElement[])[0]
        body.addEventListener(generalUtils.isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
        body.addEventListener(generalUtils.isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
      }
    },
    onFrameMouseLeave(e: MouseEvent) {
      if (this.currDraggedPhoto.srcObj.type !== '') return
      if (this.config.type !== LayerType.image || this.primaryLayer.type !== LayerType.frame) {
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
      const body = (this.$refs.body as HTMLElement[])[0]
      body.removeEventListener(generalUtils.isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
      body.removeEventListener(generalUtils.isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
    },
    onFrameMouseUp(e: MouseEvent) {
      if (this.currDraggedPhoto.srcObj.type !== '') return
      const currLayer = layerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image) {
        layerUtils.deleteLayer(layerUtils.pageIndex, layerUtils.layerIndex)
        const newIndex = this.layerIndex > layerUtils.layerIndex ? this.layerIndex - 1 : this.layerIndex
        groupUtils.set(this.pageIndex, newIndex, [this.primaryLayer])
        frameUtils.updateFrameLayerProps(this.pageIndex, newIndex, this.subLayerIndex, { active: true })
        stepsUtils.record()
      }
      const body = (this.$refs.body as HTMLElement[])[0]
      body.removeEventListener(generalUtils.isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
      body.removeEventListener(generalUtils.isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
    },
    dragEnter(e: DragEvent) {
      if (this.primaryLayer && this.primaryLayer.type) {
        return this.onFrameDragEnter(e)
      }
      this.onLayerDragEnter(e)
    },
    onFrameDragEnter(e: DragEvent) {
      if (!e.target || (e.target as HTMLElement).tagName !== 'IMG') return
      if (this.config.type !== LayerType.image || this.primaryLayer.type !== LayerType.frame) {
        return
      }
      const { primaryLayer } = this
      if (!primaryLayer.locked) {
        const body = (this.$refs.body as HTMLElement[])[0]
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
      if (!e.target || (e.target as HTMLElement).tagName !== 'IMG') return
      e.stopPropagation()
      const body = (this.$refs.body as HTMLElement[])[0]
      body.removeEventListener('dragleave', this.onFrameDragLeave)
      body.removeEventListener('drop', this.onFrameDrop)
      const primaryLayer = layerUtils.getLayer(this.pageIndex, this.layerIndex) as IFrame
      if (this.currDraggedPhoto.srcObj.type !== '' && !primaryLayer.locked) {
        frameUtils.updateFrameClipSrc(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.srcObj)
        frameUtils.updateFrameLayerStyles(this.pageIndex, this.layerIndex, this.subLayerIndex, this.imgBuff.styles)
        frameUtils.updateFrameLayerProps(this.pageIndex, this.layerIndex, this.subLayerIndex, { panelPreviewSrc: this.imgBuff.panelPreviewSrc })
      }
    },
    onFrameDrop(e: DragEvent) {
      e.stopPropagation()
      const body = (this.$refs.body as HTMLElement[])[0]
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
      if (this.primaryLayer.locked) {
        this.$emit('onSubDrop', { e })
      }
    },
    onLayerDragEnter(e: DragEvent) {
      if (!e.target || (e.target as HTMLElement).tagName !== 'IMG') return
      const body = (this.$refs.body as HTMLElement[])[0]
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
          Vue.notify({ group: 'copy', text: `${i18n.t('NN0665')}` })
          body.removeEventListener('dragleave', this.layerDragLeave)
          body.removeEventListener('drop', this.layerOnDrop)
        }
      }
    },
    layerDragLeave(e: DragEvent) {
      if (!e.target || (e.target as HTMLElement).tagName !== 'IMG') return
      const body = (this.$refs.body as HTMLElement[])[0]
      body.removeEventListener('dragleave', this.layerDragLeave)
      body.removeEventListener('drop', this.layerOnDrop)
      if (this.getLayerType === 'image') {
        this.dragUtils.onImageDragLeave(e, this.pageIndex)
      }
    },
    layerOnDrop(e: DragEvent) {
      e.stopPropagation()
      const body = (this.$refs.body as HTMLElement[])[0]
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
        // GroupUtils.deselect()
        // this.setLastSelectedLayerIndex(this.layerIndex)
        // GroupUtils.select(this.pageIndex, [this.layerIndex])
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
  // content-visibility: auto;
  // box-shadow: inset 0px 0px 0px 7px rgba(136, 136, 136, 0.5);
  width: 100px;
  height: 100px;
  &:focus {
    background-color: rgba(168, 218, 220, 1);
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
}

.img-shadow-effect {
  position: absolute;
  pointer-events: none;
  display: block;
  border-radius: 100px/50px;
}

.posAbs {
  position: absolute;
  transform-origin: top left;
  top: 0;
  left: 0;
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
