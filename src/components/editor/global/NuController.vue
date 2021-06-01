<template lang="pug">
  keep-alive
    div
      div(class="nu-controller"
          ref="body"
          :layer-index="`${layerIndex}`"
          :style="styles()"
          @drop="config.clipper || config.isClipped ? onDropClipper($event) : onDrop($event)"
          @dragover.prevent,
          @dragenter.prevent
          @click.left="onClick"
          @click.right.stop="onRightClick"
          @mousedown.left.stop="moveStart"
          @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)"
          @mouseover.stop="toggleHighlighter(pageIndex,layerIndex,true)"
          @dblclick="onDblClick")
        span(class="text-content" :style="contextStyles()" ref="content"
          @blur="onFocusOut"
          @keydown="onKeyDown"
          @compositionstart="compositionStart"
          :contenteditable="config.textEditable")
      div(v-if="isActive && !isControlling && !isLocked"
          class="control-point-wrapper"
          :style="Object.assign(styles(), {'pointer-events': 'none'})")
          div(v-for="(scaler, index)  in controlPoints.scalers"
              class="controller-point"
              :key="index * 2"
              :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
              @mousedown.left.stop="scaleStart")
          div(v-for="(resizer, index) in resizer(controlPoints)"
              @mousedown.left.stop="resizeStart")
            div(class="resize-bar"
                :key="index * 2 + 1"
                :style="resizerBarStyles(resizer)")
            div(class="controller-point"
                :style="Object.assign(resizer, cursorStyles(index * 2 + 1, getLayerRotate))")
          div(class="rotaterWrapper")
            div(class="rotater" @mousedown.left.stop="rotateStart")
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

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    snapUtils: Object
  },
  data() {
    return {
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      initialWH: { width: 0, height: 0 },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, imgX: 0, imgY: 0, isHorizon: false },
      clickTime: new Date().toISOString(),
      isGetMoved: false,
      isCompositoning: false,
      isSnapping: false
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
    }
  },
  watch: {
    scaleRatio() {
      this.controlPoints = ControlUtils.getControlPoints(4, 25)
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
      const ControllerStyles = this.styles()
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
      }
      return resizer
    },
    contextStyles() {
      const zindex = this.config.type === 'tmp' ? (this.layerIndex + 1) * 50 : (this.layerIndex + 1) * 100 + 10
      const styles = {
        // width: `${this.config.styles.width}px`,
        transform: `translate3d(0px, 0px, ${zindex}px)`,
        color: 'rgba(10,10,10,0)',
        'font-size': `${this.getFontSize}px`,
        'caret-color': this.isGetMoved ? '#00000000' : '#000000',
        'pointer-events': this.config.textEditable ? 'initial' : 'none',
        'writing-mode': this.config.styles.writingMode
      }
      return Object.assign(CssConveter.convertFontStyle(this.config.styles), styles)
    },
    textInit() {
      const text = this.$refs.content as HTMLElement
      text.innerHTML = this.getTextContent
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        shown
      })
    },
    compositionStart() {
      this.isCompositoning = true
      const el = this.$refs.content as HTMLElement
      el.addEventListener('compositionend', this.compositionEnd)
    },
    compositionEnd() {
      this.isCompositoning = false
      const el = this.$refs.content as HTMLElement
      el.removeEventListener('compositionend', this.compositionEnd)
    },
    triggerTextEditor(pageIndex: number, layerIndex: number) {
      LayerUtils.updateLayerProps(pageIndex, layerIndex, {
        textEditable: true
      })
    },
    styles() {
      // const zindex = this.config.type === 'tmp' ? (this.layerIndex + 1) * 50 : (this.layerIndex + 1) * 100
      const zindex = (this.layerIndex + 1) * 50
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline: this.isShown || this.isActive ? ((this.config.type === 'tmp' || this.isControlling)
          ? `${2 * (100 / this.scaleRatio)}px dashed #7190CC` : `${2 * (100 / this.scaleRatio)}px solid #7190CC`) : 'none',
        'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'initial'
      }
    },

    moveStart(event: MouseEvent) {
      this.isControlling = true
      if (!this.config.locked) {
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        window.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
      }

      if (this.config.type === 'text') {
        const text = this.$refs.content as HTMLElement
        text.innerHTML = this.getTextContent
        this.isGetMoved = true
        this.clickTime = new Date().toISOString()
        ControlUtils.toggleTextEditable(this.pageIndex, this.layerIndex, true)
      }
      if (this.config.type !== 'tmp') {
        let targetIndex = this.layerIndex
        if (!this.isActive) {
          if ((!event.metaKey && !event.ctrlKey) && this.currSelectedInfo.index >= 0) {
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

        if (this.getLayerType === 'image') {
          this.imgHandler(totalOffset)
        }
      }
    },
    imgHandler(offset: ICoordinate) {
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY)
    },
    moveEnd() {
      if (this.isActive) {
        this.isControlling = false
        this.setCursorStyle('default')
        window.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
        StepsUtils.record()
      }
      setTimeout(() => {
        this.isGetMoved = false
      }, 350)
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
        ControlUtils.updateFontSize(this.pageIndex, this.layerIndex, this.config.styles.initSize * scale)
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
      // const offsetSnap = this.snapUtils.calcMoveSnap(this.config, this.layerIndex)
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

      if (this.getLayerType === 'image') {
        let offsetX
        let offsetY
        if ((this.control.isHorizon && this.control.xSign < 0) || (!this.control.isHorizon && this.control.ySign < 0)) {
          offsetX = offsetWidth
          offsetY = offsetHeight
        }
        if (this.imgResizeLimiter(width, height, offsetX, offsetY)) {
          return
        }
        this.imgResizeHandler(width, height, offsetX, offsetY)
      } else if (this.getLayerType === 'shape') {
        this.shapeResizeHandler(width, height)
      } else if (this.getLayerType === 'text') {
        const content = this.$refs.content as HTMLElement
        content.style.width = `${width}px`
        height = content.offsetHeight
        ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: width })
        ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, this.getFontSize)
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, this.config.styles.scale)
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
    imgResizeLimiter(width: number, height: number, offsetX: number | undefined, offsetY: number | undefined): boolean {
      const [imgWidth, imgHeight, scale] = [this.config.styles.imgWidth, this.config.styles.imgHeight, this.config.styles.scale]
      const imgPos = {
        x: this.control.imgX,
        y: this.control.imgY
      }
      const baseOffset = {
        x: -imgWidth / 2 + (width / scale) / 2,
        y: -imgHeight / 2 + (height / scale) / 2
      }
      const translateLimit = {
        width: (imgWidth - width / scale) / 2,
        height: (imgHeight - height / scale) / 2
      }
      if (typeof offsetX !== 'undefined' && typeof offsetY !== 'undefined') {
        offsetX /= this.config.styles.scale
        offsetY /= this.config.styles.scale
        imgPos.x += offsetX
        imgPos.y += offsetY
      }
      if (Math.abs(imgPos.x - baseOffset.x) > translateLimit.width || Math.abs(imgPos.y - baseOffset.y) > translateLimit.height) {
        return true
      }
      return false
    },
    imgResizeHandler(width: number, height: number, offsetX: number | undefined, offsetY: number | undefined) {
      ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, width, height, this.config.styles.scale)
      width /= this.config.styles.scale
      height /= this.config.styles.scale
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
      this.isControlling = false
      console.log('resize')
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
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, this.config.path || this.config.clipPath, this.config.styles)
    },
    onClick() {
      const clickDate = new Date(this.clickTime)
      const currDate = new Date()
      const diff = currDate.getTime() - clickDate.getTime()
      this.textClickHandler(diff)
    },
    textClickHandler(diff: number) {
      if (this.config.type === 'text' && diff < 1000) {
        this.isGetMoved = false
        ControlUtils.toggleTextEditable(this.pageIndex, this.layerIndex, true)
      }
    },
    onFocusOut() {
      ControlUtils.toggleTextEditable(this.pageIndex, this.layerIndex, false)
    },
    onKeyDown(e: KeyboardEvent) {
      if (this.config.type === 'text') {
        this.onTyping(e)
      }
    },
    onTyping(e: KeyboardEvent) {
      if (this.isGetMoved) {
        e.preventDefault()
      } else {
        ControlUtils.textBackspace(e)
        ControlUtils.textEnter(e, this.$refs.content as HTMLElement, this.isCompositoning)
        if (this.isNoCharactor(e)) return

        const text = this.$refs.content as HTMLElement
        text.style.width = 'auto'
        text.style.height = 'auto'

        const textTmp = text.innerHTML
        /**
         * Set the whiteSpace to 'pre' is used for getting the rect-size of the text content.
         * However, after set the whiteSpace back to 'pre-wrap', in real situation the text content sometimes still leads to problems (bug)
         * hence plus 5 to the offsetWidth for preventing this bug.
         */

        setTimeout(() => {
          /**
           * This line of code prevents the bug while deleting at begin of the text.
           */
          if (e.key === 'Backspace' && textTmp === text.innerHTML) return
          text.style.whiteSpace = 'pre'
          const isTextOneLine = Math.abs(this.getLayerHeight - text.offsetHeight) < text.offsetHeight
          const page = this.$parent.$el as HTMLElement

          const props = {
            text: text.innerHTML
          }
          const textSize = {
            width: Math.ceil(text.getBoundingClientRect().width + 5),
            // width: e.key === ' ' ? Math.ceil(text.getBoundingClientRect().width + 5) : dummyTextSize.width + 1,
            height: text.getBoundingClientRect().height
          }
          let layerX = this.getLayerPos.x
          const layerY = this.getLayerPos.y
          // TODO: take the rotate angle into pos-compensation consideration
          if (this.config.widthLimit === '') {
            const currTextWidth = isTextOneLine ? this.getTextHW(text.innerHTML, this.config.styles).width : this.getLayerWidth
            layerX = -(currTextWidth - this.getLayerWidth) / 2 + this.getLayerPos.x
            console.log('layerX', layerX)
            if (layerX <= 0) {
              layerX = 0
              text.style.width = `${this.getLayerWidth}px`
              textSize.width = this.getLayerWidth
              if (e.key !== ' ') {
                textSize.height = this.getTextHW(text.innerHTML, this.config.styles).height
              }
              // textSize.height = (Math.floor(dummyTextSize.width / textSize.width) + 1) * dummyTextSize.height
              ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
            } else if (layerX + currTextWidth >= page.offsetWidth) {
              layerX = page.offsetWidth - this.getLayerWidth
              text.style.width = `${this.getLayerWidth}px`
              textSize.width = this.getLayerWidth
              // textSize.height = (Math.floor(dummyTextSize.width / textSize.width) + 1) * dummyTextSize.height
              if (e.key !== ' ') {
                textSize.height = this.getTextHW(text.innerHTML, this.config.styles).height
              }
              ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, { widthLimit: this.getLayerWidth })
            } else {
              if (e.key !== ' ') {
                text.style.width = `${this.getTextHW(text.innerHTML, this.config.styles).width}px`
                const HW = this.getTextHW(text.innerHTML, this.config.styles)
                textSize.width = HW.width
                textSize.height = HW.height
              }
            }
          } else {
            text.style.width = `${this.config.widthLimit}px`
            textSize.width = this.config.widthLimit
            textSize.height = this.getTextHW(text.innerHTML, this.config.styles).height
          }
          console.log('widthLimit', this.config.widthLimit)
          // text.style.width = `${textSize.width}px`
          text.style.whiteSpace = 'pre-wrap'
          ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, props)
          ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)
          ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
        }, 0)
      }
    },
    // TODO: this function got bug**
    getTextHW(text: string, styles: any): { width: number, height: number } {
      const div = document.createElement('div')
      const el = document.createElement('span')
      const content = this.$refs.content as HTMLElement

      // el.style.width = this.isTextOnEdge ? `${this.getLayerWidth}px` : `${content.getBoundingClientRect().width}px`
      // div.style.width = this.isTextOnEdge ? `${this.getLayerWidth}px` : `${content.getBoundingClientRect().width}px`
      el.style.width = `${content.getBoundingClientRect().width}px`
      div.style.width = `${content.getBoundingClientRect().width}px`
      el.innerHTML = text
      div.appendChild(el)
      document.body.appendChild(div)
      el.style.whiteSpace = 'pre-wrap'
      el.style.overflowWrap = 'break-word'
      div.style.whiteSpace = 'pre-wrap'
      Object.assign(el.style, CssConveter.convertFontStyle(styles))
      const textHW = {
        width: Math.ceil(el.getBoundingClientRect().width),
        height: Math.ceil(el.getBoundingClientRect().height)
      }
      // console.log('layer')
      // console.log(this.getLayerWidth)
      // console.log(content.getBoundingClientRect().width)
      // document.body.removeChild(div)
      return textHW
    },
    isNoCharactor(e: KeyboardEvent): boolean {
      return e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Shift'
    },
    onDblClick() {
      if (this.getLayerType !== 'image') return
      ControlUtils.updateImgControl(this.pageIndex, this.layerIndex, true)
    },
    onRightClick(event: MouseEvent) {
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
})
</script>

