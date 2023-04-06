<template lang="pug">
div(class="nu-sub-controller")
  div(class="nu-sub-controller__wrapper" :style="positionStyles()")
    div(class="nu-sub-controller__wrapper" :style="wrapperStyles")
      div(class="nu-sub-controller__content"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles")
          div(v-if="config.type === 'text' && config.active"
            class="text text__wrapper" :style="textWrapperStyle()" draggable="false"
            @pointerdown="onPointerdown")
            nu-text-editor(:initText="textHtml()" :id="`text-sub-${primaryLayerIndex}-${layerIndex}`"
              :style="textBodyStyle()"
              :pageIndex="pageIndex"
              :page="page"
              :layerIndex="primaryLayerIndex"
              :config="(config as IText)"
              :primaryLayer="primaryLayer"
              :subLayerIndex="layerIndex"
              @keydown.37.stop
              @keydown.38.stop
              @keydown.39.stop
              @keydown.40.stop
              @keydown.ctrl.67.exact.stop.self
              @keydown.meta.67.exact.stop.self
              @keydown.ctrl.86.exact.stop.self
              @keydown.meta.86.exact.stop.self
              @keydown.ctrl.88.exact.stop.self
              @keydown.meta.88.exact.stop.self
              @keydown.ctrl.65.exact.stop.self
              @keydown.meta.65.exact.stop.self
              @keydown.ctrl.90.exact.stop.self
              @keydown.meta.90.exact.stop.self
              @keydown.ctrl.shift.90.exact.stop.self
              @keydown.meta.shift.90.exact.stop.self
              @update="handleTextChange"
              @compositionend="handleTextCompositionEnd")
</template>

<script lang="ts">
import NuTextEditor from '@/components/editor/global/NuTextEditor.vue'
import i18n from '@/i18n'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IGroup, IImage, ILayer, IParagraph, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ILayerInfo, LayerType } from '@/store/types'
import colorUtils from '@/utils/colorUtils'
import ControlUtils from '@/utils/controlUtils'
import CssConveter from '@/utils/cssConverter'
import DragUtils from '@/utils/dragUtils'
import eventUtils, { ImageEvent } from '@/utils/eventUtils'
import FrameUtils from '@/utils/frameUtils'
import GeneralUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import imageUtils from '@/utils/imageUtils'
import LayerUtils from '@/utils/layerUtils'
import MappingUtils from '@/utils/mappingUtils'
import MouseUtils from '@/utils/mouseUtils'
import pageUtils from '@/utils/pageUtils'
import popupUtils from '@/utils/popupUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import StepsUtils from '@/utils/stepsUtils'
import SubCtrlUtils from '@/utils/subControllerUtils'
import textShapeUtils from '@/utils/textShapeUtils'
import TextUtils from '@/utils/textUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import { notify } from '@kyvg/vue3-notification'
import SvgPath from 'svgpath'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations, mapState } from 'vuex'

