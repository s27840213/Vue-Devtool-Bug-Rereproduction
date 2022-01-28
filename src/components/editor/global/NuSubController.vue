<template lang="pug">
  div(class="nu-sub-controller")
    div(class="nu-sub-controller__wrapper" :style="positionStyles()")
      div(class="nu-sub-controller__wrapper" :style="wrapperStyles()")
        div(class="nu-sub-controller__content"
            ref="body"
            :layer-index="`${layerIndex}`"
            :style="styles('')"
            @dblclick="onDblClick()"
            @click.left.stop="onClickEvent($event)"
            @drop="onDrop($event)"
            @dragenter="onDragEnter($event)"
            @dragleave="onDragLeave($event)"
            @mouseenter="onFrameMouseEnter($event)"
            @mouseleave="onFrameMouseLeave($event)"
            @mouseup="onFrameMouseUp($event)"
            @mousedown="onMousedown($event)")
          svg(class="full-width" v-if="config.type === 'image' && (config.isFrame || config.isFrameImg)"
            :viewBox="`0 0 ${config.isFrameImg ? config.styles.width : config.styles.initWidth} ${config.isFrameImg ? config.styles.height : config.styles.initHeight}`")
            g(v-html="!config.isFrameImg ? FrameUtils.frameClipFormatter(config.clipPath) : `<path d='M0,0h${config.styles.width}v${config.styles.height}h${-config.styles.width}z'></path>`"
              :style="frameClipStyles()")
          template(v-if="config.type === 'text' && config.active")
            div(class="text text__wrapper" :style="textWrapperStyle()" draggable="false")
              nu-text-editor(:initText="textHtml" :id="`text-sub-${primaryLayerIndex}-${layerIndex}`"
                :style="textBodyStyle()"
                :pageIndex="pageIndex"
                :layerIndex="primaryLayerIndex"
                :subLayerIndex="layerIndex"
                @keydown.native.37.stop
                @keydown.native.38.stop
                @keydown.native.39.stop
                @keydown.native.40.stop
                @keydown.native.ctrl.67.exact.stop.self
                @keydown.native.meta.67.exact.stop.self
                @keydown.native.ctrl.86.exact.stop.self
                @keydown.native.meta.86.exact.stop.self
                @keydown.native.ctrl.65.exact.stop.self
                @keydown.native.meta.65.exact.stop.self
                @keydown.native.ctrl.90.exact.stop.self
                @keydown.native.meta.90.exact.stop.self
                @keydown.native.ctrl.shift.90.exact.stop.self
                @keydown.native.meta.shift.90.exact.stop.self
                @update="handleTextChange")