<style lang="scss" scoped>
.nu-controller {
  display: flex;
  justify-content: center;
  align-items: center;
  // z-index: setZindex("nu-controller");
  white-space: pre-wrap;
  position: absolute;
  box-sizing: border-box;
  &:hover {
    cursor: pointer;
  }
}

.resize-bar {
  position: absolute;
  pointer-events: auto;
  border: 2.5px solid #00000000;
  color: "#00000000";
}

.controller-point {
  pointer-events: auto;
  position: absolute;
  background-color: setColor(white);
  border: 1.5px solid setColor(blue-2);
  transform-style: preserve-3d;
}
.control-point-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  // z-index: setZindex("nu-controller");
  position: absolute;
  box-sizing: border-box;
  &:hover {
    cursor: pointer;
  }
  pointer-events: "none";
}
.rotaterWrapper {
  position: absolute;
  top: 100%;
  padding: 20px;
}
.rotater {
  position: relative;
  left: 0;
  top: 0;
  width: 10px;
  height: 10px;
  background-color: blue;
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

    // onTyping(e: KeyboardEvent) {
    //   if (this.isGetMoved) {
    //     e.preventDefault()
    //   } else {
    //     ControlUtils.textBackspace(e)
    //     ControlUtils.textEnter(e, this.$refs.content as HTMLElement, this.isCompositoning)

    //     const text = this.$refs.content as HTMLElement
    //     /**
    //      * Set the whiteSpace to 'pre' is used for getting the rect-size of the text content.
    //      * However, after set the whiteSpace back to 'pre-wrap', in real situation the text content sometimes still leads to problems (bug)
    //      * hence plus 5 to the offsetWidth for preventing this bug.
    //      */
    //     text.style.whiteSpace = 'pre'
    //     setTimeout(() => {
    //       const props = {
    //         text: text.innerHTML
    //       }
    //       const textSize = {
    //         width: text.offsetWidth + 5,
    //         height: text.offsetHeight
    //       }
    //       const page = this.$parent.$el as HTMLElement

    //       text.style.whiteSpace = 'pre-wrap'
    //       ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, props)
    //       ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
    //       ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
    //     }, 0)
    //   }
    // },

    //     onTyping(e: KeyboardEvent) {
    //   if (this.isGetMoved) {
    //     e.preventDefault()
    //   } else {
    //     ControlUtils.textBackspace(e)
    //     ControlUtils.textEnter(e, this.$refs.content as HTMLElement, this.isCompositoning)

    //     const text = this.$refs.content as HTMLElement
    //     /**
    //      * Set the whiteSpace to 'pre' is used for getting the rect-size of the text content.
    //      * However, after set the whiteSpace back to 'pre-wrap', in real situation the text content sometimes still leads to problems (bug)
    //      * hence plus 5 to the offsetWidth for preventing this bug.
    //      */

    //     setTimeout(() => {
    //       const props = {
    //         text: text.innerHTML
    //       }
    //       const dummyTextSize = this.getTextHW(text.innerHTML, this.config.styles)
    //       console.log(dummyTextSize)
    //       console.log(e.key)
    //       text.style.whiteSpace = 'pre'
    //       const textSize = {
    //         width: e.key !== ' ' ? text.offsetWidth : text.offsetWidth + 5,
    //         height: text.offsetHeight
    //       }
    //       // console.log(textSize)
    //       const page = this.$parent.$el as HTMLElement
    //       let layerX = this.getLayerPos.x
    //       const layerY = this.getLayerPos.y
    //       // TODO: take the rotate angle into pos-compensation consideration
    //       if (this.config.widthLimit === '') {
    //         layerX = -(textSize.width - this.getLayerWidth) / 2 + this.getLayerPos.x
    //         // text.style.width = `${textSize.width}px`
    //         if (layerX <= 0) {
    //           /**
    //            * can't automatically change the span-size after we set the whiteSpace back to 'pre-wrap'
    //            * we need to manually change it in here.
    //            */
    //           text.style.width = `${this.getLayerWidth}px`
    //           textSize.width = this.getLayerWidth
    //           if (e.key !== ' ') {
    //             textSize.height = dummyTextSize.height
    //           }
    //           // textSize.height = (Math.floor(dummyTextSize.width / textSize.width) + 1) * dummyTextSize.height
    //           layerX = 0
    //         } else if (layerX + textSize.width >= page.offsetWidth) {
    //           text.style.width = `${this.getLayerWidth}px`
    //           textSize.width = this.getLayerWidth
    //           // textSize.height = (Math.floor(dummyTextSize.width / textSize.width) + 1) * dummyTextSize.height
    //           if (e.key !== ' ') {
    //             textSize.height = dummyTextSize.height
    //           }
    //           layerX = page.offsetWidth - this.getLayerWidth
    //         } else {
    //           if (e.key !== ' ') {
    //             text.style.width = `${textSize.width}px`
    //             textSize.height = dummyTextSize.height
    //           }
    //         }
    //       }
    //       text.style.whiteSpace = 'pre-wrap'
    //       ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, props)
    //       ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, layerX, layerY)
    //       ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
    //       ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
    //     }, 0)
    //   }
    // },