export default defineComponent({
  props: {
    config: {
      type: Object,
      required: true
    },
    layerIndex: {
      type: Number,
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
    primaryLayerIndex: {
      type: Number,
      required: true
    },
    primaryLayer: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    isMoved: {
      type: Boolean,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    },
    primaryLayerZindex: {
      default: 0,
      type: Number
    }
  },
  components: {
    NuTextEditor
  },
  emits: ['pointerDownSubController', 'clickSubController', 'dblSubController', 'onSubDrop'],
  data() {
    return {
      MappingUtils,
      FrameUtils,
      subLayerCtrlUtils: null as unknown as SubCtrlUtils,
      ShortcutUtils,
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      isComposing: false,
      layerSizeBuff: -1,
      posDiff: { x: 0, y: 0 },
      parentId: '',
      imgBuff: {} as {
        styles: { [key: string]: number | boolean },
        srcObj: { type: string, assetId: string | number, userId: string },
        panelPreviewSrc: ''
      },
      dragUtils: new DragUtils(this.primaryLayer.id, this.config.id),
      isPrimaryActive: false,
      dblTapFlag: false
    }
  },
  mounted() {
    const body = this.$refs.body as HTMLElement
    if (body) {
      const props = this.$props
      const layerInfo = { } as ILayerInfo
      Object.defineProperty(layerInfo, 'pageIndex', {
        get() {
          return props.pageIndex
        }
      })
      Object.defineProperty(layerInfo, 'layerIndex', {
        get() {
          return props.primaryLayerIndex
        }
      })
      Object.defineProperty(layerInfo, 'subLayerIdx', {
        get() {
          return props.layerIndex
        }
      })
      const _config = {
        config: { active: false },
        primaryLayer: {}
      } as { config: ILayer, primaryLayer: ITmp | IGroup | IFrame }
      Object.defineProperty(_config, 'config', {
        get() {
          return props.config
        }
      })
      Object.defineProperty(_config, 'primaryLayer', {
        get() {
          return props.primaryLayer
        }
      })
      this.subLayerCtrlUtils = new SubCtrlUtils({
        layerInfo,
        _config,
        body
      })
      /**
       * Prevent the context menu from showing up when right click or Ctrl + left click on controller
       */
      body.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault()
      }, false)
      this.setLastSelectedLayerIndex(this.layerIndex)
      this.parentId = this.primaryLayer.id as string

      if (this.type === LayerType.frame && this.config.type === LayerType.image) {
        body.addEventListener(this.$isTouchDevice() ? 'pointerenter' : 'mouseenter', this.onFrameMouseEnter)
      }

      if (this.config.type === LayerType.text) {
        LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          editing: true
        })
        TextUtils.setCurrTextInfo({
          config: this.config as IText,
          subLayerIndex: this.layerIndex
        })
      }
    }
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    ...mapState('shadow', ['processId', 'handleId', 'uploadId']),
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType',
      isProcessShadow: 'shadow/isProcessing',
      isUploadImgShadow: 'shadow/isUploading',
      isHandleShadow: 'shadow/isHandling',
      inMultiSelectionMode: 'mobileEditor/getInMultiSelectionMode'
    }),
    wrapperStyles(): any {
      const scale = this.primaryLayer.styles.scale
      return {
        transformOrigin: '0px 0px',
        transform: `scale(${this.type === 'frame' && !FrameUtils.isImageFrame(this.primaryLayer as IFrame) ? scale : 1})`,
        ...this.transformStyle,
        outline: this.outlineStyles(),
        ...this.sizeStyle(),
        ...(this.type === 'frame' && (() => {
          const { styles: { width, height }, clipPath } = this.config
          if (this.config.isFrameImg) {
            return { clipPath: `path("M0,0h${width}v${height}h${-width}z")` }
          } else {
            return { clipPath: clipPath !== undefined ? `path('${new SvgPath(clipPath).scale(this.contentScaleRatio).toString()}')` : clipPath }
          }
        })())
      }
    },
    styles(): any {
      const { isFrameImg } = this.config
      const zindex = this.type === 'group' ? this.config?.active ? this.getPrimaryLayerSubLayerNum : this.primaryLayerZindex : this.config.styles.zindex

      return {
        ...this.sizeStyle(),
        transform: `${this.type === 'frame' && !isFrameImg ? `scale(${1 / this.contentScaleRatio})` : ''} ${this.enalble3dTransform ? `translateZ(${zindex}px` : ''})`,
      }
    },
    isCurveText(): boolean {
      return this.checkIfCurve(this.config as IText)
    },
    isFlipped(): boolean {
      return this.config.styles.horizontalFlip || this.config.styles.verticalFlip
    },
    isTextEditing(): boolean {
      return !this.isControlling && this.config?.active
    },
    getPrimaryLayerSubLayerNum(): number {
      return (this.primaryLayer as IGroup | ITmp).layers.length
    },
    enalble3dTransform(): boolean {
      return this.pageIndex === pageUtils._3dEnabledPageIndex
    },
    transformStyle(): { [index: string]: string } {
      return {
        transformStyle: this.enalble3dTransform ? 'preserve-3d' : 'initial'
      }
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isTextEditing(editing) {
      if (this.config.type === 'text') {
        LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing })
      }
    },
    isComposing(val) {
      if (!val) {
        this.layerSizeBuff = this.config.styles.writingMode.includes('vertical')
          ? this.config.styles.width : this.config.styles.height
      } else {
        this.layerSizeBuff = -1
      }
    },
    'config.contentEditable'(newVal) {
      if (this.config.type !== 'text') return
      if (this.config.active) {
        if (!newVal) {
          tiptapUtils.agent(editor => !editor.isDestroyed && editor.commands.selectAll())
        }
        tiptapUtils.agent(editor => {
          editor.setEditable(newVal)
        })
      }
      !this.$isTouchDevice() && StepsUtils.updateHead(LayerUtils.pageIndex, LayerUtils.layerIndex, { contentEditable: newVal }, this.layerIndex)
    }
  },
  unmounted() {
    // the condition indicates the primaryLayer transform from group-layer to tmp-layer
    if (this.config.type === 'text') {
      if (this.primaryLayer && this.primaryLayer.id === this.parentId) {
        LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing: false, isTyping: false })
      }
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
        contentEditable: false
      })
      this.isControlling = false

      if (this.currTextInfo.subLayerIndex === this.layerIndex) {
        TextUtils.setCurrTextInfo({
          config: this.primaryLayer as IGroup,
          subLayerIndex: undefined
        })
      }
    }
    popupUtils.closePopup()
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened',
      setCurrDraggedPhoto: 'SET_currDraggedPhoto'
    }),
    isDraggedPanelPhoto(): boolean {
      return this.currDraggedPhoto.srcObj.type !== ''
    },
    textHtml(): any {
      return tiptapUtils.toJSON(this.config.paragraphs)
    },
    frameClipStyles() {
      return {
        fill: '#00000000',
        stroke: this.config?.active ? (this.config.isFrameImg ? '#F10994' : '#7190CC') : 'none',
        strokeWidth: `${(this.config.isFrameImg ? 3 : 7) / this.primaryLayer.styles.scale * (100 / this.scaleRatio)}px`
      }
    },
    textScaleStyle() {
      return {
        position: 'absolute',
        transform: `scaleX(${this.config.styles.scale}) scaleY(${this.config.styles.scale})`
      }
    },
    textWrapperStyle() {
      return {
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        opacity: `${this.config.styles.opacity / 100}`,
        transform: `scaleX(${this.config.styles.scale * this.contentScaleRatio * this.scaleRatio * 0.01}) scaleY(${this.config.styles.scale * this.contentScaleRatio * this.scaleRatio * 0.01})`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode
      }
    },
    textBodyStyle() {
      const returnedStyles = Object.assign({},
        !(this.isCurveText || this.isFlipped) ? {
          width: `${this.config.styles.width / this.config.styles.scale}px`,
          height: `${this.config.styles.height / this.config.styles.scale}px`,
          userSelect: this.config.contentEditable ? 'text' : 'none',
          opacity: 1
        } : {
          width: `${this.config.styles.width / this.config.styles.scale}px`,
          height: `${this.config.styles.height / this.config.styles.scale}px`,
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: this.config.contentEditable ? 1 : 0
        })
      return returnedStyles
    },
    textStyles(styles: any) {
      const textStyles = CssConveter.convertFontStyle(styles)
      Object.assign(textStyles, {
        'caret-color': this.config.contentEditable && !this.isControlling ? '' : '#00000000'
      })
      return textStyles
    },
    groupControllerStyle() {
      return {
        width: `${this.config.styles.width / this.config.styles.scale}px`,
        height: `${this.config.styles.height / this.config.styles.scale}px`,
        position: 'absolute',
        transform: `scaleX(${this.config.styles.scale}) scaleY(${this.config.styles.scale})`
      }
    },
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    onPointerdown(e: PointerEvent) {
      // const
      // e.stopPropagation()
      this.subLayerCtrlUtils.onPointerdown(e)
    },
    onMouseup(e: PointerEvent) {
      e.stopPropagation()
      if (this.config.type === 'text') {
        this.posDiff.x = this.primaryLayer.styles.x - this.posDiff.x
        this.posDiff.y = this.primaryLayer.styles.y - this.posDiff.y
        if (this.posDiff.x !== 0 || this.posDiff.y !== 0) {
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: false })
        } else {
          if (this.config.contentEditable) {
            LayerUtils.updateLayerProps(this.pageIndex, this.primaryLayerIndex, { isTyping: true }, this.layerIndex)
            if (this.$isTouchDevice()) {
              tiptapUtils.focus({ scrollIntoView: false }, 'end')
            } else {
              tiptapUtils.focus({ scrollIntoView: false })
            }
          }
        }
      }
      eventUtils.removePointerEvent('pointerup', this.onMouseup)
      this.isControlling = false
      this.onClickEvent(e)
    },
    positionStyles(): Record<string, string> {
      const { horizontalFlip, verticalFlip } = this.primaryLayer.styles
      const _f = this.contentScaleRatio * this.scaleRatio * 0.01
      let { x, y } = this.config.styles

      if (this.type === 'frame' && horizontalFlip) {
        const layerCenterline = this.primaryLayer.styles.width / 2
        const subLayerCenterline = this.config.styles.x + this.config.styles.width / 2
        x += (layerCenterline - subLayerCenterline) * 2
      }
      if (this.type === 'frame' && verticalFlip) {
        const layerCenterline = this.primaryLayer.styles.height / 2
        const subLayerCenterline = this.config.styles.y + this.config.styles.height / 2
        y += (layerCenterline - subLayerCenterline) * 2
      }

      return {
        transform: `translate(${x * _f}px, ${y * _f}px)` + `rotate(${this.config.styles.rotate}deg)` +
          `scaleX(${horizontalFlip ? -1 : 1})` + `scaleY(${verticalFlip ? -1 : 1})`,
        width: `${this.config.styles.width * _f}px`,
        height: `${this.config.styles.height * _f}px`,
        'pointer-events': 'none',
        ...this.transformStyle
      }
    },
    sizeStyle() {
      const { isFrameImg } = this.config
      const _f = this.contentScaleRatio * this.scaleRatio * 0.01
      let width, height
      if (this.type === 'frame' && !isFrameImg) {
        width = `${this.config.styles.initWidth * _f}px`
        height = `${this.config.styles.initHeight * _f}px`
      } else {
        width = `${this.config.styles.width * _f}px`
        height = `${this.config.styles.height * _f}px`
      }
      return { width, height }
    },
    outlineStyles() {
      const outlineColor = this.config.locked ? '#EB5757' : '#7190CC'
      if (this.config?.active && LayerUtils.getCurrLayer.type !== 'frame') {
        if (this.isControlling) {
          return `${2 / this.primaryLayer.styles.scale}px solid ${outlineColor}`
        } else {
          return `${2 / this.primaryLayer.styles.scale}px solid ${outlineColor}`
        }
      } else {
        return 'none'
      }
    },
    waitFontLoadingAndRecord() {
      const pageId = this.page.id
      const layerId = this.primaryLayer.id
      const subLayerId = this.config.id
      TextUtils.waitFontLoadingAndRecord(this.config.paragraphs, () => {
        const { pageIndex, layerIndex, subLayerIdx } = LayerUtils.getLayerInfoById(pageId, layerId, subLayerId)
        if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
        TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
      })
    },
    waitFontLoadingAndResize() {
      const pageId = this.page.id
      const layerId = this.primaryLayer.id
      const subLayerId = this.config.id
      TextUtils.untilFontLoaded(this.config.paragraphs).then(() => {
        setTimeout(() => {
          const { pageIndex, layerIndex, subLayerIdx } = LayerUtils.getLayerInfoById(pageId, layerId, subLayerId)
          if (layerIndex === -1) return console.log('the layer to update size doesn\'t exist anymore.')
          TextUtils.updateTextLayerSizeByShape(pageIndex, layerIndex, subLayerIdx)
        }, 100)
      })
    },
    checkIfCurve(config: IText): boolean {
      const { textShape } = config.styles
      return textShape && textShape.name === 'curve'
    },
    calcSize(config: IText) {
      this.checkIfCurve(config) ? this.curveTextSizeRefresh(config) : TextUtils.updateGroupLayerSize(this.pageIndex, this.primaryLayerIndex, this.layerIndex)
    },
    handleTextChange(payload: { paragraphs: IParagraph[], isSetContentRequired: boolean, toRecord?: boolean }) {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { paragraphs: payload.paragraphs })
      this.calcSize(this.config as IText)
      if (payload.toRecord) {
        this.waitFontLoadingAndRecord()
      } else {
        this.waitFontLoadingAndResize()
      }
      if (payload.isSetContentRequired && !tiptapUtils.editor?.view?.composing) {
        // if composing starts from empty line, isSetContentRequired will be true in the first typing.
        // However, setContent will break the composing, so skip setContent when composing.
        // setContent will be done when 'composeend' (in NuTextEditor.vue)
        this.$nextTick(() => {
          tiptapUtils.agent(editor => {
            editor.chain().setContent(tiptapUtils.toJSON(payload.paragraphs)).selectPrevious().run()
          })
        })
      }
    },
    handleTextCompositionEnd(toRecord: boolean) {
      if (toRecord) {
        this.waitFontLoadingAndRecord()
      }
    },
    curveTextSizeRefresh(text: IText) {
      const { height: heightOri } = text.styles
      const curveTextHW = textShapeUtils.getCurveTextHW(text)
      LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, textShapeUtils.getCurveTextPropsByHW(text, curveTextHW))
      TextUtils.asSubLayerSizeRefresh(this.pageIndex, this.primaryLayerIndex, this.layerIndex, curveTextHW.areaHeight, heightOri)
      TextUtils.fixGroupCoordinates(this.pageIndex, this.primaryLayerIndex)
    },
    onClickEvent(e: MouseEvent) {
      if (!this.isPrimaryActive) return

      colorUtils.event.emit('closeColorPanel', false)
      this.$emit('clickSubController', this.layerIndex, this.config.type, GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey]))
    },
    onDblClick(e: MouseEvent) {
      if (this.type === 'tmp') {
        return
      }
      this.$emit('dblSubController', e, this.layerIndex)
    },
    onDragEnter(e: DragEvent) {
      const body = this.$refs.body as HTMLElement
      body.addEventListener('drop', this.onDrop)
      switch (this.type) {
        case 'frame':
          if (this.config.type === 'image') {
            this.onFrameDragEnter(e)
            body.addEventListener('dragleave', this.onFrameDragLeave)
          }
          return
        case 'group':
          if (this.config.type === 'image') {
            const shadow = (this.config as IImage).styles.shadow
            const shadowEffectNeedRedraw = shadow.isTransparent || shadow.currentEffect === ShadowEffectType.imageMatched
            const hasShadowSrc = shadow && shadow.srcObj && shadow.srcObj.type && shadow.srcObj.type !== 'upload'
            const handleWithNoCanvas = this.config.inProcess === 'imgShadow' && !hasShadowSrc
            if (!handleWithNoCanvas && (!this.isHandleShadow || (this.handleId.subLayerId !== this.config.id && !shadowEffectNeedRedraw))) {
              this.dragUtils.onImageDragEnter(e, this.pageIndex, this.config as IImage)
              body.addEventListener('dragleave', this.onDragLeave)
            } else {
              notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
              body.removeEventListener('drop', this.onDrop)
            }
          }
      }
    },
    onDragLeave(e: DragEvent) {
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('drop', this.onDrop)
      switch (this.type) {
        case 'frame':
          if (this.config.type === 'image') {
            this.onFrameDragLeave(e)
            body.removeEventListener('dragleave', this.onFrameDragLeave)
          }
          return
        case 'group':
          // if (this.config.type === 'image' && !this.isUploadImgShadow) {
          if (this.config.type === 'image') {
            this.dragUtils.onImageDragLeave(e, this.pageIndex)
            body.removeEventListener('dragleave', this.onDragLeave)
          }
      }
    },
    onDrop(e: DragEvent) {
      const body = this.$refs.body as HTMLElement
      body.removeEventListener('drop', this.onDrop)
      e.stopPropagation()
      if (e.dataTransfer?.getData('data') && !this.currDraggedPhoto.srcObj.type) {
        this.dragUtils.itemOnDrop(e, this.pageIndex)
      }

      if (!this.currDraggedPhoto.srcObj.type) {
        // Propagated to NuController.vue onDrop()
      } else {
        switch (this.type) {
          case 'frame':
            if (this.config.type === 'image') {
              body.removeEventListener('dragleave', this.onFrameDragLeave)
              this.onFrameDrop(e)
            }
            return
          case 'group':
            if (this.config.type === 'image') {
              if (!this.isHandleShadow) {
                groupUtils.deselect()
                groupUtils.select(this.pageIndex, [this.primaryLayerIndex])
                LayerUtils.updateLayerProps(this.pageIndex, this.primaryLayerIndex, { active: true }, this.layerIndex)
                eventUtils.emit(ImageEvent.redrawCanvasShadow + this.config.id)
              } else {
                const replacedImg = new Image()
                replacedImg.crossOrigin = 'anonynous'
                replacedImg.onload = () => {
                  const isTransparent = imageShadowUtils.isTransparentBg(replacedImg)
                  const layerInfo = { pageIndex: this.pageIndex, layerIndex: this.primaryLayerIndex, subLayerIdx: this.layerIndex }
                  imageShadowUtils.updateEffectProps(layerInfo, { isTransparent })
                }
                const size = ['unsplash', 'pexels'].includes(this.config.srcObj.type) ? 150 : 'prev'
                replacedImg.src = imageUtils.getSrc(this.config, size)
              }
              body.removeEventListener('dragleave', this.onDragLeave)
            }
        }
      }
    },
    onFrameDragEnter(e: DragEvent) {
      const { primaryLayer } = this
      if (!primaryLayer.locked) {
        e.stopPropagation()
        if (this.isDraggedPanelPhoto() && !this.currDraggedPhoto.isPreview) {
          const clips = GeneralUtils.deepCopy(primaryLayer.clips) as Array<IImage>
          const clip = clips[this.layerIndex]

          Object.assign(this.imgBuff, {
            srcObj: {
              ...clips[this.layerIndex].srcObj
            },
            panelPreviewSrc: clips[this.layerIndex].panelPreviewSrc,
            styles: {
              imgX: clip.styles.imgX,
              imgY: clip.styles.imgY,
              imgWidth: clip.styles.imgWidth,
              imgHeight: clip.styles.imgHeight,
              adjust: clip.styles.adjust
            }
          })
          FrameUtils.updateFrameClipSrc(this.pageIndex, this.primaryLayerIndex, this.layerIndex, this.currDraggedPhoto.srcObj)
          FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { panelPreviewSrc: this.currDraggedPhoto.panelPreviewSrc })

          Object.assign(clip.srcObj, this.currDraggedPhoto.srcObj)
          const { imgWidth, imgHeight, imgX, imgY } = MouseUtils
            .clipperHandler(this.currDraggedPhoto, clip.clipPath, clip.styles).styles

          FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
            imgWidth,
            imgHeight,
            imgX,
            imgY
          })
        }
      }
    },
    onFrameDragLeave(e: DragEvent) {
      e.stopPropagation()
      const primaryLayer = this.primaryLayer as IFrame
      if (this.isDraggedPanelPhoto() && !primaryLayer.locked) {
        FrameUtils.updateFrameClipSrc(this.pageIndex, this.primaryLayerIndex, this.layerIndex, this.imgBuff.srcObj)
        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, this.imgBuff.styles)
        FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { panelPreviewSrc: this.imgBuff.panelPreviewSrc })
      }
    },
    onFrameDrop(e: DragEvent) {
      e.stopPropagation()
      StepsUtils.record()
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
    undo() {
      ShortcutUtils.undo().then(() => {
        LayerUtils.updateLayerProps(this.pageIndex, this.primaryLayerIndex, { active: true })
        LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { active: true })
        setTimeout(() => TextUtils.focus({ pIndex: 0, sIndex: 0, offset: 0 }, TextUtils.getNullSel(), this.layerIndex), 0)
      })
    },
    onFrameMouseEnter(e: MouseEvent) {
      if (this.config.type !== LayerType.image || this.type !== LayerType.frame) {
        return
      }
      if (LayerUtils.layerIndex !== this.layerIndex && imageUtils.isImgControl()) {
        return
      }
      if (this.primaryLayer.locked && !this.isDraggedPanelPhoto()) {
        return
      }
      if ((LayerUtils.getCurrLayer as IImage).id === this.uploadId.layerId) {
        return
      }
      e.stopPropagation()
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image && this.isMoving && (currLayer as IImage).previewSrc === undefined) {
        const { srcObj, panelPreviewSrc } = this.config
        const clips = GeneralUtils.deepCopy(this.primaryLayer.clips) as Array<IImage>
        const clip = clips[this.layerIndex]

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
            // horizontalFlip: clip.styles.horizontalFlip,
            // verticalFlip: clip.styles.verticalFlip
          }
        })

        FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          srcObj: { ...currLayer.srcObj },
          ...((currLayer as IImage).panelPreviewSrc && { panelPreviewSrc: (currLayer as IImage).panelPreviewSrc as string })
        })
        LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { opacity: 35 })
        LayerUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { isHoveringFrame: true })

        const { imgWidth, imgHeight, imgX, imgY } = MouseUtils
          .clipperHandler(LayerUtils.getCurrLayer as IImage, clip.clipPath, clip.styles).styles

        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
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
    onFrameMouseLeave(e: MouseEvent) {
      if (this.isDraggedPanelPhoto()) return
      if (this.config.type !== LayerType.image || this.type !== LayerType.frame) {
        return
      }
      e.stopPropagation()
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image && this.isMoving) {
        LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { opacity: 100 })
        LayerUtils.updateLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, { isHoveringFrame: false })
        FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          srcObj: { ...this.imgBuff.srcObj }
        })

        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          ...this.imgBuff.styles
        })
      }
      const body = this.$refs.body as HTMLElement
      body.removeEventListener(this.$isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
      body.removeEventListener(this.$isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
    },
    onFrameMouseUp(e: MouseEvent) {
      if (this.isDraggedPanelPhoto()) return
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === LayerType.image) {
        LayerUtils.deleteLayer(LayerUtils.pageIndex, LayerUtils.layerIndex)
        const newIndex = this.primaryLayerIndex > LayerUtils.layerIndex ? this.primaryLayerIndex - 1 : this.primaryLayerIndex
        groupUtils.set(this.pageIndex, newIndex, [this.primaryLayer as IFrame])
        FrameUtils.updateFrameLayerProps(this.pageIndex, newIndex, this.layerIndex, { active: true })
        StepsUtils.record()
      }
      const body = this.$refs.body as HTMLElement
      body.removeEventListener(this.$isTouchDevice() ? 'pointerup' : 'mouseup', this.onFrameMouseUp)
      body.removeEventListener(this.$isTouchDevice() ? 'pointerleave' : 'mouseleave', this.onFrameMouseLeave)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-sub-controller {
  touch-action: none;
  &__wrapper {
    top: 0;
    left: 0;
    position: absolute;
    touch-action: none;
  }
  &__content {
    pointer-events: none;

    touch-action: none;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    transform-origin: top left;
  }

  &__lock-icon {
    @include size(30px, 30px);
    @include flexCenter;
    position: absolute;
    right: -15px;
    bottom: -15px;
    border: 1px solid setColor(red);
    border-radius: 50%;
    background-color: setColor(white);
  }
}

.text {
  p {
    margin: 0;
  }
  span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  &__wrapper {
    position: relative;
    pointer-events: initial;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
  }
  &__body {
    outline: none;
    padding: 0;
    position: relative;
  }
}

.text-content {
  text-align: left;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
