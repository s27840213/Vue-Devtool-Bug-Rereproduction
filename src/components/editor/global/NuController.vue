<template lang="pug">
  div(class="nu-controller" ref="body"
  :style="styles()" @mousedown="moveStart")
    div(class="scaler" ref="scaler" @mousedown="scaleStart")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapMutations } from 'vuex'
export default Vue.extend({
  props: {
    config: Object
  },
  data() {
    return {
      transform: {
        active: false,
        initialX: 0,
        initialY: 0,
        xOffset: this.config.styles.x,
        yOffset: this.config.styles.y
      },
      scale: {
        initialX: 0,
        initialY: 0,
        initWidth: `${this.config.styles.width}px`,
        initHeight: `${this.config.styles.height}px`
      }
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
      this.transform.initialX = event.clientX
      this.transform.initialY = event.clientY
      if (event.target === this.$refs.body) {
        const el = event.target as HTMLElement
        el.addEventListener('mouseup', this.moveEnd)

        window.addEventListener('mousemove', this.moving)
        this.transform.active = true
      }
    },
    moving(event: MouseEvent) {
      if (this.transform.active) {
        event.preventDefault()
        const xPos = event.clientX - this.transform.initialX + this.transform.xOffset
        const yPos = event.clientY - this.transform.initialY + this.transform.yOffset

        const el = this.$el as HTMLElement
        el.style.transform = `translate(${xPos}px, ${yPos}px)`

        const matrix = window.getComputedStyle(this.$el).transform;
        const matrixValues = matrix.match(/matrix.*\((.+)\)/)![1].split(', ');

        this.updateLayerPos(0, 2, parseInt(matrixValues[4]), parseInt(matrixValues[5]))
      }
    },
    moveEnd(event: MouseEvent) {
      if (this.transform.active) {
        this.transform.xOffset += event.clientX - this.transform.initialX
        this.transform.yOffset += event.clientY - this.transform.initialY
        this.transform.active = false

        document.documentElement.removeEventListener('mouseup', this.moveEnd);
        window.removeEventListener('mousemove', this.moving);
      }
    },

    scaleStart(event: MouseEvent) {
      if (event.target !== this.$refs.scaler) return
      this.scale.initialX = event.clientX
      this.scale.initialY = event.clientY

      document.documentElement.addEventListener('mousemove', this.scaling, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()
      const width = parseInt(this.scale.initWidth, 10) + event.movementX
      const height = parseInt(this.scale.initHeight, 10) + event.movementY
      const element = this.$el as HTMLElement
      element.style.width = `${width}px`
      element.style.height = `${height}px`

      this.scale.initWidth = `${width}px`
      this.scale.initHeight = `${height}px`

      this.updateLayerSize(0, 2, width, height)
    },
    scaleEnd() {
      document.documentElement.removeEventListener('mousemove', this.scaling, false);
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false);
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-controller {
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
  width: 10px;
  height: 10px;
  background: black;
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}
</style>
