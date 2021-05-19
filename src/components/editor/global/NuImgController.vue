<template lang="pug">
  keep-alive
    div
      div(class="nu-img-controller"
          ref="body"
          :style="styles()"
          @mousedown.left.stop="moveStart")
        div(v-for="(scaler, index)  in controlPoints.scalers"
            class="controller-point"
            :key="index * 2"
            :style="Object.assign(scaler, cursorStyles(index * 2, getLayerRotate))"
            @mousedown.stop="scaleStart")
      div(class="nu-controller"
          :style="controllerStyles()")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import ControlUtils from '@/utils/controlUtils'
import GroupUtils from '@/utils/groupUtils'
import { ICoordinate } from '@/interfaces/frame'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number
  },
  data() {
    return {
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initImgPos: { imgX: 0, imgY: 0 },
      initImgControllerPos: { x: 0, y: 0 },
      initialWH: { width: 0, height: 0 },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, isHorizon: false }
    }
  },
  computed: {
    ...mapGetters({
      lastSelectedPageIndex: 'getLastSelectedPageIndex',
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
    getImgX(): number {
      return this.config.styles.imgX
    },
    getImgY(): number {
      return this.config.styles.imgY
    },
    getImgWidth(): number {
      return this.config.styles.imgWidth
    },
    getImgHeight(): number {
      return this.config.styles.imgHeight
    },
    getLayerScale(): number {
      return this.config.styles.scale
    },
    getLayerRotate(): number {
      return this.config.styles.rotate
    },
    getImgController(): ICoordinate {
      return this.config.styles.imgController
    }
  },
  methods: {
    ...mapMutations({
      updateTmpLayerStyles: 'UPDATE_tmpLayerStyles',
      setLastSelectedPageIndex: 'SET_lastSelectedPageIndex',
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex'
    }),
    styles() {
      const zindex = (this.layerIndex + 1) * 100
      const pos = this.imgControllerPosHandler()
      return {
        transform: `translate3d(${pos.x}px, ${pos.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.imgWidth * this.config.styles.scale}px`,
        height: `${this.config.styles.imgHeight * this.config.styles.scale}px`,
        outline: `${3 * (100 / this.scaleRatio)}px solid red`,
       'pointer-events': (this.isActive || this.isShown) ? 'initial' : 'initial'
      }
    },
    imgControllerPosHandler(): ICoordinate {
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const rectCenter = {
        x: this.config.styles.x + this.config.styles.width / 2,
        y: this.config.styles.y + this.config.styles.height / 2
      }
      const layerVect = {
        x: this.config.styles.x - rectCenter.x,
        y: this.config.styles.y - rectCenter.y
      }
      /**
       * Anchor denotes the top-left fix point of the elements
       */
      const scale = this.config.styles.scale
      const layerAnchor = ControlUtils.getNoRotationPos(layerVect, rectCenter, -angleInRad)
      const imgAnchor = {
        x: Math.cos(angleInRad) * this.getImgX * scale - Math.sin(angleInRad) * this.getImgY * scale + layerAnchor.x,
        y: Math.sin(angleInRad) * this.getImgX * scale + Math.cos(angleInRad) * this.getImgY * scale + layerAnchor.y
      }
      const [w, h] = [this.config.styles.imgWidth * scale, this.config.styles.imgHeight * scale]
      const center = {
        x: imgAnchor.x + (w * Math.cos(angleInRad) - h * Math.sin(angleInRad)) / 2,
        y: imgAnchor.y + (w * Math.sin(angleInRad) + h * Math.cos(angleInRad)) / 2
      }
      const vect = {
        x: imgAnchor.x - center.x,
        y: imgAnchor.y - center.y
      }
      const imgControllerPos = ControlUtils.getNoRotationPos(vect, center, angleInRad)
      return imgControllerPos
    },
    controllerStyles() {
      const zindex = 0
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
      this.isControlling = true
      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initImgControllerPos = this.getImgController
      document.documentElement.addEventListener('mouseup', this.moveEnd)
      window.addEventListener('mousemove', this.moving)
      this.setCursorStyle('move')
      this.setLastSelectedPageIndex(this.pageIndex)
      this.setLastSelectedLayerIndex(this.layerIndex)
      // if (this.config.type !== 'tmp') {
      //   /**
      //    * @param {number} targetIndex - target index is used to determine the selected target layer after all layers in tmp being pushed into page
      //    * the reason why we need this variable is when we ungroup a tmp layer and push all selected layers into page
      //    * the original layerIndex may represent the different layer, and this condition will happen when the tmp index is smaller than the layer you click
      //    * for example, assume there are three layers in the page 0, and then we select layer 0 and layer 1 to generate a tmp layer(it will become layer 0)
      //    * and the original layer 2 will become layer 1. Once we click on the this layer 1(layerIndex = 1), the layer 0(tmp layer) will be ungroup(deselect), push all layers into page
      //    * and the original layer 1 will become layer 2, so if we directly use layerIndex 1 to select the layer we will get the wrong target
      //    * Thus, we need to do some condition checking to prevent this error
      //    */
      //   const targetIndex = (GroupUtils.tmpIndex > this.layerIndex || GroupUtils.tmpIndex < 0 || GroupUtils.tmpLayers.length === 0)
      //     ? this.layerIndex : this.layerIndex + GroupUtils.tmpLayers.length - 1
      //   if (!this.isActive) {
      //     if (!event.metaKey && GroupUtils.tmpIndex >= 0) {
      //       GroupUtils.deselect()
      //       this.setLastSelectedPageIndex(this.pageIndex)
      //       this.setLastSelectedLayerIndex(this.layerIndex)
      //     }
      //     if (this.pageIndex === this.lastSelectedPageIndex) {
      //       GroupUtils.select([targetIndex])
      //     }
      //   }
      // }
    },
    moving(event: MouseEvent) {
      this.setCursorStyle('move')
      event.preventDefault()

      const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
      offsetPos.x /= this.getLayerScale
      offsetPos.y /= this.getLayerScale

      const img = this.imgPosMapper(offsetPos)
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, img.x, img.y)
    },
    imgPosMapper(offsetPos: ICoordinate): ICoordinate {
      const angleInRad = this.getLayerRotate * Math.PI / 180
      return {
        x: offsetPos.x * Math.cos(angleInRad) + offsetPos.y * Math.sin(angleInRad) + this.initImgPos.imgX,
        y: -offsetPos.x * Math.sin(angleInRad) + offsetPos.y * Math.cos(angleInRad) + this.initImgPos.imgY
      }
    },
    moveEnd(event: MouseEvent) {
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mouseup', this.moveEnd)
      window.removeEventListener('mousemove', this.moving)
    },
    scaleStart(event: MouseEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initImgControllerPos = this.getImgController

      const body = this.$refs.body as HTMLElement
      this.initialWH = {
        width: this.getImgWidth,
        height: this.getImgHeight
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)

      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })
      const angleInRad = this.getLayerRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)

      // Get client point as no rotation
      const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1
      this.currCursorStyling(event)
      document.documentElement.addEventListener('mousemove', this.scaling, false)
      document.documentElement.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()
      let width = this.getImgWidth
      let height = this.getImgHeight

      const angleInRad = this.getLayerRotate * Math.PI / 180
      const diff = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const [dx, dy] = [diff.x / this.config.styles.scale, diff.y / this.config.styles.scale]

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
      const img = {
        x: this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.imgX : this.initImgPos.imgX,
        y: this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.imgY : this.initImgPos.imgY
      }
      ControlUtils.updateImgSize(this.pageIndex, this.layerIndex, width, height)
      ControlUtils.updateImgPos(this.pageIndex, this.layerIndex, img.x, img.y)
    },
    scaleEnd() {
      this.isControlling = false
      this.setCursorStyle('default')
      document.documentElement.removeEventListener('mousemove', this.scaling, false)
      document.documentElement.removeEventListener('mouseup', this.scaleEnd, false)
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
    }
  }
})
</script>

<style lang="scss" scoped>
.nu-img-controller {
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

.controller-point {
  pointer-events: auto;
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: setColor(white);
  border: 1.5px solid red;
  border-radius: 30%;
}

.nu-controller {
  display: flex;
  justify-content: center;
  align-items: center;
  // z-index: setZindex("nu-controller");
  position: absolute;
  box-sizing: border-box;
}
</style>