</template>
<script lang="ts">
import Vue from 'vue'
import { mapState, mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IFrame, IGroup, IImage, IImageStyle, IParagraph, IText } from '@/interfaces/layer'
import { IControlPoints } from '@/interfaces/controller'
import MappingUtils from '@/utils/mappingUtils'
import TextUtils from '@/utils/textUtils'
import TextEffectUtils from '@/utils/textEffectUtils'
import StepsUtils from '@/utils/stepsUtils'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import FrameUtils from '@/utils/frameUtils'
import ShortcutUtils from '@/utils/shortcutUtils'
import { FunctionPanelType, PopupSliderEventType } from '@/store/types'
import popupUtils from '@/utils/popupUtils'
import tiptapUtils from '@/utils/tiptapUtils'
import DragUtils from '@/utils/dragUtils'
import NuTextEditor from '@/components/editor/global/NuTextEditor.vue'
import imageUtils from '@/utils/imageUtils'
import formatUtils from '@/utils/formatUtils'
import textShapeUtils from '@/utils/textShapeUtils'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    primaryLayerIndex: Number,
    snapUtils: Object,
    type: String,
    isMoved: Boolean
  },
  components: {
    NuTextEditor
  },
  data() {
    return {
      MappingUtils,
      FrameUtils,
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
        cached: boolean
      },
      dragUitls: new DragUtils(this.primaryLayerIndex, this.layerIndex),
      isPrimaryActive: false
    }
  },
  mounted() {
    const body = this.$refs.body as HTMLElement
    /**
     * Prevent the context menu from showing up when right click or Ctrl + left click on controller
     */
    body.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
    }, false)
    this.setLastSelectedLayerIndex(this.layerIndex)
    this.parentId = this.getPrimaryLayer.id as string
  },
  computed: {
    ...mapState('text', ['sel', 'props', 'currTextInfo']),
    ...mapState(['isMoving', 'currDraggedPhoto']),
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo',
      getCurrFunctionPanelType: 'getCurrFunctionPanelType'
    }),
    getLayerPos(): ICoordinate {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    getLayerType(): string {
      return this.config.type
    },
    getControlPoints(): IControlPoints {
      return this.config.controlPoints
    },
    isActive(): boolean {
      return this.config.active
    },
    isLocked(): boolean {
      return this.config.locked
    },
    isTextEditing(): boolean {
      return !this.isControlling
    },
    getLayerWidth(): number {
      return this.config.styles.width
    },
    getLayerHeight(): number {
      return this.config.styles.height
    },
    getLayerRotate(): number {
      return this.config.styles.rotate
    },
    getLayerScale(): number {
      return this.config.styles.scale
    },
    getPrimaryLayer(): IGroup | IFrame {
      return LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex) as IGroup | IFrame
    },
    textHtml(): any {
      return tiptapUtils.toJSON(this.config.paragraphs)
    },
    contentEditable(): boolean {
      return this.config.contentEditable
    },
    isCurveText(): any {
      const { textShape } = this.config.styles
      return textShape && textShape.name === 'curve'
    },
    primaryScale(): number {
      return LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex).styles.scale
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isActive(val) {
      if (val) {
        // @todo
        if (this.getCurrFunctionPanelType === FunctionPanelType.colorPicker && this.getLayerType === 'shape') {
          // colorUtils.setCurrColor(this.getColors[index])
        }
      }
      if (!val) {
        this.setLastSelectedLayerIndex(this.primaryLayerIndex)
        if (this.getLayerType === 'text') {
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
            editing: false,
            isTyping: false
          })
          this.isControlling = false

          if (this.currTextInfo.subLayerIndex === this.layerIndex) {
            TextUtils.setCurrTextInfo({
              config: LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex) as IGroup,
              subLayerIndex: undefined
            })
          }
        }
        popupUtils.closePopup()
      } else {
        TextUtils.setCurrTextInfo({
          config: this.config as IText,
          subLayerIndex: this.layerIndex
        })
      }
      TextUtils.updateSelection(TextUtils.getNullSel(), TextUtils.getNullSel())
    },
    isTextEditing(editing) {
      // if (this.getLayerType === 'text') {
      //   LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing })
      //   if (editing && !this.config.isEdited) {
      //     // ShortcutUtils.textSelectAll(this.layerIndex)
      //   }
      // }
    },
    isComposing(val) {
      if (!val) {
        this.layerSizeBuff = this.config.styles.writingMode.includes('vertical')
          ? this.getLayerWidth : this.getLayerHeight
      } else {
        this.layerSizeBuff = -1
      }
    },
    contentEditable(newVal) {
      tiptapUtils.agent(editor => editor.setEditable(newVal))
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: newVal })
    }
  },
  destroyed() {
    // the condition indicates the primaryLayer transform from group-layer to tmp-layer
    if (this.getLayerType === 'text' && this.getPrimaryLayer && this.getPrimaryLayer.id === this.parentId) {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { editing: false })
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: false })
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened'
    }),
    frameClipStyles() {
      return {
        fill: '#00000000',
        stroke: this.isActive ? (this.config.isFrameImg ? '#F10994' : '#7190CC') : 'none',
        strokeWidth: `${(this.config.isFrameImg ? 3 : 7) / this.primaryScale * (100 / this.scaleRatio)}px`
      }
    },
    textScaleStyle() {
      return {
        position: 'absolute',
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    textWrapperStyle() {
      return {
        width: `${this.getLayerWidth / this.getLayerScale}px`,
        height: `${this.getLayerHeight / this.getLayerScale}px`,
        opacity: `${this.config.styles.opacity / 100}`,
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`,
        textAlign: this.config.styles.align,
        writingMode: this.config.styles.writingMode
      }
    },
    textBodyStyle() {
      const isVertical = this.config.styles.writingMode.includes('vertical')
      return {
        width: `${this.getLayerWidth / this.getLayerScale}px`,
        height: `${this.getLayerHeight / this.getLayerScale}px`,
        userSelect: this.contentEditable ? 'text' : 'none',
        opacity: this.isTextEditing ? (this.isCurveText && !this.contentEditable ? 0 : 1) : 0
      }
    },
    textStyles(styles: any) {
      const textStyles = CssConveter.convertFontStyle(styles)
      Object.assign(textStyles, {
        'caret-color': this.contentEditable && !this.isControlling ? '' : '#00000000'
      })
      return textStyles
    },
    groupControllerStyle() {
      return {
        width: `${this.config.styles.width / this.getLayerScale}px`,
        height: `${this.config.styles.height / this.getLayerScale}px`,
        position: 'absolute',
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    onMousedown(e: MouseEvent) {
      this.isPrimaryActive = this.getPrimaryLayer.active

      formatUtils.applyFormatIfCopied(this.pageIndex, this.primaryLayerIndex, this.layerIndex)
      formatUtils.clearCopiedFormat()
      if (this.type === 'tmp') return
      if (this.getLayerType === 'text') {
        this.posDiff.x = this.getPrimaryLayer.styles.x
        this.posDiff.y = this.getPrimaryLayer.styles.y
        if (this.isActive && this.contentEditable) return
        else if (!this.isActive) {
          this.isControlling = true
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: false })
          document.addEventListener('mouseup', this.onMouseup)
          return
        }
        LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: true })
      }
      document.addEventListener('mouseup', this.onMouseup)
      this.isControlling = true
    },
    onMouseup() {
      if (this.getLayerType === 'text') {
        this.posDiff.x = this.getPrimaryLayer.styles.x - this.posDiff.x
        this.posDiff.y = this.getPrimaryLayer.styles.y - this.posDiff.y
        if (Math.round(this.posDiff.x) !== 0 || Math.round(this.posDiff.y) !== 0) {
          LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { contentEditable: false })
        }
      }
      document.removeEventListener('mouseup', this.onMouseup)
      this.isControlling = false
    },
    positionStyles() {
      const { x, y } = this.config.styles

      return {
        transform: `translate(${x}px, ${y}px)` + `rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        'pointer-events': 'none'
      }
    },
    wrapperStyles() {
      const scale = LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex).styles.scale
      return {
        transformOrigin: '0px 0px',
        transform: `scale(${this.type === 'frame' ? scale : 1})`,
        outline: this.outlineStyles(),
        ...this.sizeStyle(),
        ...(this.type === 'frame' && (() => {
          if (this.config.isFrameImg) {
            return { clipPath: `path d='M0,0h${this.getLayerWidth}v${this.getLayerHeight}h${-this.getLayerWidth}z'` }
          } else {
            return { clipPath: `path("${this.config.clipPath}")` }
          }
        })())
      }
    },
    styles() {
      return {
        ...this.sizeStyle(),
        'pointer-events': 'initial',
        ...TextEffectUtils.convertTextEffect(this.config.styles.textEffect)
      }
    },
    sizeStyle() {
      const { isFrameImg } = this.config
      let width, height
      if (this.type === 'frame' && !isFrameImg) {
        width = `${this.config.styles.initWidth}px`
        height = `${this.config.styles.initHeight}px`
      } else {
        width = `${this.config.styles.width}px`
        height = `${this.config.styles.height}px`
      }
      return { width, height }
    },
    outlineStyles() {
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      if (this.isActive && LayerUtils.getCurrLayer.type !== 'frame') {
        if (this.isControlling) {
          return `${2 * (100 / this.scaleRatio) / this.primaryScale}px dashed ${outlineColor}`
        } else {
          return `${2 * (100 / this.scaleRatio) / this.primaryScale}px solid ${outlineColor}`
        }
      } else {
        return 'none'
      }
    },
    onRightClick(event: MouseEvent) {
      if (!this.isLocked) {
        this.setIsLayerDropdownsOpened(true)
        this.$nextTick(() => {
          const el = document.querySelector('.dropdowns--layer') as HTMLElement
          const mousePos = MouseUtils.getMouseAbsPoint(event)
          el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
          el.focus()
        })
      }
    },
    handleTextChange(payload: { paragraphs: IParagraph[], isSetContentRequired: boolean }) {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { paragraphs: payload.paragraphs })
      this.isCurveText ? this.curveTextSizeRefresh(this.config) : TextUtils.updateGroupLayerSize(this.pageIndex, this.primaryLayerIndex, this.layerIndex)
      if (payload.isSetContentRequired && !tiptapUtils.editor?.view?.composing) {
        this.$nextTick(() => {
          tiptapUtils.agent(editor => {
            editor.chain().setContent(tiptapUtils.toJSON(payload.paragraphs)).selectPrevious().run()
          })
        })
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
      if (!this.isPrimaryActive || this.isMoved) return
      if (this.type === 'tmp') {
        if (GeneralUtils.exact([e.shiftKey, e.ctrlKey, e.metaKey])) {
          groupUtils.deselectTargetLayer(this.layerIndex)
        }
        return
      }
      this.$emit('clickSubController', this.layerIndex, this.config.type)
    },
    onDblClick() {
      if (this.type === 'tmp') {
        return
      }
      this.$emit('dblSubController', this.layerIndex)
    },
    onTextFocus() {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: true })
    },
    onTextBlur() {
      LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { isTyping: false })
    },
    onDragEnter(e: DragEvent) {
      switch (this.type) {
        case 'frame':
          this.getLayerType === 'image' && this.onFrameDragEnter(e)
          return
        case 'group':
          this.getLayerType === 'image' && this.dragUitls.onImageDragEnter(e, this.config as IImage)
      }
    },
    onDragLeave(e: DragEvent) {
      switch (this.type) {
        case 'frame':
          this.getLayerType === 'image' && this.onFrameDragLeave(e)
          return
        case 'group':
          this.getLayerType === 'image' && this.dragUitls.onImageDragLeave(e)
      }
    },
    onDrop(e: DragEvent) {
      switch (this.type) {
        case 'frame':
          this.getLayerType === 'image' && this.onFrameDrop(e)
          return
        case 'group':
          this.getLayerType === 'image' && this.dragUitls.onImgDrop(e)
      }
    },
    onFrameDragEnter(e: DragEvent) {
      const primaryLayer = LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex) as IFrame
      if (!primaryLayer.locked) {
        e.stopPropagation()
        if (this.currDraggedPhoto.srcObj.type && !this.currDraggedPhoto.isPreview && !this.imgBuff.cached) {
          const clips = GeneralUtils.deepCopy(primaryLayer.clips) as Array<IImage>
          Object.assign(this.imgBuff, {
            srcObj: {
              ...clips[this.layerIndex].srcObj
            },
            styles: {
              imgX: clips[this.layerIndex].styles.imgX,
              imgY: clips[this.layerIndex].styles.imgY,
              imgWidth: clips[this.layerIndex].styles.imgWidth,
              imgHeight: clips[this.layerIndex].styles.imgHeight,
              horizontalFlip: clips[this.layerIndex].styles.horizontalFlip,
              verticalFlip: clips[this.layerIndex].styles.verticalFlip
            },
            cached: true
          })
          FrameUtils.updateFrameClipSrc(this.pageIndex, this.primaryLayerIndex, this.layerIndex, this.currDraggedPhoto.srcObj)

          Object.assign(clips[this.layerIndex].srcObj, this.currDraggedPhoto.srcObj)
          const clip = clips[this.layerIndex]
          const {
            imgWidth, imgHeight,
            imgX, imgY
          } = MouseUtils.clipperHandler(this.currDraggedPhoto, clip.clipPath, clip.styles).styles
          FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
            imgWidth,
            imgHeight,
            imgX,
            imgY,
            horizontalFlip: false,
            verticalFlip: false
          })
        }
      }
    },
    onFrameDragLeave(e: DragEvent) {
      e.stopPropagation()
      const primaryLayer = LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex) as IFrame
      if (this.imgBuff.cached && !primaryLayer.locked) {
        FrameUtils.updateFrameClipSrc(this.pageIndex, this.primaryLayerIndex, this.layerIndex, this.imgBuff.srcObj)
        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, this.imgBuff.styles)
        this.imgBuff.cached = false
      }
    },
    onFrameDrop(e: DragEvent) {
      if (this.imgBuff.cached) {
        e.stopPropagation()
        StepsUtils.record()
        this.imgBuff.cached = false
      }
    },
    undo() {
      ShortcutUtils.undo()
      LayerUtils.updateLayerProps(this.pageIndex, this.primaryLayerIndex, { active: true })
      LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { active: true })
      setTimeout(() => TextUtils.focus({ pIndex: 0, sIndex: 0, offset: 0 }, TextUtils.getNullSel(), this.layerIndex), 0)
    },
    onFrameMouseEnter(e: MouseEvent) {
      e.stopPropagation()
      if (LayerUtils.layerIndex !== this.layerIndex && imageUtils.isImgControl()) {
        return
      }
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === 'image' && this.isMoving && (currLayer as IImage).previewSrc === undefined) {
        const { styles, srcObj } = this.config
        Object.assign(this.imgBuff, {
          srcObj: {
            ...srcObj
          },
          styles: {
            imgX: styles.imgX,
            imgY: styles.imgY,
            imgWidth: styles.imgWidth,
            imgHeight: styles.imgHeight,
            horizontalFlip: styles.horizontalFlip,
            verticalFlip: styles.verticalFlip
          },
          cached: true
        })

        FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          srcObj: { ...currLayer.srcObj }
        })

        LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { opacity: 35 })
        const {
          imgWidth, imgHeight,
          imgX, imgY
        } = MouseUtils.clipperHandler(currLayer, this.config.clipPath, styles).styles
        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          adjust: { ...currLayer.styles.adjust },
          imgWidth,
          imgHeight,
          imgX,
          imgY,
          horizontalFlip: currLayer.styles.horizontalFlip,
          verticalFlip: currLayer.styles.verticalFlip
        })
      }
    },
    onFrameMouseLeave(e: MouseEvent) {
      e.stopPropagation()
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === 'image' && this.isMoving) {
        LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { opacity: 100 })
        FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          srcObj: { ...this.imgBuff.srcObj }
        })

        FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, {
          ...this.imgBuff.styles
        })

        LayerUtils.updateLayerStyles(this.pageIndex, this.primaryLayerIndex, {
          horizontalFlip: false,
          verticalFlip: false
        })
      }
    },
    onFrameMouseUp(e: MouseEvent) {
      const currLayer = LayerUtils.getCurrLayer as IImage
      if (currLayer && currLayer.type === 'image') {
        LayerUtils.deleteLayer(LayerUtils.layerIndex)
        const newIndex = this.primaryLayerIndex > LayerUtils.layerIndex ? this.primaryLayerIndex - 1 : this.primaryLayerIndex
        groupUtils.set(this.pageIndex, newIndex, [this.getPrimaryLayer])
        FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, { active: true })
        StepsUtils.record()
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-sub-controller {
  transform-style: preserve-3d;
  &__wrapper {
    top: 0;
    left: 0;
    position: absolute;
  }
  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
  }
  &__ctrl-points {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    pointer-events: "none";
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

.control-point {
  pointer-events: auto;
  position: absolute;
  background-color: setColor(white);
  border: 1.5px solid setColor(blue-2);
  transform-style: preserve-3d;

  &__resize-bar {
    position: absolute;
    pointer-events: auto;
    border: 2.5px solid #00000000;
    color: "#00000000";
  }
  &__rotater-wrapper {
    position: absolute;
    top: 100%;
    padding: 20px;
  }
  &__rotater {
    @include size(20px, 20px);
    position: relative;
    left: 0;
    top: 0;
    pointer-events: auto;
    cursor: move;
  }
  &__move-bar {
    cursor: move;
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
