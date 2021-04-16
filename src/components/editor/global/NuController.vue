<template lang="pug">
  div(class="nu-controller" ref="body"
  :style="styles()" @mousedown="moveStart")
    div(v-for="(controlPoint,index) in controlPoints"
    class="scaler"
    :key="index"
    :style="controlPoint.styles"
    @mousedown="scaleStart($event, controlPoint.xSign, controlPoint.ySign)")
    div(class="rotaterWrapper")
      div(class="rotater" @mousedown="rotateStart")
</template>

<script lang="ts">
import Vue from 'vue'
import PropsTransformer from '@/utils/propsTransformer'
import { mapMutations } from 'vuex'
import { ControlPoints } from '@/store/types'

export default Vue.extend({
  props: {
    config: Object
  },
  data() {
    return {
      controlPoints: ControlPoints,
      initialX: 0,
      initialY: 0,
      translate: {
        active: false,
        xOffset: this.config.styles.x,
        yOffset: this.config.styles.y
      },
      scale: {
        eventHandler: {} as any
      },
      rotate: {
        centerX: 0,
        centerY: 0
      }
    }
  },
  computed: {
    getLayerX() {
      return this.config.styles.x
    },
    getLayerY() {
      return this.config.styles.y
    },
    getLayerWidth() {
      return this.config.styles.width
    },
    getLayerHeight() {
      return this.config.styles.height
    },
    getLayerRotate() {
      return this.config.styles.rotate
    }
  },
  methods: {
    ...mapMutations({
      Update_LayerPos: 'Update_LayerPos',
      Update_LayerSize: 'Update_LayerSize',
      Update_LayerRotate: 'Update_LayerRotate'
    }),
    updateLayerPos(pageIndex: number, layerIndex: number, x: number, y: number) {
      this.Update_LayerPos({
        pageIndex,
        layerIndex,
        x,
        y
      })
    },
    updateLayerSize(pageIndex: number, layerIndex: number, width: number, height: number) {
      this.Update_LayerSize({
        pageIndex,
        layerIndex,
        width,
        height
      })
    },
    updateLayerRotate(pageIndex: number, layerIndex: number, rotate: number) {
      this.Update_LayerRotate({
        pageIndex,
        layerIndex,
        rotate
      })
    },

    styles() {
      return {
        transform: `translate(${this.config.styles.x}px, ${this.config.styles.y}px) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    },

    moveStart(event: MouseEvent) {
      this.initialX = event.clientX
      this.initialY = event.clientY
      this.translate.xOffset = this.getLayerX
      this.translate.yOffset = this.getLayerY
      if (event.target === this.$refs.body) {
        const el = event.target as HTMLElement
        el.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
        this.translate.active = true
      }
    },
    moving(event: MouseEvent) {
      if (this.translate.active) {
        event.preventDefault()
        const moveOffset = PropsTransformer.getActualMoveOffset(event.clientX - this.initialX, event.clientY - this.initialY)
        const x = moveOffset.offsetX + this.translate.xOffset
        const y = moveOffset.offsetY + this.translate.yOffset
        this.updateLayerPos(0, 2, x, y)
      }
    },
    moveEnd() {
      if (this.translate.active) {
        this.translate.active = false
        document.documentElement.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
      }
    },

    scaleStart(event: MouseEvent, xSign: number, ySign: number) {
      this.initialX = event.clientX
      this.initialY = event.clientY
      this.scale.eventHandler = this.scaling(xSign, ySign)
      document.documentElement.addEventListener('mousemove', this.scale.eventHandler, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(xSign: number, ySign: number) {
      return (event: MouseEvent) => {
        event.preventDefault()
        const width = parseInt(this.getLayerWidth, 10) + xSign * event.movementX
        const height = parseInt(this.getLayerHeight, 10) + ySign * event.movementY
        if (width <= 20 || height <= 20) return

        const x = xSign < 0 ? parseInt(this.getLayerX) + event.movementX : parseInt(this.getLayerX)
        const y = ySign < 0 ? parseInt(this.getLayerY) + event.movementY : parseInt(this.getLayerY)

        this.translate.xOffset += xSign < 0 ? event.movementX : 0
        this.translate.yOffset += ySign < 0 ? event.movementY : 0

        this.updateLayerSize(0, 2, width, height)
        this.updateLayerPos(0, 2, x, y)
      }
    },
    scaleEnd() {
      document.documentElement.removeEventListener('mousemove', this.scale.eventHandler, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
    },

    rotateStart(event: MouseEvent) {
      const body = this.$el
      const rect = body.getBoundingClientRect()
      this.rotate.centerX = rect.left + rect.width / 2 - window.pageXOffset
      this.rotate.centerY = rect.top + rect.height / 2 - window.pageYOffset

      this.initialX = event.clientX
      this.initialY = event.clientY

      window.addEventListener('mousemove', this.rotating)
      window.addEventListener('mouseup', this.rotateEnd)
    },
    rotating(event: MouseEvent) {
      const [lineAx, lineAy] = [this.initialX - this.rotate.centerX, this.initialY - this.rotate.centerY]
      const [lineBx, lineBy] = [event.clientX - this.rotate.centerX, event.clientY - this.rotate.centerY]

      const lineA = Math.sqrt(Math.pow(lineAx, 2) + Math.pow(lineAy, 2))
      const lineB = Math.sqrt(Math.pow(lineBx, 2) + Math.pow(lineBy, 2))
      const ADotB = lineAx * lineBx + lineAy * lineBy

      let angle = Math.acos(ADotB / (lineA * lineB)) * 180 / Math.PI
      if (angle) {
        if (lineAy * lineBx - lineAx * lineBy > 0) {
          angle *= -1
        }
        angle += this.getLayerRotate % 360

        this.initialX = event.clientX
        this.initialY = event.clientY
        this.updateLayerRotate(0, 2, angle)
        console.log('angle:  ' + angle)
      }
    },
    rotateEnd() {
      window.removeEventListener('mousemove', this.rotating)
      window.removeEventListener('mouseup', this.rotateEnd)
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-controller {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  border: 1px solid blue;
  &:active {
    border: 1.5px solid rgb(174, 46, 190);
  }
  &:hover {
    cursor: pointer;
  }
}
.scaler {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: red;
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
