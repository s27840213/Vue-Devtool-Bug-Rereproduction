<template lang="pug">
  div(class="nu-controller" ref="body"
  :style="styles()" @mousedown.stop="moveStart"
  @drop="onDrop"
  @dragover.prevent,
  @dragenter.prevent)
    div(v-if="isActive" v-for="(controlPoint, index) in controlPoints.positions"
      class="scaler"
      :key="index"
      :style="Object.assign(controlPoint, cursorStyles(index, getLayerRotate))"
      @mousedown.stop="scaleStart")
    div(v-if="isActive" class="rotaterWrapper")
      div(class="rotater" @mousedown.stop="rotateStart")
</template>

<script lang="ts">
import Vue from 'vue'
import PropsTransformer from '@/utils/propsTransformer'
import CssConveter from '@/utils/cssConverter'
import { mapMutations } from 'vuex'
import { ControlPoints } from '@/store/types'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number
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
      scale: {
        xSign: 1,
        ySign: 1
      }
    }
  },
  computed: {
    scaleRatio() {
      console.log('map' + this.$store.getters.getPageScaleRatio)
      return this.$store.getters.getPageScaleRatio
    },
    getControlPoints() {
      return this.config.controlPoints
    },
    isActive() {
      return this.config.active
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
      return CssConveter.convertDefaultStyle(this.config.styles)
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
      clearSelectedLayers: 'CLEAR_currSelectedLayers',
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

    moveStart(event: MouseEvent) {
      this.initialX = event.clientX
      this.initialY = event.clientY
      this.initTranslate.x = this.getLayerX
      this.initTranslate.y = this.getLayerY
      if (event.target === this.$refs.body) {
        const el = event.target as HTMLElement
        el.addEventListener('mouseup', this.moveEnd)
        window.addEventListener('mousemove', this.moving)
        this.clearSelectedLayers()
        this.addSelectedLayer()
      }
    },
    moving(event: MouseEvent) {
      if (this.isActive) {
        event.preventDefault()
        const moveOffset = PropsTransformer.getActualMoveOffset(event.clientX - this.initialX, event.clientY - this.initialY)
        const x = moveOffset.offsetX + this.initTranslate.x
        const y = moveOffset.offsetY + this.initTranslate.y
        this.updateLayerPos(this.pageIndex, this.layerIndex, x, y)
      }
    },
    moveEnd() {
      if (this.isActive) {
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

      this.initTranslate = {
        x: this.getLayerX,
        y: this.getLayerY
      }

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vectX = event.clientX - this.center.x
      const vectY = event.clientY - this.center.y

      // Get client point while no rotation
      const clientP = {
        x: vectX * Math.cos(-angleInRad) - vectY * Math.sin(-angleInRad) + this.center.x,
        y: vectY * Math.cos(-angleInRad) + vectX * Math.sin(-angleInRad) + this.center.y
      }

      this.scale.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.scale.ySign = (clientP.y - this.center.y > 0) ? 1 : -1

      let cursorIndex = this.scale.xSign + this.scale.ySign
      if (cursorIndex === 0 && this.scale.xSign === -1) {
        cursorIndex = 6
      } else {
        cursorIndex = cursorIndex === -2 ? 0 : cursorIndex === 2 ? 4 : 2
      }
      const layer = this.$el as HTMLElement
      layer.style.cursor = this.cursorStyles(cursorIndex, this.getLayerRotate).cursor
      document.body.style.cursor = this.cursorStyles(cursorIndex, this.getLayerRotate).cursor

      document.documentElement.addEventListener('mousemove', this.scaling, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()

      let width = parseInt(this.getLayerWidth, 10)
      let height = parseInt(this.getLayerHeight, 10)

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const dx = event.clientX - this.initialX
      const dy = event.clientY - this.initialY
      let offsetWidth = this.scale.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad))
      let offsetHeight = this.scale.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 || offsetHeight === 0) return

      if ((width + offsetWidth) / this.initWidth >= (height + offsetHeight) / this.initHeight) {
        width = offsetWidth + this.initWidth
        height = width * this.initHeight / this.initWidth
      } else {
        height = offsetHeight + this.initHeight
        width = height * this.initWidth / this.initHeight
      }
      if (width <= 40 || height <= 40) return

      const scale = width / this.config.styles.initWidth
      this.updateLayerSize(this.pageIndex, this.layerIndex, width, height, scale)

      offsetWidth = width - this.initWidth
      offsetHeight = height - this.initHeight

      const x = -offsetWidth / 2 + this.scale.xSign * (offsetWidth / 2) * Math.cos(angleInRad) -
        this.scale.ySign * (offsetHeight / 2) * Math.sin(angleInRad) + this.initTranslate.x
      const y = -offsetHeight / 2 + this.scale.xSign * (offsetHeight / 2) * Math.sin(angleInRad) +
        this.scale.ySign * (offsetHeight / 2) * Math.cos(angleInRad) + this.initTranslate.y

      this.updateLayerPos(this.pageIndex, this.layerIndex, x, y)
    },
    scaleEnd() {
      const layer = this.$el as HTMLElement
      layer.style.cursor = 'default'
      document.body.style.cursor = 'default'

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
        this.updateLayerRotate(this.pageIndex, this.layerIndex, angle)
      }
    },
    rotateEnd() {
      window.removeEventListener('mousemove', this.rotating)
      window.removeEventListener('mouseup', this.rotateEnd)
    },
    onDrop(e: DragEvent) {
      if (e.dataTransfer != null) {
        const data = JSON.parse(e.dataTransfer.getData('data'))

        const target = e.target as HTMLElement
        const targetPos = {
          x: target.getBoundingClientRect().x,
          y: target.getBoundingClientRect().y
        }
        const targetOffset = {
          x: this.getLayerX,
          y: this.getLayerY
        }
        const x = (e.clientX - targetPos.x + targetOffset.x - data.geometry.left) * (100 / this.scaleRatio)
        const y = (e.clientY - targetPos.y + targetOffset.y - data.geometry.top) * (100 / this.scaleRatio)

        const layerInfo = {
          type: data.type,
          pageIndex: this.config.pageIndex,
          src: require('@/assets/img/svg/img-tmp.svg'),
          active: false,
          shown: false,
          styles: {
            x: x,
            y: y,
            scale: 1,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 150,
            height: 150,
            initWidth: 150,
            initHeight: 150
          }
        }
        this.addNewLayer(this.pageIndex, layerInfo)
      }
    },
    addNewLayer(pageIndex: number, layer: IShape | IText | IImage | IGroup) {
      this.ADD_newLayer({
        pageIndex,
        layer
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
  border: 1px solid setColor(blue-2);
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
