<template lang="pug">
div(class="nu-background-controller")
  div(class="dim-background" :style="dimBgStyles")
  div(class="nu-controller__body"
      ref="body"
      :style="styles"
      @pointerdown.stop="moveStart"
      @touchstart="disableTouchEvent")
    div(v-for="(scaler, index)  in controlPoints.scalers"
        class="controller-point"
        :key="index"
        :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getPageRotate))"
        @pointerdown.stop="scaleStart")
  //- div(class="nu-controller"
  //-     :style="controllerStyles()")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import MathUtils from '@/utils/mathUtils'
import PageUtils from '@/utils/pageUtils'
import { IPage } from '@/interfaces/page'
import stepsUtils from '@/utils/stepsUtils'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'

export default defineComponent({
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
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
      control: { xSign: 1, ySign: 1, isHorizon: false }
    }
  },
  unmounted() {
    PageUtils.setBackgroundImageControlDefault()
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio',
      getPage: 'getPage'
    }),
    isActive(): boolean {
      return this.config.active
    },
    isShown(): boolean {
      return this.config.shown
    },
    page(): IPage {
      return this.getPage(this.pageIndex)
    },
    getImgX(): number {
      // return this.page.backgroundImage.posX
      return this.config.styles.imgX
    },
    getImgY(): number {
      // return this.page.backgroundImage.posY
      return this.config.styles.imgY
    },
    getImgWidth(): number {
      return this.config.styles.imgWidth
    },
    getImgHeight(): number {
      return this.config.styles.imgHeight
    },
    getPageScale(): number {
      return this.config.styles.scale
    },
    getPageRotate(): number {
      return 0
    },
    getImgController(): ICoordinate {
      return this.config.styles.imgController
    },
    dimBgStyles(): unknown {
      return {
        width: `${this.config.styles.imgWidth * this.contentScaleRatio}px`,
        height: `${this.config.styles.imgHeight * this.contentScaleRatio}px`
      }
    },
    styles(): unknown {
      // preserve in case the background image is needed to be rotatable in the future
      // const zindex = (this.pageIndex + 1) * 100
      // const pos = this.imgControllerPosHandler()
      // transform: `translate(${pos.x}px, ${pos.y}px) rotate(${this.config.styles.rotate}deg)`
      return {
        width: `${this.config.styles.imgWidth * this.getPageScale * this.contentScaleRatio}px`,
        height: `${this.config.styles.imgHeight * this.getPageScale * this.contentScaleRatio}px`,
        outline: `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid #7190CC`
      }
    }
  },
  methods: {
    ...mapMutations({
      updateConfig: 'imgControl/UPDATE_CONFIG'
    }),
    imgControllerPosHandler(): ICoordinate {
      const page = this.page
      const angleInRad = this.getPageRotate * Math.PI / 180
      const rectCenter = {
        x: page.width / 2,
        y: page.height / 2
      }
      const pageVect = {
        x: -rectCenter.x,
        y: -rectCenter.y
      }
      /**
       * Anchor denotes the top-left fix point of the elements
       */
      const scale = this.getPageScale
      const PageAnchor = ControlUtils.getNoRotationPos(pageVect, rectCenter, -angleInRad)
      const imgAnchor = {
        x: Math.cos(angleInRad) * this.getImgX * scale - Math.sin(angleInRad) * this.getImgY * scale + PageAnchor.x,
        y: Math.sin(angleInRad) * this.getImgX * scale + Math.cos(angleInRad) * this.getImgY * scale + PageAnchor.y
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
      return {
        transform: `translate(${-this.page.backgroundImage.posX * this.contentScaleRatio}px, ${-this.page.backgroundImage.posY * this.contentScaleRatio}px)`,
        width: `${this.page.width * this.contentScaleRatio}px`,
        height: `${this.page.height * this.contentScaleRatio}px`,
        outline: `${3 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid #7190CC`,
        'pointer-events': 'none'
      }
    },
    moveStart(event: PointerEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initImgControllerPos = this.getImgController
      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })

      eventUtils.addPointerEvent('pointermove', this.moving)
      eventUtils.addPointerEvent('pointerup', this.moveEnd)

      this.setCursorStyle('move')
    },
    moving(event: MouseEvent) {
      this.setCursorStyle('move')
      event.preventDefault()
      const baseLine = {
        x: -this.getImgWidth / 2 + (this.page.width / this.getPageScale) / 2,
        y: -this.getImgHeight / 2 + (this.page.height / this.getPageScale) / 2
      }
      const translateLimit = {
        width: (this.getImgWidth - this.page.width / this.getPageScale) / 2,
        height: (this.getImgHeight - this.page.height / this.getPageScale) / 2
      }

      const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)

      offsetPos.x = (offsetPos.x / this.getPageScale) * (100 / this.scaleRatio)
      offsetPos.y = (offsetPos.y / this.getPageScale) * (100 / this.scaleRatio)
      const imgPos = this.imgPosMapper(offsetPos)
      if (Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        imgPos.x = imgPos.x - baseLine.x > 0 ? 0 : this.page.width / this.getPageScale - this.getImgWidth
      }
      if (Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        imgPos.y = imgPos.y - baseLine.y > 0 ? 0 : this.page.height / this.getPageScale - this.getImgHeight
      }
      // PageUtils.updateBackgroundImagePos(this.pageIndex, imgPos.x, imgPos.y)
      this.updateConfig({ imgX: imgPos.x, imgY: imgPos.y })
    },
    imgPosMapper(offsetPos: ICoordinate): ICoordinate {
      const angleInRad = this.getPageRotate * Math.PI / 180
      return {
        x: offsetPos.x * Math.cos(angleInRad) + offsetPos.y * Math.sin(angleInRad) + this.initImgPos.imgX,
        y: -offsetPos.x * Math.sin(angleInRad) + offsetPos.y * Math.cos(angleInRad) + this.initImgPos.imgY
      }
    },
    moveEnd() {
      PageUtils.setBackgroundImageControlDefault()
      stepsUtils.record()
      PageUtils.startBackgroundImageControl(this.pageIndex)
      this.setCursorStyle('default')

      eventUtils.removePointerEvent('pointermove', this.moving)
      eventUtils.removePointerEvent('pointerup', this.moveEnd)
    },
    scaleStart(event: MouseEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initImgControllerPos = this.getImgController
      this.initialWH = {
        width: this.getImgWidth,
        height: this.getImgHeight
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)

      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })
      const angleInRad = this.getPageRotate * Math.PI / 180
      const vect = MouseUtils.getMouseRelPoint(event, this.center)
      const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1
      this.currCursorStyling(event)

      eventUtils.addPointerEvent('pointermove', this.scaling)
      eventUtils.addPointerEvent('pointerup', this.scaleEnd)
    },
    scaling(event: MouseEvent) {
      event.preventDefault()
      let width = this.getImgWidth
      let height = this.getImgHeight

      const angleInRad = this.getPageRotate * Math.PI / 180
      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = MathUtils.getActualMoveOffset(tmp.x, tmp.y)
      const [dx, dy] = [diff.offsetX / this.getPageScale, diff.offsetY / this.getPageScale]

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

      const offsetSize = {
        width: width - initWidth,
        height: height - initHeight
      }
      const imgPos = {
        x: this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.imgX : this.initImgPos.imgX,
        y: this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.imgY : this.initImgPos.imgY
      }
      const baseLine = {
        x: -width / 2 + (this.page.width / this.getPageScale) / 2,
        y: -height / 2 + (this.page.height / this.getPageScale) / 2
      }
      const translateLimit = {
        width: (width - this.page.width / this.getPageScale) / 2,
        height: (height - this.page.height / this.getPageScale) / 2
      }

      const ratio = width / height
      if (Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        if (this.control.xSign < 0) {
          imgPos.x = 0
          offsetSize.width = this.initImgPos.imgX
        } else {
          offsetSize.width = this.page.width - this.initImgPos.imgX - initWidth
        }
        offsetSize.height = offsetSize.width / ratio
        imgPos.y = this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.imgY : this.initImgPos.imgY
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth

        baseLine.x = -width / 2 + (this.page.width / this.getPageScale) / 2
        baseLine.y = -height / 2 + (this.page.height / this.getPageScale) / 2
        translateLimit.width = (width - this.page.width / this.getPageScale) / 2
        translateLimit.height = (height - this.page.height / this.getPageScale) / 2
      }
      if (Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        if (this.control.ySign < 0) {
          imgPos.y = 0
          offsetSize.height = this.initImgPos.imgY
        } else {
          offsetSize.height = this.page.height - this.initImgPos.imgY - initHeight
        }
        offsetSize.width = offsetSize.height * ratio
        imgPos.x = this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.imgX : this.initImgPos.imgX
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth
      }
      // PageUtils.updateBackgroundImageStyles(this.pageIndex, { width, height, imgWidth: width, imgHeight: height })
      // PageUtils.updateBackgroundImagePos(this.pageIndex, imgPos.x, imgPos.y)
      this.updateConfig({ imgX: imgPos.x, imgY: imgPos.y, imgWidth: width, imgHeight: height })
    },
    scaleEnd() {
      this.isControlling = false
      PageUtils.setBackgroundImageControlDefault()
      stepsUtils.record()
      PageUtils.startBackgroundImageControl(this.pageIndex)
      this.setCursorStyle('default')
      eventUtils.removePointerEvent('pointermove', this.scaling)
      eventUtils.removePointerEvent('pointerup', this.scaleEnd)
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
    },
    disableTouchEvent(e: TouchEvent) {
      if (generalUtils.isTouchDevice()) {
        e.preventDefault()
        e.stopPropagation()
      }
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
    &:hover {
      cursor: pointer;
    }
    &__wrapper {
      width: max-content;
      height: max-content;
    }
  }
}

.dim-background {
  // @include size(100%, 100%);
  position: absolute;
  top: 0px;
  left: 0px;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  // transform-style: preserve-3d;
}
</style>
