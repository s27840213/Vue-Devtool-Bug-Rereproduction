<template lang="pug">
  keep-alive
    div(class="nu-controller")
      div(class="nu-controller__content"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles('')"
          @drop="config.path !== '' || config.isClipped ? onDropClipper($event) : onDrop($event)"
          @dragover.prevent,
          @dragenter.prevent
          @click.left="onClick"
          @click.right.stop="onRightClick"
          @mousedown.left.stop="moveStart"
          @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)"
          @mouseover.stop="toggleHighlighter(pageIndex,layerIndex,true)"
          @dblclick="onDblClick")
        template(v-if="config.type === 'text' && config.active")
          div(:style="textScaleStyle()")
            div(ref="text" :id="`text-${layerIndex}`" spellcheck="false"
              :style="textBodyStyle()"
              :contenteditable="config.type === 'tmp' ? false : contentEditable"
              @compositionstart="isComposing = true"
              @compositionend="isComposing = false"
              @keydown="onKeyDown($event)")
              p(v-for="(p, pIndex) in config.paragraphs" class="text__p"
                :data-pindex="pIndex"
                :key="p.id",
                :style="textStyles(p.styles)")
                span(v-for="(span, sIndex) in p.spans" class="text__span"
                  :data-sindex="sIndex"
                  :key="span.id",
                  :style="textStyles(span.styles)") {{ span.text }}
        div(v-if="isActive && isLocked && (scaleRatio >20)"
            class="nu-controller__lock-icon"
            :style="`transform: scale(${100/scaleRatio})`")
          svg-icon(:iconName="'lock'" :iconWidth="`${20}px`" :iconColor="'red'"
            @click.native="MappingUtils.mappingIconAction('unlock')")
      div(v-if="isActive && !isControlling && !isLocked"
          class="nu-controller__ctrl-points"
          :style="Object.assign(styles('control-point'), {'pointer-events': 'none'})")
          div(v-for="(scaler, index) in controlPoints.scalers"
              class="control-point"
              :key="index * 2"
              :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
              @mousedown.left.stop="scaleStart")
          div(v-for="(resizer, index) in resizer(controlPoints)"
              @mousedown.left.stop="resizeStart")
            div(class="control-point__resize-bar"
                :key="index * 2 + 1"
                :style="resizerBarStyles(resizer)")
            div(class="control-point"
                :style="Object.assign(resizer, cursorStyles(index * 2 + 1, getLayerRotate))")
          div(class="control-point__rotater-wrapper")
            div(class="control-point__rotater" @mousedown.left.stop="rotateStart")
              svg-icon(:iconName="'rotate'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>
<script lang="ts">
import Vue from 'vue'
import MathUtils from '@/utils/mathUtils'
import { v4 as uuidv4 } from 'uuid'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import StepsUtils from '@/utils/stepsUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IImage, IParagraph, IParagraphStyle, IShape, ISpan, ISpanStyle, IText } from '@/interfaces/layer'
import { IControlPoints, IResizer } from '@/interfaces/controller'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import MappingUtils from '@/utils/mappingUtils'
import TextUtils from '@/utils/textUtils'
import { config } from 'vue/types/umd'
import { concat } from 'lodash'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    snapUtils: Object
  },
  data() {
    return {
      MappingUtils,
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      initialWH: { width: 0, height: 0 },
      imgInitWH: { width: 0, height: 0 },
      imgBuffer: { width: 0, height: 0, x: 0, y: 0 },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, imgX: 0, imgY: 0, isHorizon: false },
      scale: { scaleX: 1, scaleY: 1 },
      isComposing: false,
      isSnapping: false,
      contentEditable: false
    }
  },
  mounted() {
    // console.log(this.config)
    const body = this.$refs.body as HTMLElement
    /**
     * Prevent the context menu from showing up when right click or Ctrl + left click on controller
     */
    body.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault()
    }, false)
    this.setLastSelectedLayerIndex(this.layerIndex)
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo'
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
    isShown(): boolean {
      return this.config.shown
    },
    isLocked(): boolean {
      return this.config.locked
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
    getFontSize(): number {
      return this.config.styles.size
    },
    getLayerScale(): number {
      return this.config.styles.scale
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    isActive() {
      if (this.getLayerType === 'text' && !this.isActive) {
        this.contentEditable = false
        const paragraphs: IParagraph[] = this.textParser()
        TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
      }
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex',
      setIsLayerDropdownsOpened: 'SET_isLayerDropdownsOpened'
    }),
    resizerBarStyles(resizer: IResizer) {
      const resizerStyle = Object.assign({}, resizer)
      const ControllerStyles = this.styles('')
      const HW = {
        //  get the widht/height of the controller for resizer-bar and minus the scaler size
        width: resizerStyle.width < resizerStyle.height ? `${parseInt(ControllerStyles.width) - 20}px` : resizerStyle.width,
        height: resizerStyle.width > resizerStyle.height ? `${parseInt(ControllerStyles.height) - 20}px` : resizerStyle.height
      }
      return Object.assign(resizerStyle, HW)
    },
    resizer(controlPoints: any) {
      let resizers = controlPoints.resizers
      switch (this.getLayerType) {
        case 'text':
          resizers = this.config.styles.writingMode.substring(0, 8) === 'vertical' ? controlPoints.resizers.slice(2, 4)
            : controlPoints.resizers.slice(0, 2)
          break
        case 'image':
          resizers = this.config.isClipper ? [] : resizers
          break
        case 'shape':
          resizers = ControlUtils.shapeCategorySorter(resizers, this.config.category, this.config.scaleType)
          break
        case 'tmp':
          resizers = []
          break
      }
      return resizers
    },
    textScaleStyle() {
      return {
        position: 'absolute',
        transform: `scaleX(${this.getLayerScale}) scaleY(${this.getLayerScale})`
      }
    },
    textBodyStyle() {
      return {
        width: `${this.config.styles.width / this.getLayerScale}px`,
        height: `${this.config.styles.height / this.getLayerScale}px`,
        outline: 'none',
        position: 'absolute',
        transform: 'translate(-50%, -50%)'
      }
    },
    textStyles(styles: any) {
      // const textStyles = CssConveter.convertFontStyle(Object.assign(newStyles, { color: styles.color ? styles.color : '' }))
      const textStyles = CssConveter.convertFontStyle(styles)
      Object.assign(textStyles, { 'caret-color': this.contentEditable && !this.isControlling ? '' : '#00000000' })
      return textStyles
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    styles(type: string) {
      const zindex = type === 'control-point' ? (this.layerIndex + 1) * 100 : (this.layerIndex + 1)
      const outlineColor = this.isLocked ? '#EB5757' : '#7190CC'
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline: this.isShown || this.isActive ? ((this.config.type === 'tmp' || this.isControlling)
          ? `${2 * (100 / this.scaleRatio)}px dashed ${outlineColor}` : `${2 * (100 / this.scaleRatio)}px solid ${outlineColor}`) : 'none',
        'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'initial'
      }
    },

    moveStart(event: MouseEvent) {
      this.initTranslate = this.getLayerPos
      if (this.getLayerType === 'text') {
        if (this.isActive && this.contentEditable) {
          return
        } else if (!this.isActive) {
          let targetIndex = this.layerIndex
          if (!GeneralUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey]) && this.currSelectedInfo.index >= 0) {
            GroupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedPageIndex(this.pageIndex)
            this.setLastSelectedLayerIndex(this.layerIndex)
          }
          if (this.pageIndex === this.lastSelectedPageIndex) {
            GroupUtils.select([targetIndex])
          }
          if (!this.config.locked) {
            this.isControlling = true
            this.initialPos = MouseUtils.getMouseAbsPoint(event)
            window.addEventListener('mouseup', this.moveEnd)
            window.addEventListener('mousemove', this.moving)
          }
          return
        }
        this.contentEditable = true
      }
      if (!this.config.locked) {
        this.isControlling = true
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        window.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
      }
      if (this.config.type !== 'tmp') {
        let targetIndex = this.layerIndex
        if (!this.isActive) {
          if (!GeneralUtils.exact([event.shiftKey, event.ctrlKey, event.metaKey]) && this.currSelectedInfo.index >= 0) {
            GroupUtils.deselect()
            targetIndex = this.config.styles.zindex - 1
            this.setLastSelectedPageIndex(this.pageIndex)
            this.setLastSelectedLayerIndex(this.layerIndex)
          }
          if (this.pageIndex === this.lastSelectedPageIndex) {
            GroupUtils.select([targetIndex])
          }
        }
      }
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        event.preventDefault()
        this.setCursorStyle('move')
        if (!this.config.moved) {
          LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
        }
        const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
        const moveOffset = MathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y)
        GroupUtils.movingTmp(
          this.pageIndex,
          {
            x: moveOffset.offsetX,
            y: moveOffset.offsetY
          }
        )
        const offsetSnap = this.snapUtils.calcMoveSnap(this.config, this.layerIndex)
        this.$emit('getClosestSnaplines')
        const totalOffset = {
          x: offsetPos.x + (offsetSnap.x * this.scaleRatio / 100),
          y: offsetPos.y + (offsetSnap.y * this.scaleRatio / 100)
        }
        this.initialPos.x += totalOffset.x
        this.initialPos.y += totalOffset.y
      }
    },
    imgHandler(offset: ICoordinate) {
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY)
    },
    moveEnd() {
      if (this.isActive) {
        const posDiff = {
          x: Math.abs(this.getLayerPos.x - this.initTranslate.x),
          y: Math.abs(this.getLayerPos.y - this.initTranslate.y)
        }
        if (this.getLayerType === 'text' && (Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0)) {
          this.contentEditable = false
        }
        this.isControlling = false
        this.setCursorStyle('default')
        window.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
        StepsUtils.record()
      }
      this.$emit('clearSnap')
    },
    scaleStart(event: MouseEvent) {
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.isControlling = true

      this.initialWH = {
        width: this.getLayerWidth,
        height: this.getLayerHeight
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)
      this.initTranslate = this.getLayerPos
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)

      // Get client point as no rotation
      const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1

      this.currCursorStyling(event)
      document.documentElement.addEventListener('mousemove', this.scaling, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }

      let width = this.getLayerWidth
      let height = this.getLayerHeight

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = MathUtils.getActualMoveOffset(tmp.x, tmp.y)
      const [dx, dy] = [diff.offsetX, diff.offsetY]

      const offsetWidth = this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad))
      const offsetHeight = this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 || offsetHeight === 0) return

      const initWidth = this.initialWH.width
      const initHeight = this.initialWH.height
      if ((width + offsetWidth) / initWidth >= (height + offsetHeight) / initHeight) {
        width = offsetWidth + initWidth
        height = width * initHeight / initWidth
      } else {
        height = offsetHeight + initHeight
        width = height * initWidth / initHeight
      }
      // The minimum size of the layer
      if (width <= 40 || height <= 40) return

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }
      const initData = {
        xSign: this.control.xSign,
        ySign: this.control.ySign,
        x: this.initTranslate.x,
        y: this.initTranslate.y,
        angle: angleInRad
      }
      const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)

      const ratio = {
        // width: width / (this.config.styles.initWidth * this.config.styles.scaleX),
        // height: height / (this.config.styles.initHeight * this.config.styles.scaleY)
        width: width / (this.getLayerWidth / this.getLayerScale),
        height: height / (this.getLayerHeight / this.getLayerScale)
      }
      /**
       * TO times the initSize is for synchronizing the img-resizer.
       * after resizing the img's clip-path, the initWidth and initHeight will be reset
       * However the scaling factor of the layer needs to be reserved, which is the initSize used for.
       */
      let scale = Math.max(ratio.width, ratio.height)
      if (this.getLayerType === 'image') {
        scale *= typeof this.config.styles.initSize === 'undefined' ? 1 : this.config.styles.initSize
      } else if (this.getLayerType === 'text') {
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: width })
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
      // this.snapUtils.calcScaleSnap(this.config, this.layerIndex)
      // this.$emit('getClosestSnaplines')
    },
    scaleEnd() {
      this.isControlling = false
      StepsUtils.record()

      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.scaling, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
      this.$emit('setFocus')
      this.$emit('clearSnap')
    },
    resizeStart(event: MouseEvent) {
      this.isControlling = true
      const body = this.$refs.body as HTMLElement
      const rect = body.getBoundingClientRect()
      const center = ControlUtils.getRectCenter(rect)

      this.initialWH = {
        width: this.getLayerWidth,
        height: this.getLayerHeight
      }
      this.imgInitWH = {
        width: this.config.styles.imgWidth,
        height: this.config.styles.imgHeight
      }
      this.control.imgX = this.config.styles.imgX
      this.control.imgY = this.config.styles.imgY
      this.initTranslate = this.getLayerPos
      this.initialPos = { x: event.clientX, y: event.clientY }

      const vect = MouseUtils.getMouseRelPoint(event, center)
      const angeleInRad = this.getLayerRotate * Math.PI / 180
      const clientP = ControlUtils.getNoRotationPos(vect, center, angeleInRad)
      this.control.xSign = (clientP.x - center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - center.y > 0) ? 1 : -1
      this.control.isHorizon = ControlUtils.dirHandler(clientP, rect)

      document.documentElement.addEventListener('mousemove', this.resizing)
      document.documentElement.addEventListener('mouseup', this.resizeEnd)
      this.currCursorStyling(event)

      if (this.getLayerType === 'shape' && this.config.category === 'B') {
        this.scale = {
          scaleX: this.config.styles.scaleX,
          scaleY: this.config.styles.scaleY
        }
      }
    },
    resizing(event: MouseEvent) {
      event.preventDefault()
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }
      let width = this.getLayerWidth
      let height = this.getLayerHeight
      const initWidth = this.initialWH.width
      const initHeight = this.initialWH.height

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const diff = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const [dx, dy] = [diff.x / (this.scaleRatio / 100), diff.y / (this.scaleRatio / 100)]

      const offsetWidth = this.control.isHorizon ? this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad)) : 0
      const offsetHeight = this.control.isHorizon ? 0 : this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 && offsetHeight === 0) return

      width = offsetWidth + initWidth
      height = offsetHeight + initHeight
      if (width <= 20 || height <= 20) return

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }
      const initData = {
        xSign: this.control.xSign,
        ySign: this.control.ySign,
        x: this.initTranslate.x,
        y: this.initTranslate.y,
        angle: angleInRad
      }
      const trans = ControlUtils.getTranslateCompensation(initData, offsetSize)

      const scale = this.getLayerScale
      switch (this.getLayerType) {
        case 'image':
          this.imgResizeHandler(width, height, offsetWidth, offsetHeight)
          break
        case 'shape':
          ControlUtils.resizeShapeHandler(this.config, this.scale, this.initialWH, width, height)
          break
        case 'text':
          [width, height] = this.textResizeHandler(width, height)
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    textResizeHandler(width: number, height: number): [number, number] {
      const text = this.$refs.text as HTMLElement
      if (text && this.config.styles.writingMode.substring(0, 8) !== 'vertical') {
        text.style.height = 'max-content'
        height = Math.ceil(text.getBoundingClientRect().height / (this.scaleRatio / 100))
        ControlUtils.updateLayerProps(this.pageIndex, this.layerIndex, { widthLimit: width })
      }
      return [width, height]
    },
    resizeExceedLimit(width: number, height: number, offsetX: number, offsetY: number): boolean {
      const imgPos = {
        x: this.control.imgX,
        y: this.control.imgY
      }
      /**
       * Below is a conclusion of checking-if-the-Resizer-exceed-limit for the top/left resizer
       * The origin derived algorithm is described as in imgContorller.vue: moving section
       */
      if ((this.control.isHorizon && this.control.xSign < 0) || (!this.control.isHorizon && this.control.ySign < 0)) {
        imgPos.x += offsetX / this.getLayerScale
        imgPos.y += offsetY / this.getLayerScale
        if (imgPos.x > 0 || imgPos.y > 0) {
          return true
        }
      } else {
        width += offsetX
        height += offsetY
        if (this.control.isHorizon && width - imgPos.x * this.getLayerScale > this.imgInitWH.width * this.getLayerScale) {
          return true
        }
        if (!this.control.isHorizon && height - imgPos.y * this.getLayerScale > this.imgInitWH.height * this.getLayerScale) {
          return true
        }
      }
      return false
    },
    imgResizeHandler(width: number, height: number, offsetWidth: number, offsetHeight: number) {
      let offsetX
      let offsetY
      if ((this.control.isHorizon && this.control.xSign < 0) || (!this.control.isHorizon && this.control.ySign < 0)) {
        offsetX = offsetWidth
        offsetY = offsetHeight
      }
      if (this.resizeExceedLimit(this.initialWH.width, this.initialWH.height, offsetWidth, offsetHeight)) {
        if (this.imgBuffer.width === 0 && this.imgBuffer.height === 0) {
          this.imgScaling(width + offsetWidth, height + offsetHeight, 0, 0)
          this.imgBuffer.width = offsetWidth
          this.imgBuffer.height = offsetHeight
        }
        this.imgScaling(width, height, offsetWidth - this.imgBuffer.width, offsetHeight - this.imgBuffer.height)
      } else {
        this.imgClipping(width, height, offsetX, offsetY)
      }
    },
    imgScaling(layerWidth: number, layerHeight: number, offsetWidth: number, offsetHeight: number) {
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, layerWidth, layerHeight, this.getLayerScale)
      let imgWidth = this.imgInitWH.width
      let imgHeight = this.imgInitWH.height
      const ratio = imgHeight / imgWidth
      const width = layerWidth / this.getLayerScale
      const height = layerHeight / this.getLayerScale
      offsetWidth /= this.getLayerScale
      offsetHeight /= this.getLayerScale
      const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`
      if (this.control.isHorizon) {
        imgWidth += offsetWidth
        imgHeight = imgWidth * ratio
      } else {
        imgHeight += offsetHeight
        imgWidth = imgHeight / ratio
      }
      /**
       * Below is used to make sure the imgHW are always larger than (at least equal to) the layerHW,
       * This guarantee the exceedLimitation returns the expect value.
       * p.s. The reason of this the problem which the imgHW somehow smaller than the layerHW might
       * be caused by the 'rounding-number' of the ratio.
       */
      if (imgHeight < layerHeight) {
        imgHeight = layerHeight
        imgWidth = layerHeight / ratio
      } else if (imgWidth < layerWidth) {
        imgWidth = layerWidth
        imgHeight = layerWidth * ratio
      }
      const imgPos = {
        x: this.control.imgX,
        y: this.control.imgY
      }
      if (this.control.isHorizon) {
        imgPos.y -= (imgHeight - this.imgInitWH.height) / 2
        imgPos.x = this.config.styles.imgX
      } else {
        imgPos.x -= (imgWidth - this.imgInitWH.width) / 2
        imgPos.y = this.config.styles.imgY
      }
      if (this.imgBuffer.x === 0 && this.imgBuffer.y === 0) {
        this.imgBuffer.x = -(imgWidth - this.imgInitWH.width) / 2
        this.imgBuffer.y = -(imgHeight - this.imgInitWH.height) / 2
      }
      // TODO: still got some problem after layer being scaled.

      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgPos.x, imgPos.y)
      ControlUtils.updateImgSize(this.pageIndex, this.layerIndex, imgWidth, imgHeight)
      ControlUtils.updateImgClipPath(this.pageIndex, this.layerIndex, `path('${path}')`)
    },
    imgClipping(width: number, height: number, offsetX: number | undefined, offsetY: number | undefined) {
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, this.getLayerScale)
      width /= this.getLayerScale
      height /= this.getLayerScale
      const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`
      if (typeof offsetX !== 'undefined' && typeof offsetY !== 'undefined') {
        const imgX = this.control.imgX
        const imgY = this.control.imgY
        offsetX /= this.config.styles.scale
        offsetY /= this.config.styles.scale
        ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, offsetX + imgX, offsetY + imgY)
      }
      ControlUtils.updateImgClipPath(this.pageIndex, this.layerIndex, `path('${path}')`)
    },
    resizeEnd() {
      this.imgBuffer = { width: 0, height: 0, x: 0, y: 0 }
      this.isControlling = false
      StepsUtils.record()
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.resizing)
      document.documentElement.removeEventListener('mouseup', this.resizeEnd)
      this.$emit('setFocus')
    },
    rotateStart(event: MouseEvent) {
      this.setCursorStyle('move')
      this.isControlling = true

      const body = this.$refs.body as HTMLElement
      const rect = body.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }

      this.initialPos = MouseUtils.getMouseAbsPoint(event)

      window.addEventListener('mousemove', this.rotating)
      window.addEventListener('mouseup', this.rotateEnd)
    },
    rotating(event: MouseEvent) {
      if (!this.config.moved) {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, { moved: true })
      }
      const vectA = {
        x: this.initialPos.x - this.center.x,
        y: this.initialPos.y - this.center.y
      }
      const vectB = {
        x: event.clientX - this.center.x,
        y: event.clientY - this.center.y
      }
      const lineA = ControlUtils.getLength(vectA)
      const lineB = ControlUtils.getLength(vectB)
      const ADotB = vectA.x * vectB.x + vectA.y * vectB.y

      let angle = Math.round(Math.acos(ADotB / (lineA * lineB)) * 180 / Math.PI)
      if (angle) {
        if (vectA.y * vectB.x - vectA.x * vectB.y > 0) {
          angle *= -1
        }
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        angle += this.getLayerRotate % 360
        ControlUtils.updateLayerRotate(this.pageIndex, this.layerIndex, angle)
      }
    },
    rotateEnd() {
      this.isControlling = false
      StepsUtils.record()
      this.setCursorStyle('default')
      window.removeEventListener('mousemove', this.rotating)
      window.removeEventListener('mouseup', this.rotateEnd)
      this.$emit('setFocus')
    },
    cursorStyles(index: number, rotateAngle: number) {
      const cursorIndex = rotateAngle >= 0 ? (index + Math.floor(rotateAngle / 45)) % 8
        : (index + Math.ceil(rotateAngle / 45) + 8) % 8
      return { cursor: this.controlPoints.cursors[cursorIndex] }
    },
    setCursorStyle(cursor: string) {
      const layer = this.$el as HTMLElement
      layer.style.cursor = cursor
      document.body.style.cursor = cursor
    },
    currCursorStyling(e: MouseEvent) {
      const el = e.target as HTMLElement
      this.setCursorStyle(el.style.cursor)
    },
    onDrop(e: DragEvent) {
      MouseUtils.onDrop(e, this.pageIndex, this.getLayerPos)
    },
    onDropClipper(e: DragEvent) {
      switch (this.getLayerType) {
        case 'image': {
          const config = this.config as IImage
          MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, config.clipPath, config.isClipper, config.styles)
          break
        }
        case 'shape': {
          const config = this.config as IShape
          MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, config.path, true, config.styles)
          break
        }
      }
    },
    onClick(e: MouseEvent) {
      this.textClickHandler(e)
    },
    textClickHandler(e: MouseEvent) {
      if (this.getLayerType === 'text' && this.isActive) {
        const selStart = TextUtils.getSelection()?.start
        const paragraphs: IParagraph[] = this.textParser()
        TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)

        const text = this.$refs.text as HTMLElement
        this.$nextTick(() => {
          if (text.childNodes.length > (this.config as IText).paragraphs.length && text.lastChild) {
            text.removeChild(text.lastChild)
          }
          const sel = window.getSelection()
          if (sel && selStart) {
            const range = new Range()
            console.log(selStart)
            range.setStart(text.childNodes[selStart.pIndex].childNodes[selStart.sIndex].firstChild as Node, selStart.offset)
            sel.removeAllRanges()
            sel.addRange(range)
          }
          if ((this.$refs.text as HTMLElement).contains(e.target as Node)) {
            const sel = window.getSelection()
            if (sel && sel.rangeCount !== 0) {
              this.$root.$emit('updateTextPanel')
            }
          }
        })
      }
    },
    onKeyDown(e: KeyboardEvent) {
      if (this.config.type === 'text') {
        const text = this.$refs.text as HTMLElement
        const sel = window.getSelection()
        const start = {
          pIndex: NaN,
          sIndex: NaN,
          offset: 0
        }
        if (sel) {
          const range = sel.getRangeAt(0)
          if (range) {
            const startContainer = range.startContainer
            if (Number.isNaN(parseInt(startContainer?.parentElement?.dataset.sindex as string)) || Number.isNaN(parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string))) {
              /**
               * After a whole paragraph is being deleted, the selection will return NaN (lose the caret position of it)
               * at this moment, we update the vuex and capture the caret position
               * the caret position is captured by the following logic
               */
              console.log('NaN')
              setTimeout(() => {
                const text = this.$refs.text as HTMLElement
                let deletedPindex = -1
                for (let i = 0; i < text.childElementCount; i++) {
                  const pindex = parseInt((text.childNodes[i] as HTMLElement).dataset.pindex as string)
                  console.log(pindex)
                  console.log(i)
                  if (pindex !== i) {
                    deletedPindex = i
                    break
                  }
                }
                const paragraphs: IParagraph[] = this.textParser()
                TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
                this.$nextTick(() => {
                  console.log(text)
                  if (text.childNodes.length > (this.config as IText).paragraphs.length && text.lastChild) {
                    text.removeChild(text.lastChild)
                  }
                  const sel = window.getSelection()
                  if (sel && start) {
                    const range = new Range()
                    const sLeng = (this.config as IText).paragraphs[deletedPindex - 1].spans.length
                    const offset = (this.config as IText).paragraphs[deletedPindex - 1].spans[sLeng - 1].text.length
                    range.setStart(text.childNodes[deletedPindex - 1].childNodes[sLeng - 1].firstChild as Node, offset)
                    sel.removeAllRanges()
                    sel.addRange(range)
                  }
                })
              }, 0)
            }
            // TODO: deletion at the begining of the text cause bug.
            start.sIndex = parseInt(startContainer?.parentElement?.dataset.sindex as string)
            start.pIndex = parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string)
            if (e.key === 'Backspace') {
              if (start.sIndex === 0 && start.pIndex === 0 && sel.anchorOffset === 0) {
                e.preventDefault()
                return
              } else {
                ControlUtils.textStopPropagation(e)
              }
            }
            if (e.key === 'Enter') {
              setTimeout(() => {
                let buff = -1
                for (let i = 0; i < text.childElementCount; i++) {
                  const pindex = parseInt((text.childNodes[i] as HTMLElement).dataset.pindex as string)
                  if (buff === pindex) {
                    break
                  }
                  buff = pindex
                }
                const paragraphs: IParagraph[] = this.textParser()
                TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
                this.$nextTick(() => {
                  if (text.childNodes.length > (this.config as IText).paragraphs.length && text.lastChild) {
                    text.removeChild(text.lastChild)
                  }
                  const sel = window.getSelection()
                  if (sel && start) {
                    const range = new Range()
                    range.setStart(text.childNodes[buff + 1].childNodes[0].firstChild as Node, 0)
                    sel.removeAllRanges()
                    sel.addRange(range)
                  }
                })
              }, 0)
            }
          }
        }
        setTimeout(() => {
          const text = this.$refs.text as HTMLElement
          text.style.width = this.config.widthLimit === -1 ? 'max-content' : `${this.config.widthLimit / this.getLayerScale}px`
          text.style.height = 'max-content'
          const textHW = {
            width: Math.ceil(text.getBoundingClientRect().width / (this.scaleRatio / 100)),
            height: Math.ceil(text.getBoundingClientRect().height / (this.scaleRatio / 100))
          }
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
          text.style.height = `${this.config.styles.height / this.getLayerScale}px`
        }, 0)
        // const observer = new MutationObserver(this.onTyping(e, start))
        // observer.observe(text, {
        //   characterData: true,
        //   childList: true,
        //   subtree: true,
        //   attributes: false,
        //   attributeOldValue: false,
        //   characterDataOldValue: false
        // })
      }
    },
    onTyping(e: KeyboardEvent, start: { pIndex: number, sIndex: number, offset: number }) {
      // Update the layer's width/height
      setTimeout(() => {
        const text = this.$refs.text as HTMLElement
        text.style.width = this.config.widthLimit === -1 ? 'max-content' : `${this.config.widthLimit / this.getLayerScale}px`
        text.style.height = 'max-content'
        const textHW = {
          width: Math.ceil(text.getBoundingClientRect().width / (this.scaleRatio / 100)),
          height: Math.ceil(text.getBoundingClientRect().height / (this.scaleRatio / 100))
        }
        ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textHW.width, textHW.height, this.getLayerScale)
        text.style.height = `${this.config.styles.height / this.getLayerScale}px`
      }, 0)
      return (mutations: MutationRecord[], observer: MutationObserver) => {
        if (this.isComposing) {
          return
        }

        observer.disconnect()
        const paragraphs: IParagraph[] = this.textParser()
        if (window.getSelection()) {
          const sel = window.getSelection()
          const startContainer = sel?.getRangeAt(0).startContainer
          let [pIndex, sIndex, offset] = [start.pIndex, start.sIndex, start.offset]
          // if the below condition is false, means some paragraph (p-node) is removed
          if (startContainer?.parentElement?.dataset.sindex) {
            offset = sel?.getRangeAt(0).startOffset as number
            sIndex = parseInt(startContainer?.parentElement?.dataset.sindex as string)
            pIndex = parseInt(startContainer?.parentElement?.parentElement?.dataset.pindex as string)
            // used for deleting the first span of the text, and moving the caret to the previous p
            const isSpanDeleted = paragraphs[pIndex].spans.length < (this.config as IText).paragraphs[pIndex].spans.length
            if (e.key !== 'Enter' && isSpanDeleted && sIndex === 1 && offset === 0) {
              pIndex -= 1
              // if below condition is satisfied, means there is deletion at the begining of the text (p=0, s=0, offset=0)
              if (pIndex < 0) {
                [pIndex, sIndex, offset] = [0, 0, 0]
              }
              sIndex = paragraphs[pIndex].spans.length - 1
              offset = paragraphs[pIndex].spans[sIndex].text.length
            } else if (e.key === 'Enter') {
              [sIndex, offset] = [0, 0]
              pIndex += 1
            }
          } else if (e.key === 'Enter') {
            // console.log('inNewLine and some node gone')
            // console.log(startContainer?.parentElement)
            // console.log(startContainer)
            [sIndex, offset] = [0, 0]
            pIndex += 1
          } else if (TextUtils.isArrowKey(e)) {
            /**
             *  If the input key is ArrowKey, the startContainer will be different as the other key pressed
             */
            if (typeof startContainer?.parentElement !== 'undefined' && typeof startContainer?.parentElement !== 'undefined') {
              offset = sel?.getRangeAt(0).startOffset as number
              sIndex = parseInt((startContainer as HTMLElement).dataset.sindex as string)
              pIndex = parseInt(startContainer?.parentElement?.dataset.pindex as string)
            }
          } else if (paragraphs.length < (this.config as IText).paragraphs.length) {
            /**
             * some paragraph is deleted
             */
            pIndex -= 1
            sIndex = paragraphs[pIndex].spans.length - 1 >= 0 ? paragraphs[pIndex].spans.length - 1 : 0
            offset = paragraphs[pIndex].spans[sIndex] ? paragraphs[pIndex].spans[sIndex].text.length : 0
          }
          const text = this.$refs.text as HTMLElement
          TextUtils.updateTextParagraphs(this.pageIndex, this.layerIndex, paragraphs)
          this.$nextTick(() => {
            if (text.childNodes.length > (this.config as IText).paragraphs.length && text.lastChild) {
              text.removeChild(text.lastChild)
            }
            const sel = window.getSelection()
            if (sel) {
              const range = new Range()
              range.setStart(text.childNodes[pIndex].childNodes[sIndex].firstChild as Node, offset)
              sel.removeAllRanges()
              sel.addRange(range)
            }
          })
        }
      }
    },
    textParser(): IParagraph[] {
      const paragraphs: IParagraph[] = []
      const div = this.$refs.text as HTMLElement
      const ps = div.childNodes
      const config = (this.config as IText)
      ps.forEach((p, pIndex) => {
        const spans: ISpan[] = []
        for (const [sIndex, span] of p.childNodes.entries()) {
          if (span instanceof HTMLElement) {
            let spanEl = span as HTMLElement
            const text = spanEl.innerText as string
            /**
             * If the span is the same without changed, skip parse it
             */
            if (config.paragraphs[pIndex] && config.paragraphs[pIndex].spans[sIndex] && text === config.paragraphs[pIndex].spans[sIndex].text) {
              spans.push((this.config as IText).paragraphs[pIndex].spans[sIndex])
              continue
            }
            /**
             *  If the span and p are deleted as empty string, the style of the span will be removed by the browser
             *  below detecting the situation and use the style of the last span of previous p to replace it.
             */
            if (spanEl.style.fontFamily === '') {
              const leng = div.childNodes[pIndex - 1].childNodes.length
              spanEl = div.childNodes[pIndex - 1].childNodes[leng - 1] as HTMLElement
            }
            const spanStyle = {
              font: spanEl.style.fontFamily,
              weight: spanEl.style.fontWeight,
              size: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
              initSize: spanEl.style.fontSize ? parseInt(spanEl.style.fontSize.replace(/px/, '')) : '',
              decoration: spanEl.style.textDecorationLine,
              style: spanEl.style.fontStyle,
              color: spanEl.style.color,
              opacity: parseInt(spanEl.style.opacity)
            } as ISpanStyle
            spanEl = span as HTMLElement
            spans.push({ text: text, styles: spanStyle, id: uuidv4() })
          }
        }
        const pEl = p as HTMLElement
        const pStyle: IParagraphStyle = { lineHeight: 0, fontSpacing: 0, align: 'left' }
        pStyle.lineHeight = parseInt(pEl.style.lineHeight.replace(/px/, ''))
        pStyle.fontSpacing = parseInt(pEl.style.letterSpacing)
        pStyle.align = pEl.style.textAlign
        paragraphs.push({ styles: pStyle, spans: spans, id: uuidv4() })
      })
      paragraphs.forEach(p => {
        if (p.spans.length === 1 && p.spans[0].text === '') {
          p.spans[0].text = '\n'
        }
      })
      return paragraphs
    },
    // onTyping(e: KeyboardEvent, pIndex: number, sIndex: number) {
    //   if (e.key === 'Enter') return
    //   this.isControlling = true
    //   ControlUtils.textStopPropagation(e)
    //   // ControlUtils.textEnter(e, this.$refs.text as HTMLElement, this.isCompositoning, this.config.styles.size)
    //   if (e.metaKey && e.key === 'z') {
    //     StepsUtils.undo()
    //     setTimeout(() => {
    //       const text = this.$refs.text as HTMLElement
    //     }, 0)
    //     return
    //   }
    //   if (this.isNoCharactor(e)) {
    //     this.isControlling = false
    //     return
    //   }
    //   const text = this.$refs.text as HTMLElement
    //   text.style.width = 'initial'
    //   text.style.height = 'initial'
    //   /**
    //    * Set the whiteSpace to 'pre' is used for getting the rect-size of the text content.
    //    */
    //   // text.style.whiteSpace = 'pre'
    //   const textNode = window.getSelection()?.anchorNode as Node
    //   setTimeout(() => {
    //     if (textNode) {
    //       // ControlUtils.updateTextContent(this.pageIndex, this.layerIndex, pIndex, sIndex, textNode.textContent as string)
    //     }
    //     /**
    //      * This line of code prevents the bug while deleting at beginning of the text.
    //      */
    //     // if (e.key === 'Backspace' && textTmp === text.innerHTML) return
    //     // const isTextOneLine = Math.abs(this.getLayerHeight - text.offsetHeight) < text.offsetHeight
    //     const isTextOneLine = this.config.paragraphs.length === 1
    //     const textSize = {
    //       width: Math.ceil(text.getBoundingClientRect().width),
    //       height: text.getBoundingClientRect().height
    //     }
    //     let layerX = this.getLayerPos.x
    //     const layerY = this.getLayerPos.y
    //     // TODO: take the rotate angle into pos-compensation consideration
    //     if (this.config.widthLimit === '' && isTextOneLine) {
    //       const page = this.$parent.$el as HTMLElement
    //       const currTextWidth = isTextOneLine ? text.getBoundingClientRect().width : this.getLayerWidth
    //       // const currTextWidth = isTextOneLine ? this.getTextHW(text.innerHTML, this.config.styles).width : this.getLayerWidth
    //       layerX = -(currTextWidth - this.getLayerWidth) / 2 + this.getLayerPos.x
    //       if (layerX <= 0) {
    //         layerX = 0
    //         // text.style.width = `${this.getLayerWidth}px`
    //         textSize.width = this.getLayerWidth
    //         ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
    //       } else if (layerX + currTextWidth >= page.offsetWidth) {
    //         layerX = page.offsetWidth - this.getLayerWidth
    //         // text.style.width = `${this.getLayerWidth}px`
    //         textSize.width = this.getLayerWidth
    //         ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
    //       } else {
    //         // text.style.width = `${text.getBoundingClientRect().width}px`
    //         // text.style.width = `${this.getTextHW(text.innerHTML, this.config.styles).width}px`
    //         // const HW = this.getTextHW(text.innerHTML, this.config.styles)
    //         const HW = TextUtils.getTextHW(this.config)
    //         // text.style.width = `${HW.width}px`
    //         textSize.width = HW.width
    //         textSize.height = HW.height
    //       }
    //     } else {
    //       textSize.width = text.getBoundingClientRect().width || this.config.widthLimit
    //       textSize.height = text.getBoundingClientRect().height
    //       // textSize.height = text.offsetHeight
    //       console.log(textSize)
    //       console.log(text)
    //     }
    //     text.style.whiteSpace = 'pre-wrap'
    //     // text.style.width = `${textSize.width / this.getLayerScale}px`
    //     // text.style.height = `${textSize.height / this.getLayerScale}px`
    //     // ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, props)
    //     ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)
    //     ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width / this.getLayerScale, textSize.height / this.getLayerScale, this.getFontSize + 1)
    //     ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getLayerScale)
    //     StepsUtils.record()
    //     this.isControlling = false
    //   }, 0)
    // },
    isNoCharactor(e: KeyboardEvent): boolean {
      if (e.key === 'Backspace') {
        return false
      }
      return e.key.length !== 1
    },
    onDblClick() {
      if (this.getLayerType !== 'image' || this.isLocked) return
      ControlUtils.updateImgControl(this.pageIndex, this.layerIndex, true)
    },
    onRightClick(event: MouseEvent) {
      if (!this.isLocked) {
        this.setIsLayerDropdownsOpened(true)
        if (this.currSelectedInfo.index < 0) {
          GroupUtils.select([this.layerIndex])
        }
        this.$nextTick(() => {
          const el = document.querySelector('.dropdowns--layer') as HTMLElement
          const mousePos = MouseUtils.getMouseAbsPoint(event)
          el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
          el.focus()
        })
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-controller {
  &__content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    &:hover {
      cursor: pointer;
    }
  }
  &__ctrl-points {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    box-sizing: border-box;
    &:hover {
      cursor: pointer;
    }
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
}

.text {
  &__p {
    margin: 0.5em;
  }
  &__span {
    text-align: left;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
}

.text-content {
  text-align: left;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
