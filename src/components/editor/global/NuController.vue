<template lang="pug">
  div(v-if="isShown || isActive"
      class="nu-controller"
      ref="body"
      :style="styles()"
      @drop="onDrop"
      @dragover.prevent,
      @dragenter.prevent
      @mousedown.left.stop="moveStart"
      @mouseout.stop="toggleHighlighter(pageIndex,layerIndex,false)"
      )
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
      scale: { xSign: 1, ySign: 1 }
    }
  },
  computed: {
    ...mapGetters({
      currSelectedLayers: 'getCurrSelectedLayers',
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
    }
  },
  methods: {
    cursorStyles(index: number, rotateAngle: number) {
      const cursorIndex = rotateAngle >= 0 ? (index + Math.floor(rotateAngle / 45)) % 8
        : (index + Math.ceil(rotateAngle / 45) + 8) % 8
      return { cursor: this.controlPoints.cursors[cursorIndex] }
    },
    ...mapMutations({
      updateLayerStyles: 'Update_layerStyles',
      updateLayerProps: 'Update_layerProps',
      addLayer: 'ADD_selectedLayer',
      clearSelectedLayers: 'CLEAR_currSelectedLayers',
      updateSelectedLayers: 'Update_selectedLayerStyles',
      ADD_newLayer: 'ADD_newLayer'
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
    styles() {
      return {
        transform: `translate(${this.config.styles.x}px, ${this.config.styles.y}px) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        border: this.isShown || this.isActive ? '3px solid #7190CC' : 'none',
        'pointer-events': this.isActive || this.isShown ? 'initial' : 'none'
      }
    },

    moveStart(event: MouseEvent) {
      if (event.target === this.$refs.body) {
        this.isControlling = true
        this.setCursorStyle('move')

        const layer = this.$el as HTMLElement
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        layer.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
        if (!event.metaKey && !this.currSelectedLayers.layersIndex.includes(this.layerIndex)) {
          this.clearSelectedLayers()
        }
        this.addSelectedLayer()
        console.log(layer.getBoundingClientRect())
      }
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        event.preventDefault()
        const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
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
      const y = -offsetHeight / 2 + this.scale.xSign * (offsetHeight / 2) * Math.sin(angleInRad) +
        this.scale.ySign * (offsetHeight / 2) * Math.cos(angleInRad) + this.initTranslate.y

      this.updateLayerPos(this.pageIndex, this.layerIndex, x, y)
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
  &:active {
    border: 1px solid rgb(174, 46, 190);
  }
  &:hover {
    cursor: pointer;
  }
}
.scaler {
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
</style>
