<template lang="pug">
  div(class="nu-img-controller")
    div(class="nu-controller"
      :style="controllerStyles()")
    div(class="nu-controller__body"
        ref="body"
        :style="styles()"
        @mousedown.left.stop="moveStart")
      div(v-for="(scaler, index) in controlPoints.scalers"
          class="controller-point"
          :key="index"
          :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getLayerRotate), { pointerEvents: primaryLayerType === 'frame' ? pointerEvents : 'initial' })"
          @mousedown.stop="scaleStart")
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import MathUtils from '@/utils/mathUtils'
import LayerUtils from '@/utils/layerUtils'
import FrameUtils from '@/utils/frameUtils'
import stepsUtils from '@/utils/stepsUtils'

export default Vue.extend({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    primaryLayerIndex: Number,
    forRender: {
      type: Boolean,
      default: false
    },
    pointerEvents: {
      type: String,
      default: 'initial'
    },
    primaryLayerType: {
      type: String,
      default: ''
    }
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
      control: { xSign: 1, ySign: 1, isHorizon: false },
      isSnappedInVertical: false
    }
  },
  destroyed() {
    for (let i = 0; i < this.getPage(this.pageIndex).layers.length; i++) {
      if (LayerUtils.getLayer(this.pageIndex, i).type === 'image') {
        ControlUtils.updateLayerProps(this.pageIndex, i, { imgControl: false })
      }
    }
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPage: 'getPage'
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
      // return this.config.styles.scale
      return 1
    },
    getLayerRotate(): number {
      return this.config.styles.rotate
    },
    flipFactorX(): number {
      if (['frame', 'group'].includes(LayerUtils.getCurrLayer.type)) {
        return LayerUtils.getCurrLayer.styles.horizontalFlip ? -1 : 1
      } else return 1
    },
    flipFactorY(): number {
      if (['frame', 'group'].includes(LayerUtils.getCurrLayer.type)) {
        return LayerUtils.getCurrLayer.styles.verticalFlip ? -1 : 1
      } else return 1
    },
    angleInRad(): number {
      const { type, styles: primaryStyles } = LayerUtils.getCurrLayer
      const { rotate } = this.config.styles
      if (typeof this.primaryLayerIndex !== 'undefined') {
        return (primaryStyles.rotate + (type === 'group' ? rotate : 0)) * Math.PI / 180
      } else {
        return this.getLayerRotate * Math.PI / 180
      }
    },
    primaryType(): string {
      if (typeof this.primaryLayerIndex !== 'undefined') {
        return LayerUtils.getLayer(this.pageIndex, this.primaryLayerIndex).type
      } else {
        return ''
      }
    },
    primaryScale(): number {
      const currLayer = LayerUtils.getCurrLayer
      if (typeof this.primaryLayerIndex !== 'undefined' && ['group', 'frame'].includes(currLayer.type)) {
        return LayerUtils.getCurrLayer.styles.scale
      } else {
        return 1
      }
    }
  },
  methods: {
    ...mapMutations({
      setLastSelectedLayerIndex: 'SET_lastSelectedLayerIndex'
    }),
    styles() {
      const zindex = (this.layerIndex + 1) * 1000
      const pos = this.imgControllerPosHandler()
      return {
        transform: `translate3d(${pos.x}px, ${pos.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.imgWidth * this.getLayerScale}px`,
        height: `${this.config.styles.imgHeight * this.getLayerScale}px`,
        outline: `${2 * (100 / this.scaleRatio)}px dashed #7190CC`,
        pointerEvents: this.primaryType === 'frame' ? this.pointerEvents : 'initial'
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
       * Anchor denotes the top-left fix point of the element
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

      /**
       * For sub-img-controller under frame layer
       * if the frame layer is set the flip prop, do following mapping modification
       */
      const currLayer = LayerUtils.getCurrLayer
      if (currLayer.type === 'frame' && !this.forRender) {
        const baseLine = {
          x: -w / 2 + currLayer.styles.width / 2,
          y: -h / 2 + currLayer.styles.height / 2
        }
        imgControllerPos.x += currLayer.styles.horizontalFlip ? -2 * (imgControllerPos.x - baseLine.x) : 0
        imgControllerPos.y += currLayer.styles.verticalFlip ? -2 * (imgControllerPos.y - baseLine.y) : 0
      }

      return imgControllerPos
    },
    controllerStyles() {
      const zindex = 0
      return {
        transform: `translate3d(${this.config.styles.x}px, ${this.config.styles.y}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width}px`,
        height: `${this.config.styles.height}px`,
        outline: `${2 * (100 / this.scaleRatio)}px solid #7190CC`
      }
    },
    updateLayerProps(prop: { [key: string]: string | boolean | number }) {
      if (typeof this.primaryLayerIndex !== 'undefined') {
        switch (LayerUtils.getCurrLayer.type) {
          case 'frame':
            FrameUtils.updateFrameLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, prop)
            break
          case 'group':
            LayerUtils.updateSubLayerProps(this.pageIndex, this.primaryLayerIndex, this.layerIndex, prop)
        }
      } else {
        LayerUtils.updateLayerProps(this.pageIndex, this.layerIndex, prop)
      }
    },
    updateLayerStyles(prop: { [key: string]: number }) {
      if (typeof this.primaryLayerIndex !== 'undefined') {
        switch (LayerUtils.getCurrLayer.type) {
          case 'frame':
            FrameUtils.updateFrameLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, prop)
            break
          case 'group':
            LayerUtils.updateSubLayerStyles(this.pageIndex, this.primaryLayerIndex, this.layerIndex, prop)
        }
      } else {
        LayerUtils.updateLayerStyles(this.pageIndex, this.layerIndex, prop)
      }
    },
    moveStart(event: MouseEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })

      window.addEventListener('mouseup', this.moveEnd)
      window.addEventListener('mousemove', this.moving)

      this.setCursorStyle('move')
      this.setLastSelectedLayerIndex(this.layerIndex)
    },
    moving(event: MouseEvent) {
      this.setCursorStyle('move')
      event.preventDefault()
      const baseLine = {
        x: -this.getImgWidth / 2 + (this.config.styles.width / this.getLayerScale) / 2,
        y: -this.getImgHeight / 2 + (this.config.styles.height / this.getLayerScale) / 2
      }
      const translateLimit = {
        width: (this.getImgWidth - this.config.styles.width / this.getLayerScale) / 2,
        height: (this.getImgHeight - this.config.styles.height / this.getLayerScale) / 2
      }

      const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
      offsetPos.x = (offsetPos.x / this.getLayerScale) * (100 / this.scaleRatio)
      offsetPos.y = (offsetPos.y / this.getLayerScale) * (100 / this.scaleRatio)
      const currLayer = LayerUtils.getCurrLayer
      if (typeof this.primaryLayerIndex !== 'undefined' && currLayer.type === 'group') {
        const primaryScale = LayerUtils.getCurrLayer.styles.scale
        offsetPos.x /= primaryScale
        offsetPos.y /= primaryScale
      }

      const imgPos = this.imgPosMapper(offsetPos)
      if (Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        imgPos.x = imgPos.x - baseLine.x > 0 ? 0 : this.config.styles.width / this.getLayerScale - this.getImgWidth
      }
      if (Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        imgPos.y = imgPos.y - baseLine.y > 0 ? 0 : this.config.styles.height / this.getLayerScale - this.getImgHeight
      }
      this.updateLayerStyles({
        imgX: imgPos.x,
        imgY: imgPos.y
      })
    },
    imgPosMapper(offsetPos: ICoordinate): ICoordinate {
      const angleInRad = this.angleInRad
      return {
        x: this.flipFactorX * (offsetPos.x * Math.cos(angleInRad) + offsetPos.y * Math.sin(angleInRad)) + this.initImgPos.imgX,
        y: this.flipFactorY * (-offsetPos.x * Math.sin(angleInRad) + offsetPos.y * Math.cos(angleInRad)) + this.initImgPos.imgY
      }
    },
    moveEnd(e: MouseEvent) {
      const posDiff = {
        x: Math.abs(e.clientX - this.initialPos.x),
        y: Math.abs(e.clientY - this.initialPos.y)
      }
      if (Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0) {
        this.updateLayerProps({ imgControl: false })
        stepsUtils.record()
        this.updateLayerProps({ imgControl: true })
      }
      this.setCursorStyle('default')
      window.removeEventListener('mouseup', this.moveEnd)
      window.removeEventListener('mousemove', this.moving)
    },
    scaleStart(event: MouseEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initialWH = {
        width: this.getImgWidth,
        height: this.getImgHeight
      }
      console.log(this.getImgWidth)
      console.log(this.getImgHeight)
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)

      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })
      const angleInRad = this.angleInRad
      const vect = MouseUtils.getMouseRelPoint(event, this.center)
      const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? this.flipFactorX : -this.flipFactorX
      this.control.ySign = (clientP.y - this.center.y > 0) ? this.flipFactorY : -this.flipFactorY

      this.currCursorStyling(event)
      window.addEventListener('mousemove', this.scaling, false)
      window.addEventListener('mouseup', this.scaleEnd, false)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()
      let width = this.getImgWidth
      let height = this.getImgHeight
      const currLayer = LayerUtils.getCurrLayer

      const angleInRad = this.angleInRad
      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = MathUtils.getActualMoveOffset(tmp.x, tmp.y)
      if (typeof this.primaryLayerIndex !== 'undefined' && currLayer.type === 'group') {
        const primaryScale = currLayer.styles.scale
        diff.offsetX /= primaryScale
        diff.offsetY /= primaryScale
      }
      // const [dx, dy] = [diff.offsetX / this.config.styles.scale, diff.offsetY / this.config.styles.scale]
      const [dx, dy] = [diff.offsetX, diff.offsetY]
      console.log('dx', dx)
      console.log('dy', dy)
      console.log('ini w', this.initialWH.width)
      console.log('ini  h', this.initialWH.height)

      const offsetWidth = this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad)) * this.flipFactorX
      const offsetHeight = this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad)) * this.flipFactorY
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

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }
      const imgPos = {
        x: this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.imgX : this.initImgPos.imgX,
        y: this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.imgY : this.initImgPos.imgY
      }
      const baseLine = {
        x: -width / 2 + (this.config.styles.width / this.getLayerScale) / 2,
        y: -height / 2 + (this.config.styles.height / this.getLayerScale) / 2
      }
      const translateLimit = {
        width: (width - this.config.styles.width / this.getLayerScale) / 2,
        height: (height - this.config.styles.height / this.getLayerScale) / 2
      }

      const ratio = width / height
      if (offsetSize.width < 0 && Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        if (this.control.xSign < 0) {
          imgPos.x = 0
          offsetSize.width = this.initImgPos.imgX
        } else {
          /**
           *  Derivation (for image layer as example):
           *   -this.initImgPos.imgX - width / 2 + (this.config.styles.width / this.getLayerScale) / 2 = (width - this.config.styles.width / this.getLayerScale) / 2
           *  => -this.initImgPos.imgX = width - this.config.styles.width
           *  => width = this.config.styles.width  - this.initImgPos.imgX
           *  => offsetSize.width + initWidth = this.config.styles.styles.width - this.initImgPos.imgX
           */
          if (currLayer.type === 'frame') {
            offsetSize.width = this.config.styles.width / currLayer.styles.scale - this.initImgPos.imgX - initWidth
          } else {
            offsetSize.width = this.config.styles.width - this.initImgPos.imgX - initWidth
          }
        }
        offsetSize.height = offsetSize.width / ratio
        imgPos.y = this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.imgY : this.initImgPos.imgY
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth

        baseLine.x = -width / 2 + (this.config.styles.width / this.getLayerScale) / 2
        baseLine.y = -height / 2 + (this.config.styles.height / this.getLayerScale) / 2
        translateLimit.width = (width - this.config.styles.width / this.getLayerScale) / 2
        translateLimit.height = (height - this.config.styles.height / this.getLayerScale) / 2
      }
      if (offsetSize.height < 0 && Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        if (this.control.ySign < 0) {
          imgPos.y = 0
          offsetSize.height = this.initImgPos.imgY
        } else {
          if (currLayer.type === 'frame') {
            offsetSize.height = this.config.styles.height / currLayer.styles.scale - this.initImgPos.imgY - initHeight
          } else {
            offsetSize.height = this.config.styles.height - this.initImgPos.imgY - initHeight
          }
        }
        offsetSize.width = offsetSize.height * ratio
        imgPos.x = this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.imgX : this.initImgPos.imgX
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth
      }

      console.log('wid', width)
      console.log('hei', height)
      this.updateLayerStyles({
        imgWidth: width,
        imgHeight: height,
        imgX: imgPos.x,
        imgY: imgPos.y
      })
    },
    scaleEnd(e: MouseEvent) {
      const posDiff = {
        x: Math.abs(e.clientX - this.initialPos.x),
        y: Math.abs(e.clientY - this.initialPos.y)
      }
      if (Math.round(posDiff.x) !== 0 || Math.round(posDiff.y) !== 0) {
        this.updateLayerProps({ imgControl: false })
        stepsUtils.record()
        this.updateLayerProps({ imgControl: true })
      }
      this.isControlling = false
      this.setCursorStyle('default')
      window.removeEventListener('mousemove', this.scaling, false)
      window.removeEventListener('mouseup', this.scaleEnd, false)
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
.controller-point {
  pointer-events: auto;
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: setColor(white);
  border: 1.5px solid setColor(blue-2);
  border-radius: 30%;
}

.nu-controller {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  box-sizing: border-box;
  &__body {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    &__wrapper {
      width: max-content;
      height: max-content;
    }
  }
}
</style>
