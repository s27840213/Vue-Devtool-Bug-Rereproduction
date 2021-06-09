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
        span(class="text-content" :style="contextStyles()" ref="text"
          @keydown="onKeyDown"
          @compositionstart="compositionStart"
          :contenteditable="config.type === 'tmp' ? false : contentEditable")
        div(v-if="isActive && isLocked"
            class="nu-controller__lock-icon")
          svg-icon(:iconName="'lock'" :iconWidth="'20px'" :iconColor="'red'"
            @click.native="MappingUtils.mappingIconAction('unlock')")
      div(v-if="isActive && !isControlling && !isLocked"
          class="nu-controller__ctrl-points"
          :style="Object.assign(styles('control-point'), {'pointer-events': 'none'})")
          div(v-for="(scaler, index)  in controlPoints.scalers"
              class="control-point"
              :key="index * 2"
              :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
              @mousedown.left.stop="scaleStart")
          div(v-for="(resizer, index) in resizer(controlPoints)"
              @mousedown.left.stop="resizeStart")
            div(class="resize-bar"
                :key="index * 2 + 1"
                :style="resizerBarStyles(resizer)")
            div(class="control-point"
                :style="Object.assign(resizer, cursorStyles(index * 2 + 1, getLayerRotate))")
          div(class="rotaterWrapper")
            div(class="rotater" @mousedown.left.stop="rotateStart")
              svg-icon(:iconName="'rotate'" :iconWidth="'20px'" :iconColor="'gray-2'")
