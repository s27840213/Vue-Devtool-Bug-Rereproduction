<template lang="pug">
  div(class="nu-controller" ref="body"
  :style="styles()" @mousedown="moveStart")
    div(v-for="(controlPoint,index) in controlPoints"
    class="scaler"
    :key="index"
    :style="controlPoint.styles"
    @mousedown="scaleStart($event, controlPoint.xSign, controlPoint.ySign)")
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
      translate: {
        active: false,
        initialX: 0,
        initialY: 0,
        xOffset: this.config.styles.x,
        yOffset: this.config.styles.y
      },
      scale: {
        event: {} as any,
        initialX: 0,
        initialY: 0,
        initWidth: `${this.config.styles.width}px`,
        initHeight: `${this.config.styles.height}px`
      }
    }
  },
  computed: {
    getLayerX() {
      return this.config.styles.x
    },
    getLayerY() {
      return this.config.styles.y
    }
  },
  methods: {
    ...mapMutations({
      Update_LayerPos: 'Update_LayerPos',
      Update_LayerSize: 'Update_LayerSize'
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

    styles() {
      return {
        transform: `translate(${this.config.styles.x}px, ${this.config.styles.y}px)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`
      }
    },

    moveStart(event: MouseEvent) {
      this.translate.initialX = event.clientX
      this.translate.initialY = event.clientY
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
        const moveOffset = PropsTransformer.getActualMoveOffset(event.clientX - this.translate.initialX, event.clientY - this.translate.initialY)
        const x = moveOffset.offsetX + this.translate.xOffset
        const y = moveOffset.offsetY + this.translate.yOffset

        const el = this.$el as HTMLElement
        el.style.transform = `translate(${x}px, ${y}px)`

        const matrix = window.getComputedStyle(this.$el).transform
        const matrixValues = matrix.match(/matrix.*\((.+)\)/)![1].split(', ')

        this.updateLayerPos(0, 2, parseInt(matrixValues[4]), parseInt(matrixValues[5]))
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
      this.scale.initialX = event.clientX
      this.scale.initialY = event.clientY
      this.scale.event = this.scaling(xSign, ySign)
      document.documentElement.addEventListener('mousemove', this.scale.event.eventHandler, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(xSign: number, ySign: number) {
      return {
        eventHandler: (event: MouseEvent) => {
          event.preventDefault()
          const width = parseInt(this.scale.initWidth, 10) + xSign * event.movementX
          const height = parseInt(this.scale.initHeight, 10) + ySign * event.movementY
          if (width <= 20 || height <= 20) return

          const element = this.$el as HTMLElement
          element.style.width = `${width}px`
          element.style.height = `${height}px`

          this.scale.initWidth = `${width}px`
          this.scale.initHeight = `${height}px`

          const matrix = window.getComputedStyle(this.$el).transform;
          const matrixValues = matrix.match(/matrix.*\((.+)\)/)![1].split(', ');
          const x = xSign < 0 ? parseInt(matrixValues[4]) + event.movementX : parseInt(matrixValues[4])
          const y = ySign < 0 ? parseInt(matrixValues[5]) + event.movementY : parseInt(matrixValues[5])
          element.style.transform = `translate(${x}px, ${y}px)`

          this.translate.xOffset += xSign < 0 ? event.movementX : 0
          this.translate.yOffset += ySign < 0 ? event.movementY : 0

          this.updateLayerSize(0, 2, width, height)
          this.updateLayerPos(0, 2, x, y)
        }
      }
    },
    scaleEnd() {
      document.documentElement.removeEventListener('mousemove', this.scale.event.eventHandler, false);
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false);
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
</style>
