<template lang="pug">
  keep-alive
    div(v-if="isShown || isActive"
        class="nu-controller"
        ref="body"
        :style="styles()"
        @drop="onDrop"
        @dragover.prevent,
        @dragenter.prevent
        @click="onClick"
        @mousedown.left.stop="moveStart"
        @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)")
      span(class="text-content" :style="contextStyles()" ref="content"
      @blur="onFocusOut"
      @keydown="onKeyDown"
      :contenteditable="this.config.textEditable")
      template(v-if="isActive && !isControlling")
        div(v-for="(scaler, index)  in controlPoints.scalers"
          class="controller-point"
          :key="index * 2"
          :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
          @mousedown.stop="scaleStart")
        div(v-for="(resizer, index) in controlPoints.resizers"
        class="controller-point"
        :key="index * 2 + 1"
        :style="Object.assign(resizer, cursorStyles(index * 2 + 1, getLayerRotate))"
        @mousedown.stop="resizeStart")
        div(class="rotaterWrapper")
          div(class="rotater" @mousedown.stop="rotateStart")
</template>

<script lang="ts">
import Vue from 'vue'
import PropsTransformer from '@/utils/propsTransformer'
import { mapGetters, mapMutations } from 'vuex'
import { ControlPoints } from '@/store/types'
import MouseUtils from '@/utils/mouseUtils'
import GroupUtils from '@/utils/groupUtils'
import CssConveter from '@/utils/cssConverter'
import ControlUtils from '@/utils/controllerUtils'
import { AxiosStatic } from 'axios'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number
  },
  data() {
    return {
      controlPoints: ControlPoints,
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      initialWH: { width: 0, height: 0 },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, isHorizon: false },
      clickTime: new Date().toISOString(),
      isGetMoved: false
    }
  },
  // mounted() {
  //   this.$nextTick(() => {
  //     const text = this.$refs.content as HTMLElement
  //     text.innerHTML = this.getTextContent
  //   })
  // },
  computed: {
    ...mapGetters({
      currSelectedInfo: 'getCurrSelectedInfo',
      scaleRatio: 'getPageScaleRatio'
    }),
    getControlPoints(): any {
      return this.config.controlPoints
    },
    isActive(): boolean {
      return this.config.active
    },
    isShown(): boolean {
      return this.config.shown
    },
    getLayerX(): number {
      return this.config.styles.x
    },
    getLayerY(): number {
      return this.config.styles.y
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
  methods: {
    ...mapMutations({
      updateLayerStyles: 'Update_layerStyles',
      updateLayerProps: 'Update_layerProps',
      updateTmpLayerStyles: 'Update_tmpLayerStyles',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex'
    }),
    contextStyles() {
      const styles = {
        color: 'rgba(10,10,10,0)',
        'font-size': `${this.getFontSize}px`,
        'caret-color': this.isGetMoved ? '#00000000' : '#000000',
        'pointer-events': this.config.textEditable ? 'initial' : 'none'
      }
      return Object.assign(CssConveter.convertFontStyle(this.config.styles), styles)
    },
    cursorStyles(index: number, rotateAngle: number) {
      const cursorIndex = rotateAngle >= 0 ? (index + Math.floor(rotateAngle / 45)) % 8
        : (index + Math.ceil(rotateAngle / 45) + 8) % 8
      return { cursor: this.controlPoints.cursors[cursorIndex] }
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
      return {
        transform: `translate(${this.config.styles.x}px, ${this.config.styles.y}px) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        border: this.isShown || this.isActive ? '3px solid #7190CC' : 'none',
        'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'none'
      }
    },

    moveStart(event: MouseEvent) {
      if (event.target === this.$refs.body) {
        this.isControlling = true
        const layer = this.$el as HTMLElement
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        layer.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
        if (this.config.type === 'text') {
          const text = this.$refs.content as HTMLElement
          text.innerHTML = this.getTextContent
          this.isGetMoved = true
          this.clickTime = new Date().toISOString()
          this.toggleTextEditable(this.pageIndex, this.layerIndex, true)
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
          const targetIndex = (GroupUtils.tmpIndex > this.layerIndex || GroupUtils.tmpIndex < 0 || GroupUtils.tmpLayers.length === 0)
            ? this.layerIndex : this.layerIndex + GroupUtils.tmpLayers.length - 1
          if (!this.isActive) {
            if (!event.metaKey && GroupUtils.tmpIndex >= 0) {
              GroupUtils.deselect()
            }
            this.setLastSelectedPageIndex(this.pageIndex)
            GroupUtils.select([targetIndex])
          }
        }
      }
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        this.setCursorStyle('move')
        event.preventDefault()
        var offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
        const moveOffset = PropsTransformer.getActualMoveOffset(offsetPos.x, offsetPos.y)
        this.initialPos.x += offsetPos.x
        this.initialPos.y += offsetPos.y
        GroupUtils.movingTmp(
          this.pageIndex,
          {
            x: moveOffset.offsetX,
            y: moveOffset.offsetY
          }
        )
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
      this.initTranslate = {
        x: this.getLayerX,
        y: this.getLayerY
      }
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)

      // Get client point as no rotation
      const clientP = ControlUtils.getRelPosToCenter(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1

      // TODO: discussion cursor's styling
      let cursorIndex = this.control.xSign + this.control.ySign
      if (cursorIndex === 0 && this.control.xSign === -1) {
        cursorIndex = 6
      } else {
        cursorIndex = cursorIndex === -2 ? 0 : cursorIndex === 2 ? 4 : 2
      }
      const cursor = this.cursorStyles(cursorIndex, this.getLayerRotate).cursor
      this.setCursorStyle(cursor)

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

      const scale = width / this.config.styles.initWidth
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
      this.initTranslate = {
        x: this.getLayerX,
        y: this.getLayerY
      }
      const vect = MouseUtils.getMouseRelPoint(event, center)
      const angeleInRad = this.getLayerRotate * Math.PI / 180
      const clientP = ControlUtils.getRelPosToCenter(vect, center, angeleInRad)

      this.control.xSign = (clientP.x - center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - center.y > 0) ? 1 : -1
      this.control.isHorizon = ControlUtils.dirHandler(clientP, rect)

      this.initialPos = { x: event.clientX, y: event.clientY }
      document.documentElement.addEventListener('mousemove', this.resizing)
      document.documentElement.addEventListener('mouseup', this.resizeEnd)
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
      // const scale = width / this.config.styles.initWidth
      ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, width, height, 1)
      ControlUtils.updateLayerPos(this.pageIndex, this.layerIndex, trans.x, trans.y)
    },
    resizeEnd(event: MouseEvent) {
      this.isControlling = false
      document.documentElement.removeEventListener('mousemove', this.resizing)
      document.documentElement.removeEventListener('mouseup', this.resizeEnd)
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
    },
    setCursorStyle(cursor: string) {
      const layer = this.$el as HTMLElement
      layer.style.cursor = cursor
      document.body.style.cursor = cursor
    },
    onDrop(e: DragEvent) {
      const targetOffset = { x: this.getLayerX, y: this.getLayerY }
      MouseUtils.onDrop(e, this.pageIndex, targetOffset)
    },
    onClick(e: MouseEvent) {
      const clickDate = new Date(this.clickTime)
      const currDate = new Date()
      const diff = currDate.getTime() - clickDate.getTime()

      this.textClickHandler(diff)
    },
    textClickHandler(diff: number) {
      if (this.config.type === 'text' && diff < 100) {
        this.isGetMoved = false
        this.toggleTextEditable(this.pageIndex, this.layerIndex, true)
      }
    },
    onFocusOut() {
      this.toggleTextEditable(this.pageIndex, this.layerIndex, false)
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
        this.textBackspace(e)
        this.textEnter(e)

        const text = this.$refs.content as HTMLElement
        setTimeout(() => {
          const props = {
            text: text.innerHTML
          }
          const textSize = {
            width: text.offsetWidth,
            height: text.offsetHeight
          }
          this.updateTextProps(this.pageIndex, this.layerIndex, props)
          this.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
          ControlUtils.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
        }, 0)
      }
    },
    textBackspace(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return
      e.stopPropagation()
    },
    textEnter(e: KeyboardEvent) {
      if (e.key !== 'Enter') return
      e.preventDefault()

      const docFragment = document.createDocumentFragment()
      const br = document.createElement('br')
      docFragment.appendChild(br)

      let range = window.getSelection()?.getRangeAt(0)
      if (range) {
        range.deleteContents()
        range.insertNode(docFragment)
      }

      range = document.createRange()
      range.setStartAfter(br)
      range.collapse(true)

      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(range)
      }

      if ((this.$refs.content as HTMLElement).lastChild?.nodeName !== 'BR') {
        const br = document.createElement('br') as HTMLBRElement
        (this.$refs.content as HTMLElement).appendChild(br)
      }
    },
    toggleTextEditable(pageIndex: number, layerIndex: number, isEditable: boolean) {
      const props = {
        textEditable: isEditable
      }
      this.updateTextProps(this.pageIndex, this.layerIndex, props)
    },
    updateTextProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | null }) {
      this.updateLayerProps({
        pageIndex,
        layerIndex,
        props
      })
    },
    updateLayerInitSize(pageIndex: number, layerIndex: number, initWidth: number, initHeight: number, initSize: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          initWidth,
          initHeight,
          initSize
        }
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
  z-index: setZindex("nu-controller");
  position: absolute;
  border: 3px solid setColor(blue-2);
  box-sizing: border-box;
  &:active {
    border: 1px solid rgb(174, 46, 190);
  }
  &:hover {
    cursor: pointer;
  }
}
.controller-point {
  pointer-events: auto;
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: setColor(white);
  border: 2px solid setColor(blue-2);
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
