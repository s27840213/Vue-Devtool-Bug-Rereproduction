<template lang="pug">
  div(class="nu-controller" ref="body"
  :style="styles()" @mousedown="moveStart")
    div(v-for="(controlPoint, index) in controlPoints.positions"
    class="scaler"
    :key="index"
    :style="Object.assign(controlPoint, cursorStyles(index, getLayerRotate))"
    @mousedown="scaleStart")
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
      initWidth: 0,
      initHeight: 0,
      center: {
        x: 0,
        y: 0
      },
      initTranslate: {
        x: 0,
        y: 0
      },
      translate: {
        active: false
      },
      scale: {
        xSign: 1,
        ySign: 1,
        anchorPoint: {
          x: 0,
          y: 0
        },
        initOrigin: {
          x: 0,
          y: 0
        }
      }
    }
  },
  computed: {
    getControlPoints() {
      return this.config.controlPoints
    },
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
    styles() {
      return {
        transform: `translate(${this.config.styles.x}px, ${this.config.styles.y}px) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    },
    cursorStyles(index: number, rotateAngle: number) {
      const cursorIndex = rotateAngle >= 0 ? (index + Math.floor(rotateAngle / 45)) % 8
        : (index + Math.ceil(rotateAngle / 45) + 8) % 8
      return { cursor: this.controlPoints.cursors[cursorIndex] }
    },
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

    moveStart(event: MouseEvent) {
      this.initialX = event.clientX
      this.initialY = event.clientY
      this.initTranslate.x = this.getLayerX
      this.initTranslate.y = this.getLayerY
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
        const x = moveOffset.offsetX + this.initTranslate.x
        const y = moveOffset.offsetY + this.initTranslate.y
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

    scaleStart(event: MouseEvent) {
      this.initialX = event.clientX
      this.initialY = event.clientY

      const body = this.$el as HTMLElement
      this.initWidth = parseInt(body.style.width, 10)
      this.initHeight = parseInt(body.style.height, 10)

      const rect = this.$el.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }

      this.scale.xSign = (event.clientX - this.center.x > 0) ? 1 : -1
      this.scale.ySign = (event.clientY - this.center.y > 0) ? 1 : -1

      this.scale.initOrigin.x = this.center.x - parseInt(body.style.width) / 2
      this.scale.initOrigin.y = this.center.y - parseInt(body.style.height) / 2
      this.initTranslate = {
        x: this.getLayerX,
        y: this.getLayerY
      }

      const angleInRad = this.getLayerRotate * Math.PI / 180
      let vectX = event.clientX - this.center.x
      let vectY = event.clientY - this.center.y

      // Get client point while no rotation
      const clientP = {
        x: vectX * Math.cos(-angleInRad) - vectY * Math.sin(-angleInRad) + this.center.x,
        y: vectY * Math.cos(-angleInRad) + vectX * Math.sin(-angleInRad) + this.center.y
      }
      const anchorP = {
        x: clientP.x < this.center.x ? clientP.x + this.initWidth : clientP.x - this.initWidth,
        y: clientP.y < this.center.y ? clientP.y + this.initHeight : clientP.y - this.initHeight
      }
      vectX = anchorP.x - this.center.x
      vectY = anchorP.y - this.center.y
      this.scale.anchorPoint = {
        x: vectX * Math.cos(angleInRad) - vectY * Math.sin(angleInRad) + this.center.x,
        y: vectY * Math.cos(angleInRad) + vectX * Math.sin(angleInRad) + this.center.y
      }

      document.documentElement.addEventListener('mousemove', this.scaling, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()

      let width = parseInt(this.getLayerWidth, 10)
      let height = parseInt(this.getLayerHeight, 10)
      const offsetWidth = this.scale.xSign * (event.clientX - this.initialX)
      const offsetHeight = this.scale.ySign * (event.clientY - this.initialY)

      if ((width + offsetWidth) / this.initWidth >= (height + offsetHeight) / this.initHeight) {
        width = offsetWidth + this.initWidth
        height = width * this.initHeight / this.initWidth
      } else {
        height = offsetHeight + this.initHeight
        width = height * this.initWidth / this.initHeight
      }
      if (width <= 20 || height <= 20) return

      const ratio = width / this.initWidth
      const center = {
        x: (this.center.x - this.scale.anchorPoint.x) * ratio + this.scale.anchorPoint.x,
        y: (this.center.y - this.scale.anchorPoint.y) * ratio + this.scale.anchorPoint.y
      }

      // const anchorP = this.scale.anchorPoint
      const origin = {
        x: center.x - width / 2,
        y: center.y - height / 2
      }

      const x = this.initTranslate.x + (origin.x - this.scale.initOrigin.x)
      const y = this.initTranslate.y + (origin.y - this.scale.initOrigin.y)

      this.updateLayerSize(0, 2, width, height)
      this.updateLayerPos(0, 2, x, y)
    },
    scaleEnd() {
      document.documentElement.removeEventListener('mousemove', this.scaling, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
    },

    rotateStart(event: MouseEvent) {
      const body = this.$el
      const rect = body.getBoundingClientRect()
      this.center = {
        x: rect.left + rect.width / 2 - window.pageXOffset,
        y: rect.top + rect.height / 2 - window.pageYOffset
      }

      this.initialX = event.clientX
      this.initialY = event.clientY

      window.addEventListener('mousemove', this.rotating)
      window.addEventListener('mouseup', this.rotateEnd)
    },
    rotating(event: MouseEvent) {
      const [lineAx, lineAy] = [this.initialX - this.center.x, this.initialY - this.center.y]
      const [lineBx, lineBy] = [event.clientX - this.center.x, event.clientY - this.center.y]

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