</template>
<script lang="ts">
import Vue from 'vue'
import MathUtils from '@/utils/mathUtils'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controlUtils'
import StepsUtils from '@/utils/stepsUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IControlPoints, IResizer } from '@/interfaces/controller'
import LayerUtils from '@/utils/layerUtils'
import GeneralUtils from '@/utils/generalUtils'
import MappingUtils from '@/utils/mappingUtils'

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
      isGetMoved: false,
      isCompositoning: false,
      isSnapping: false,
      contentEditable: false
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
    this.textInit()
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio',
      currSelectedInfo: 'getCurrSelectedInfo'
    }),
    changedSize(): any {
      return {
        width: this.getLayerWidth,
        height: this.getLayerHeight
      }
    },
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
    getTextContent(): string {
      return this.config.text
    },
    getLayerScale(): number {
      return this.config.styles.scale
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
    },
    // 'config.styles.size': function() {
    //   if (this.getLayerType !== 'text') return
    //   this.$nextTick(() => {
    //     const text = this.$refs.text as HTMLElement
    //     text.style.width = `${this.getLayerWidth}px`
    //   })
    // }
    changedSize: {
      handler: function() {
        if (this.getLayerType !== 'text') return
        // console.log('size change')
        this.$nextTick(() => {
          const text = this.$refs.text as HTMLElement
          if (text) {
            // console.log(this.config.styles)
            // console.log(this.getLayerHeight)
            text.style.width = `${this.getLayerWidth}px`
          }
        })
      },
      deep: true
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
      let resizer = controlPoints.resizers
      if (this.getLayerType === 'text') {
        resizer = this.config.styles.writingMode.substring(0, 8) === 'vertical' ? controlPoints.resizers.slice(2, 4)
          : controlPoints.resizers.slice(0, 2)
      } else if (this.getLayerType === 'image') {
        resizer = this.config.isClipped ? [] : resizer
      } else if (this.getLayerType === 'shape' && this.config.category !== 'rect') {
        resizer = []
      } else if (this.getLayerType === 'tmp') {
        resizer = []
      }
      return resizer
    },
    contextStyles() {
      const zindex = this.config.type === 'tmp' ? (this.layerIndex + 1) * 50 : (this.layerIndex + 1) * 100 + 10
      const styles = {
        // width: `${this.config.styles.width}px`,
        transform: `translate3d(0px, 0px, ${zindex}px)`,
        color: 'rgba(10,10,10,0.5)',
        'font-size': `${this.getFontSize}px`,
        'caret-color': this.contentEditable && !this.isControlling ? '#000000' : '#00000000',
        // 'pointer-events': this.config.textEditable ? 'initial' : 'none',
        'writing-mode': this.config.styles.writingMode
      }
      return Object.assign(CssConveter.convertFontStyle(this.config.styles), styles)
    },
    textInit() {
      if (this.getLayerType !== 'text') return
      const text = this.$refs.text as HTMLElement
      text.innerHTML = this.getTextContent
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    compositionStart() {
      this.isCompositoning = true
      const el = this.$refs.text as HTMLElement
      el.addEventListener('compositionend', this.compositionEnd)
    },
    compositionEnd() {
      this.isCompositoning = false
      const el = this.$refs.text as HTMLElement
      el.removeEventListener('compositionend', this.compositionEnd)
    },
    // triggerTextEditor(pageIndex: number, layerIndex: number) {
    //   LayerUtils.updateLayerProps(pageIndex, layerIndex, {
    //     textEditable: true
    //   })
    // },
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
      console.log(this.config)
      if (this.getLayerType === 'text' && this.isActive && this.contentEditable) return
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
          // console.log(this.isActive)
          if (this.pageIndex === this.lastSelectedPageIndex) {
            // if (this.getLayerType === 'text' && !this.isActive) {
            //   GroupUtils.select([targetIndex])
            //   window.removeEventListener('mouseup', this.moveEnd)
            //   window.removeEventListener('mousemove', this.moving)
            //   return
            // }
            GroupUtils.select([targetIndex])
          }
          // console.log(this.isActive)
        }
      }

      if (this.config.type === 'text') {
        const text = this.$refs.text as HTMLElement
        this.initTranslate = this.getLayerPos
        text.innerHTML = this.getTextContent
        this.isGetMoved = false
        this.contentEditable = true
      }
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        event.preventDefault()
        this.setCursorStyle('move')
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
        if (this.getLayerType === 'text' && (posDiff.x > 10 || posDiff.y > 10)) {
          this.isGetMoved = true
          this.contentEditable = false
        } else {
          this.contentEditable = true
        }
        this.isControlling = false
        this.setCursorStyle('default')
        window.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
        StepsUtils.record()
        console.log('xsdfdsf')
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
        width: width / this.config.styles.initWidth,
        height: height / this.config.styles.initHeight
      }
      /**
       * TO times the initSize is for synchronizing the img-resizer.
       * after resizing the img's clip-path, the initWidth and initHeight will be reset
       * However the scaling factor of the layer needs to be reserved, which is the initSize used for.
       */
      let scale = Math.max(ratio.width, ratio.height)
      if (this.getLayerType === 'image') {
        scale *= typeof this.config.styles.initSize === 'undefined' ? 1 : this.config.styles.initSize
      }
      if (this.config.type === 'text') {
        const text = this.$refs.text as HTMLElement
        text.style.width = `${width}px`
        text.style.height = `${height}px`
        ControlUtils.updateFontSize(this.pageIndex, this.layerIndex, this.config.styles.initSize * scale)
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
      // const offsetSnap = this.snapUtils.calcScaleSnap(this.config, this.layerIndex)
      // this.$emit('getClosestSnaplines')
    },
    scaleEnd() {
      if (this.getLayerType === 'text') {
        ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
      }
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
      const vect = MouseUtils.getMouseRelPoint(event, center)
      const angeleInRad = this.getLayerRotate * Math.PI / 180
      const clientP = ControlUtils.getNoRotationPos(vect, center, angeleInRad)

      this.control.xSign = (clientP.x - center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - center.y > 0) ? 1 : -1
      this.control.isHorizon = ControlUtils.dirHandler(clientP, rect)

      this.initialPos = { x: event.clientX, y: event.clientY }
      document.documentElement.addEventListener('mousemove', this.resizing)
      document.documentElement.addEventListener('mouseup', this.resizeEnd)

      this.currCursorStyling(event)
    },
    resizing(event: MouseEvent) {
      event.preventDefault()
      let width = this.getLayerWidth
      let height = this.getLayerHeight

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const diff = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const [dx, dy] = [diff.x, diff.y]

      const offsetWidth = this.control.isHorizon ? this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad)) : 0
      const offsetHeight = this.control.isHorizon ? 0 : this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 && offsetHeight === 0) return

      const initWidth = this.initialWH.width
      const initHeight = this.initialWH.height
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

      let scale = this.getLayerScale
      if (this.getLayerType === 'image') {
        this.imgResizeHandler(width, height, offsetWidth, offsetHeight)
      } else if (this.getLayerType === 'shape') {
        this.shapeResizeHandler(width, height)
      } else if (this.getLayerType === 'text') {
        [width, height] = this.textResizeHandler(width, height)
        scale = 1
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    shapeResizeHandler(width: number, height: number) {
      if (this.config.category === 'rect') {
        const viewBox = [0, 0, 0, 0]
        viewBox[2] = width
        viewBox[3] = height
        const path = `M0 0 L0 ${height} ${width} ${height} ${width} 0Z`
        ControlUtils.updateShapeProps(this.pageIndex, this.layerIndex, viewBox, path)
        ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, 1)
      }
      if (this.config.category === 'circle') {
        // TODO
      }
    },
    resizeExceedLimit(width: number, height: number, offsetX: number, offsetY: number): boolean {
      const imgPos = {
        x: this.control.imgX,
        y: this.control.imgY
      }
      /**
       * Below is a conclusion of checking-if-the-Resizer-exceed-limit for the top/left resizer
       * The origin algorithm is described as in imgContorller.vue: moving section
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
    imgScaling(layerWidth:number, layerHeight: number, offsetWidth: number, offsetHeight: number) {
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
       * be caused by the 'nubmer-rounding' of the ratio.
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
      // if ((this.control.isHorizon && this.control.xSign < 0) || (!this.control.isHorizon && this.control.ySign < 0)) {
      //   ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgPos.x - this.imgBuffer.x, imgPos.y - this.imgBuffer.y)
      // } else {
      //   // ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgPos.x, imgPos.y)
      //   ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgPos.x - this.imgBuffer.x, imgPos.y - this.imgBuffer.y)
      // }
      // if (this.control.isHorizon) {
      //   ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, imgPos.y)
      // } else {
      //   ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, imgPos.x, this.config.styles.imgY)
      // }
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
    textResizeHandler(width: number, height: number): [number, number] {
      const text = this.$refs.text as HTMLElement
      if (text && this.config.styles.writingMode.substring(0, 8) !== 'vertical') {
        text.style.height = 'auto'
        text.style.width = `${width}px`
        height = Math.ceil(text.getBoundingClientRect().height)
        ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: width })
        ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, this.getFontSize / this.getLayerScale)
      }
      return [width, height]
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
      console.log('xxx')
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, this.config.path || this.config.clipPath, this.config.styles)
    },
    onClick() {
      this.textClickHandler()
    },
    textClickHandler() {
      if (this.config.type === 'text' && this.isActive && !this.isGetMoved) {
        this.contentEditable = true
      }
    },
    onKeyDown(e: KeyboardEvent) {
      if (this.config.type === 'text') {
        this.onTyping(e)
      }
    },
    onTyping(e: KeyboardEvent) {
      ControlUtils.textStopPropagation(e)
      ControlUtils.textEnter(e, this.$refs.text as HTMLElement, this.isCompositoning, this.config.styles.size)
      if (e.metaKey && e.key === 'z') {
        StepsUtils.undo()
        setTimeout(() => {
          const text = this.$refs.text as HTMLElement
          text.innerHTML = this.getTextContent
          text.style.width = `${this.getLayerWidth}px`
        }, 0)
        return
      }
      if (this.isNoCharactor(e)) return
      const text = this.$refs.text as HTMLElement
      text.style.width = 'auto'
      text.style.height = 'auto'

      const textTmp = text.innerHTML
      /**
       * Set the whiteSpace to 'pre' is used for getting the rect-size of the text content.
       */
      text.style.whiteSpace = 'pre'
      setTimeout(() => {
        /**
         * This line of code prevents the bug while deleting at beginning of the text.
         */
        if (e.key === 'Backspace' && textTmp === text.innerHTML) return
        const isTextOneLine = Math.abs(this.getLayerHeight - text.offsetHeight) < text.offsetHeight
        const props = {
          text: text.innerHTML
        }
        const textSize = {
          width: Math.ceil(text.getBoundingClientRect().width),
          height: text.getBoundingClientRect().height
        }
        let layerX = this.getLayerPos.x
        const layerY = this.getLayerPos.y
        // TODO: take the rotate angle into pos-compensation consideration
        if (this.config.widthLimit === '') {
          const page = this.$parent.$el as HTMLElement
          const currTextWidth = isTextOneLine ? text.getBoundingClientRect().width : this.getLayerWidth
          // const currTextWidth = isTextOneLine ? this.getTextHW(text.innerHTML, this.config.styles).width : this.getLayerWidth
          layerX = -(currTextWidth - this.getLayerWidth) / 2 + this.getLayerPos.x
          if (layerX <= 0) {
            layerX = 0
            text.style.width = `${this.getLayerWidth}px`
            textSize.width = this.getLayerWidth
            ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
          } else if (layerX + currTextWidth >= page.offsetWidth) {
            layerX = page.offsetWidth - this.getLayerWidth
            text.style.width = `${this.getLayerWidth}px`
            textSize.width = this.getLayerWidth
            ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
          } else {
            // text.style.width = `${text.getBoundingClientRect().width}px`
            text.style.width = `${this.getTextHW(text.innerHTML, this.config.styles).width}px`
            const HW = this.getTextHW(text.innerHTML, this.config.styles)
            textSize.width = HW.width
          }
        } else {
          text.style.width = `${this.config.widthLimit}px`
          textSize.width = this.config.widthLimit
        }

        text.style.whiteSpace = 'pre-wrap'
        ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, props)
        ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)
        ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
        ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
        StepsUtils.record()
      }, 0)
    },
    getTextHW(innerText: string, styles: any): { width: number, height: number } {
      const el = document.createElement('span')
      const text = this.$refs.text as HTMLElement
      el.style.width = `${text.getBoundingClientRect().width}px`
      el.innerHTML = innerText
      document.body.appendChild(el)
      el.style.whiteSpace = 'pre-wrap'
      el.style.overflowWrap = 'break-word'
      Object.assign(el.style, CssConveter.convertFontStyle(styles))
      const textHW = {
        width: Math.ceil(el.getBoundingClientRect().width),
        height: Math.ceil(el.getBoundingClientRect().height)
      }
      document.body.removeChild(el)
      return textHW
    },
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
    white-space: pre-wrap;
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

.resize-bar {
  position: absolute;
  pointer-events: auto;
  border: 2.5px solid #00000000;
  color: "#00000000";
}

.control-point {
  pointer-events: auto;
  position: absolute;
  background-color: setColor(white);
  border: 1.5px solid setColor(blue-2);
  transform-style: preserve-3d;
}

.rotaterWrapper {
  position: absolute;
  top: 100%;
  padding: 20px;
}
.rotater {
  @include size(20px, 20px);
  position: relative;
  left: 0;
  top: 0;
  pointer-events: auto;
  cursor: move;
}
.text-content {
  text-align: left;
  display: inline-block;
  outline: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>
