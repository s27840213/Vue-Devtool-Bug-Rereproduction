<template lang="pug">
  div(class="nu-controller" ref="body"
  :style="styles()" @mousedown="moveStart")
    div(class="scaler" ref="scaler" @mousedown="scaleStart")
</template>

<script lang="ts">
import Vue from 'vue'

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
  mounted() {
    console.log('12345' + this.$el)
  },
  methods: {
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
      console.log(`${event.clientX}, ${event.clientY}`)
      if (this.transform.active) {
        event.preventDefault()
        const xPos = event.clientX - this.transform.initialX + this.transform.xOffset
        const yPos = event.clientY - this.transform.initialY + this.transform.yOffset

        const el = this.$el as HTMLElement
        el.style.transform = `translate(${xPos}px, ${yPos}px)`
      }
    },
    moveEnd(event: MouseEvent) {
      if (this.transform.active) {
        this.transform.xOffset += event.clientX - this.transform.initialX
        this.transform.yOffset += event.clientY - this.transform.initialY

        this.transform.active = false

        document.documentElement.removeEventListener('mouseup', this.moveEnd)
        window.removeEventListener('mousemove', this.moving)
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
      const width = `${parseInt(this.scale.initWidth, 10) + event.movementX}px`
      const height = `${parseInt(this.scale.initHeight, 10) + event.movementY}px`
      const element = this.$el as HTMLElement
      element.style.width = width
      element.style.height = height

      this.scale.initWidth = width
      this.scale.initHeight = height
    },
    scaleEnd(event: MouseEvent) {
      document.documentElement.removeEventListener('mousemove', this.scaling, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
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
  cursor: se-resize;
}
</style>
