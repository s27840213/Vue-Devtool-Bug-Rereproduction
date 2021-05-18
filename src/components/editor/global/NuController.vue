<template lang="pug">
  keep-alive
    div(v-show="!isControlling"
        class="nu-controller"
        ref="body"
        :layer-index="`${layerIndex}`"
        :style="styles()"
        @drop="!config.clipper ? onDrop($event) : onDropClipper($event)"
        @dragover.prevent,
        @dragenter.prevent
        @click="onClick"
        @mousedown.left.stop="moveStart"
        @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)"
        @mouseover.stop="toggleHighlighter(pageIndex,layerIndex,true)"
        @dblclick="onDblClick")
      span(class="text-content" :style="contextStyles()" ref="content"
        @blur="onFocusOut"
        @keydown="onKeyDown"
        @compositionstart="compositionStart"
        :contenteditable="this.config.textEditable")
      template(v-if="isActive")
        div(v-for="(scaler, index)  in controlPoints.scalers"
            class="controller-point"
            :key="index * 2"
            :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
            @mousedown.left.stop="scaleStart")
        div(v-for="(resizer, index) in controlPoints.resizers"
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
import ControlUtils from '@/utils/controllerUtils'
import { ICoordinate } from '@/interfaces/frame'
import { IGroup, IImage, IShape, IText, ITmp } from '@/interfaces/layer'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    snaplines: Object,
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
      control: { xSign: 1, ySign: 1, isHorizon: false },
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
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
      scaleRatio: 'getPageScaleRatio'
    }),
    getLayerPos(): ICoordinate {
      return {
        x: this.config.styles.x,
        y: this.config.styles.y
      }
    },
    getControlPoints(): any {
      return this.config.controlPoints
    },
    isActive(): boolean {
      return this.config.active
    },
    isShown(): boolean {
      return this.config.shown
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
      updateLayerStyles: 'UPDATE_layerStyles',
      updateLayerProps: 'UPDATE_layerProps',
      updateTmpLayerStyles: 'UPDATE_tmpLayerStyles',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex'
    }),
    resizerBarStyles(resizer: any) {
      const resizerStyle = Object.assign({}, resizer)
      const ControllerStyles = this.styles()
      const HW = {
        //  get the widht/height of the controller for resizer-bar and minus the scaler size
        width: resizerStyle.width < resizerStyle.height ? `${parseInt(ControllerStyles.width) - 20}px` : resizerStyle.width,
        height: resizerStyle.width > resizerStyle.height ? `${parseInt(ControllerStyles.height) - 20}px` : resizerStyle.height
      }
      return Object.assign(resizerStyle, HW)
    },
    contextStyles() {
      const styles = {
        color: 'rgba(10,10,10,0)',
        'font-size': `${this.getFontSize}px`,
        'caret-color': this.isGetMoved ? '#00000000' : '#000000',
        'pointer-events': this.config.textEditable ? 'initial' : 'none',
        'writing-mode': this.config.styles.writingMode
      }
      return Object.assign(CssConveter.convertFontStyle(this.config.styles), styles)
    },
    toggleHighlighter(pageIndex: number, layerIndex: number, shown: boolean) {
      this.updateLayerProps({
        pageIndex,
        layerIndex,
        props: {
          shown
        }
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
      this.updateLayerProps({
        pageIndex,
        layerIndex,
        props: {
          textEditable: true
        }
      })
    },
    styles() {
      const zindex = this.config.type === 'tmp' ? (this.layerIndex + 1) * 50 : (this.layerIndex + 1) * 100

      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline: this.isShown || this.isActive ? (this.config.type === 'tmp'
          ? `${2 * (100 / this.scaleRatio)}px dashed #7190CC` : `${3 * (100 / this.scaleRatio)}px solid #7190CC`) : 'none',
        'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'initial'
      }
    },

    moveStart(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      if (event.target === this.$refs.body) {
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        window.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)

        if (this.config.type === 'text') {
          const text = this.$refs.content as HTMLElement
          text.innerHTML = this.getTextContent
          this.isGetMoved = true
          this.clickTime = new Date().toISOString()
          ControlUtils.toggleTextEditable(this.pageIndex, this.layerIndex, true)
        }
        this.setCursorStyle('move')
        if (this.config.type !== 'tmp') {
          /**
           * @param {number} targetIndex - target index is used to determine the selected target layer after all layers in tmp being pushed into page
           * the reason why we need this variable is when we ungroup a tmp layer and push all selected layers into page
           * the original layerIndex may represent the different layer, and this condition will happen when the tmp index is smaller than the layer you click
           * for example, assume there are three layers in the page 0, and then we select layer 0 and layer 1 to generate a tmp layer(it will become layer 0)
           * and the original layer 2 will become layer 1. Once we click on the this layer 1(layerIndex = 1), the layer 0(tmp layer) will be ungroup(deselect), push all layers into page
           * and the original layer 1 will become layer 2, so if we directly use layerIndex 1 to select the layer we will get the wrong target
           * Thus, we need to do some condition checking to prevent this error
           */
          // const targetIndex = (GroupUtils.tmpIndex > this.layerIndex || GroupUtils.tmpIndex < 0 || event.metaKey || GroupUtils.tmpLayers.length === 0)
          //   ? this.layerIndex : this.layerIndex + GroupUtils.tmpLayers.length - 1
          let targetIndex = this.layerIndex
          if (!this.isActive) {
            if ((!event.metaKey && !event.ctrlKey) && GroupUtils.tmpIndex >= 0) {
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
      }
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        this.isControlling = true
        this.setCursorStyle('move')
        event.preventDefault()
        var offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
        const moveOffset = MathUtils.getActualMoveOffset(offsetPos.x, offsetPos.y)

        GroupUtils.movingTmp(
          this.pageIndex,
          {
            x: moveOffset.offsetX,
            y: moveOffset.offsetY
          }
        )
        const imgControllerPos = {
          x: this.config.styles.imgController.x + offsetPos.x,
          y: this.config.styles.imgController.y + offsetPos.y
        }
        ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, this.config.styles.imgX, this.config.styles.imgY, imgControllerPos)
        const offsetSnap = this.calcSnap(this.config, this.layerIndex)
        this.initialPos.x += (offsetPos.x + offsetSnap.x)
        this.initialPos.y += (offsetPos.y + offsetSnap.y)
      }
    },
    moveEnd() {
      if (this.isActive) {
        this.isControlling = false
        this.setCursorStyle('default')
        document.documentElement.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
      }
      setTimeout(() => {
        this.isGetMoved = false
      }, 350)
      this.$emit('clearSnap')
    },
    scaleStart(event: MouseEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)

      const body = this.$el as HTMLElement
      this.initialWH = {
        width: this.getLayerWidth,
        height: this.getLayerHeight
      }
      const rect = this.$el.getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)
      this.initTranslate = this.getLayerPos
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)

      // Get client point as no rotation
      const clientP = ControlUtils.getRelPosToCenter(vect, this.center, angleInRad)

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
      const diff = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const [dx, dy] = [diff.x, diff.y]

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
      const scale = Math.max(ratio.width, ratio.height)
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)

      if (this.config.type === 'text') {
        ControlUtils.updateFontSize(this.pageIndex, this.layerIndex, this.config.styles.initSize * scale)
      }
    },
    scaleEnd() {
      this.isControlling = false
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
      this.initTranslate = this.getLayerPos
      const vect = MouseUtils.getMouseRelPoint(event, center)
      const angeleInRad = this.getLayerRotate * Math.PI / 180
      const clientP = ControlUtils.getRelPosToCenter(vect, center, angeleInRad)

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

      if (this.config.type === 'shape') {
        this.shapeHandler(width, height, initWidth, initHeight)
      }
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, 1)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    shapeHandler(width: number, height: number, initWidth: number, initHeight: number) {
      const scaleX = width / initWidth
      const scaleY = height / initHeight

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
    resizeEnd(event: MouseEvent) {
      this.isControlling = false
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.resizing)
      document.documentElement.removeEventListener('mouseup', this.resizeEnd)
      this.$emit('setFocus')
    },
    rotateStart(event: MouseEvent) {
      this.isControlling = true
      this.setCursorStyle('move')

      const body = this.$el
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

      let angle = Math.acos(ADotB / (lineA * lineB)) * 180 / Math.PI
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
      MouseUtils.onDropClipper(e, this.pageIndex, this.layerIndex, this.getLayerPos, this.config.path, this.config.styles)
    },
    onClick(e: MouseEvent) {
      e.preventDefault()
      const clickDate = new Date(this.clickTime)
      const currDate = new Date()
      const diff = currDate.getTime() - clickDate.getTime()
      this.textClickHandler(diff)
    },
    textClickHandler(diff: number) {
      if (this.config.type === 'text' && diff < 100) {
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

        const text = this.$refs.content as HTMLElement
        setTimeout(() => {
          const props = {
            text: text.innerHTML
          }
          const textSize = {
            width: text.offsetWidth,
            height: text.offsetHeight
          }
          ControlUtils.updateTextProps(this.pageIndex, this.layerIndex, props)
          ControlUtils.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
        }, 0)
      }
    },
    onDblClick(e: MouseEvent) {
      console.log('zz')
      ControlUtils.updateImgControl(this.pageIndex, this.layerIndex, true)
    },
    calcSnap(layer: ITmp | IGroup | IShape | IText | IImage, layerIndex: number) {
      const snaplinePos = this.snapUtils.getSnaplinePos()
      const layerSnapInfo = this.snapUtils.getLayerSnappingEdges(layer)
      const targetSnapLines = this.snapUtils.getClosestSnaplines(snaplinePos, layerSnapInfo)
      this.snaplines.v = targetSnapLines.v
      this.snaplines.h = targetSnapLines.h

      const snaplines = [...this.snaplines.v, ...this.snaplines.h]
      const snapResult = { x: layer.styles.x, y: layer.styles.y }
      const offset = {
        x: 0,
        y: 0
      }
      if (snaplines.length === 0) {
        return offset
      }
      snaplines.forEach((snapline: any) => {
        if (snapline.orientation === 'V') {
          snapResult.x = snapline.pos + snapline.offset
          offset.x = snapResult.x - layer.styles.x
        } else {
          snapResult.y = snapline.pos + snapline.offset
          offset.y = snapResult.y - layer.styles.y
        }
      })
      ControlUtils.updateLayerPos(this.pageIndex, layerIndex, snapResult.x, snapResult.y)
      return offset
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
  position: absolute;
  box-sizing: border-box;
  &:hover {
    cursor: pointer;
  }
}

.resize-bar {
  position: absolute;
  color: "#00000000";
}

.controller-point {
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
  position: relative;
  left: 0;
  top: 0;
  width: 10px;
  height: 10px;
  background-color: blue;
  cursor: move;
}
.text-content {
  position: absolute;
  top: 0;
  left: 0;
  display: inline-block;
  outline: none;
  white-space: nowrap;
  overflow-wrap: break-word;
}
</style>
