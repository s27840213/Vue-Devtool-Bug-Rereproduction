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
        div(v-for="(controlPoint, index) in controlPoints.positions"
          class="scaler"
          :key="index"
          :style="Object.assign(controlPoint, cursorStyles(index, getLayerRotate))"
          @mousedown.stop="scaleStart")
        div(class="rotaterWrapper")
          div(class="rotater" @mousedown.stop="rotateStart")
</template>

<script lang="ts">
import Vue from 'vue'
import PropsTransformer from '@/utils/propsTransformer'
import { mapGetters, mapMutations } from 'vuex'
import { ControlPoints } from '@/store/types'
import MouseUtils from '@/utils/mouseUtils'
import CssConveter from '@/utils/cssConverter'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number
  },
  data() {
    return {
      // text content might be innerHTML for rendering reason
      controlPoints: ControlPoints,
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initTranslate: { x: 0, y: 0 },
      initialWH: { width: 0, height: 0 },
      center: { x: 0, y: 0 },
      scale: { xSign: 1, ySign: 1 },
      clickTime: new Date().toISOString(),
      isGetMoved: false
    }
  },
  mounted() {
    const text = this.$refs.content as HTMLElement
    text.innerHTML = this.getTextContent
  },
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
    ...mapMutations({
      updateLayerStyles: 'Update_layerStyles',
      updateLayerProps: 'Update_layerProps',
      addLayer: 'ADD_selectedLayer',
      clearSelectedInfo: 'CLEAR_currSelectedInfo',
      updateSelectedLayers: 'Update_selectedLayerStyles',
      ADD_newLayers: 'ADD_newLayers'
    }),
    updateLayerPos(pageIndex: number, layerIndex: number, x: number, y: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          x,
          y
        }
      })
    },
    updateLayerSize(pageIndex: number, layerIndex: number, width: number, height: number, scale: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          width,
          height,
          scale
        }
      })
    },
    updateFontSize(pageIndex: number, layerIndex: number, size: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          size
        }
      })
    },
    updateLayerRotate(pageIndex: number, layerIndex: number, rotate: number) {
      this.updateLayerStyles({
        pageIndex,
        layerIndex,
        styles: {
          rotate
        }
      })
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
      if (this.config.type === 'text') {
        const text = this.$refs.content as HTMLElement
        text.innerHTML = this.getTextContent
        this.isGetMoved = true
        this.clickTime = new Date().toISOString()
        this.toggleTextEditable(this.pageIndex, this.layerIndex, true)
      }
      this.isControlling = true

      const layer = this.$el as HTMLElement
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      layer.addEventListener('mouseup', this.moveEnd)
      window.addEventListener('mousemove', this.moving)
      if (!event.metaKey && !this.currSelectedInfo.layersIndex.includes(this.layerIndex)) {
        this.clearSelectedInfo()
      }
      this.addSelectedLayer()
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        this.setCursorStyle('move')
        event.preventDefault()
        var offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
        const moveOffset = PropsTransformer.getActualMoveOffset(offsetPos.x, offsetPos.y)
        this.initialPos.x += offsetPos.x
        this.initialPos.y += offsetPos.y

        this.updateSelectedLayers({
          pageIndex: this.pageIndex,
          styles: {
            x: moveOffset.offsetX,
            y: moveOffset.offsetY
          }
        })
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
        width: parseInt(body.style.width),
        height: parseInt(body.style.height)
      }
      const rect = this.$el.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }
      this.initTranslate = {
        x: this.getLayerX,
        y: this.getLayerY
      }
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)

      // Get client point as no rotation
      const clientP = {
        x: vect.x * Math.cos(-angleInRad) - vect.y * Math.sin(-angleInRad) + this.center.x,
        y: vect.y * Math.cos(-angleInRad) + vect.x * Math.sin(-angleInRad) + this.center.y
      }

      this.scale.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.scale.ySign = (clientP.y - this.center.y > 0) ? 1 : -1

      // TODO: discussion cursor's styling
      let cursorIndex = this.scale.xSign + this.scale.ySign
      if (cursorIndex === 0 && this.scale.xSign === -1) {
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

      let offsetWidth = this.scale.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad))
      let offsetHeight = this.scale.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
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

      const scale = width / this.config.styles.initWidth
      this.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)

      offsetWidth = width - initWidth
      offsetHeight = height - initHeight
      const x = -offsetWidth / 2 + this.scale.xSign * (offsetWidth / 2) * Math.cos(angleInRad) -
        this.scale.ySign * (offsetHeight / 2) * Math.sin(angleInRad) + this.initTranslate.x
      const y = -offsetHeight / 2 + this.scale.xSign * (offsetWidth / 2) * Math.sin(angleInRad) +
        this.scale.ySign * (offsetHeight / 2) * Math.cos(angleInRad) + this.initTranslate.y

      this.updateLayerPos(this.pageIndex, this.layerIndex, x, y)

      if (this.config.type === 'text') {
        // may need to change the initWidht/height and the scale will always set to 1
        // only if the control points be manipulated changes the scale
        this.updateFontSize(this.pageIndex, this.layerIndex, this.config.styles.initSize * scale)
      }
    },
    scaleEnd() {
      this.isControlling = false
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.scaling, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
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
      const [lineAx, lineAy] = [this.initialPos.x - this.center.x, this.initialPos.y - this.center.y]
      const [lineBx, lineBy] = [event.clientX - this.center.x, event.clientY - this.center.y]

      const lineA = Math.sqrt(Math.pow(lineAx, 2) + Math.pow(lineAy, 2))
      const lineB = Math.sqrt(Math.pow(lineBx, 2) + Math.pow(lineBy, 2))
      const ADotB = lineAx * lineBx + lineAy * lineBy

      let angle = Math.acos(ADotB / (lineA * lineB)) * 180 / Math.PI
      if (angle) {
        if (lineAy * lineBx - lineAx * lineBy > 0) {
          angle *= -1
        }
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        angle += this.getLayerRotate % 360
        this.updateLayerRotate(this.pageIndex, this.layerIndex, angle)
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
        this.textNewLine(e)
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
          this.updateLayerSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, 1)
          this.updateLayerInitSize(this.pageIndex, this.layerIndex, textSize.width, textSize.height, this.getFontSize)
        }, 0)
      }
    },
    textNewLine(e: KeyboardEvent) {
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
    updateTextProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | null}) {
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
    },
    addSelectedLayer() {
      this.addLayer({
        layerIndexs: [this.layerIndex],
        pageIndex: this.pageIndex
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
  background-color: rgba(0, 0, 255, 0);
  &:active {
    border: 1px solid rgb(174, 46, 190);
  }
  &:hover {
    cursor: pointer;
  }
}
.scaler {
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
