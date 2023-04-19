<template lang="pug">
div(class="nu-background-controller")
  div(class="nu-controller__body"
      ref="body"
      :style="styles"
      @pointerdown.stop="moveStart"
      @pinch="pinchHandler")
    //- @touchstart="disableTouchEvent"
    div(v-for="(scaler, index) in controlPoints.scalers"
        class="controller-point"
        :key="index"
        :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getPageRotate))"
        @pointerdown.stop="scaleStart")
  //- div(class="nu-controller"
  //-     :style="controllerStyles()")
</template>

<script lang="ts">
import { ICoordinate } from '@/interfaces/frame'
import { ISize } from '@/interfaces/math'
import { IPage } from '@/interfaces/page'
import ControlUtils from '@/utils/controlUtils'
import eventUtils from '@/utils/eventUtils'
import generalUtils from '@/utils/generalUtils'
import MathUtils from '@/utils/mathUtils'
import MouseUtils from '@/utils/mouseUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { AnyTouchEvent } from 'any-touch'
import { defineComponent, PropType } from 'vue'
import { mapGetters, mapMutations } from 'vuex'

export default defineComponent({
  emits: [],
  props: {
    config: {
      type: Object,
      required: true
    },
    pageIndex: {
      type: Number,
      required: true
    },
    page: {
      type: Object as PropType<IPage>,
      required: true
    },
    contentScaleRatio: {
      default: 1,
      type: Number
    }
  },
  data() {
    return {
      controlPoints: ControlUtils.getControlPoints(4, 25, 100 / this.$store.getters.getPageScaleRatio),
      isControlling: false,
      initialPos: { x: 0, y: 0 } as null | ICoordinate,
      initImgPos: { x: 0, y: 0 },
      initImgSize: { width: this.config.styles.imgWidth, height: this.config.styles.imgHeight },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1 },
      initPinchPos: null as null | { x: number, y: number },
      isPinching: false,
      isMoving: false
    }
  },
  mounted() {
    if (generalUtils.isTouchDevice()) {
      const page = document.getElementById(`nu-page-wrapper_${this.pageIndex}`) as HTMLElement
      const rect = page.getBoundingClientRect()
      pageUtils.setMobilePysicalPage({
        pageIndex: this.pageIndex,
        pageSize: { width: rect.width, height: rect.height },
        pageCenterPos: { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 }
      })
    }
  },
  unmounted() {
    pageUtils.setBackgroundImageControlDefault()
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
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
      return 1
      // return this.config.styles.scale
    },
    getPageRotate(): number {
      return 0
    },
    styles(): Record<string, string> {
      return {
        width: `${this.config.styles.imgWidth * this.getPageScale * this.contentScaleRatio}px`,
        height: `${this.config.styles.imgHeight * this.getPageScale * this.contentScaleRatio}px`,
        outline: `${2 * (100 / this.scaleRatio)}px solid #7190CC`
      }
    },
    pageSize(): { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } {
      return this.page.isEnableBleed ? pageUtils.removeBleedsFromPageSize(this.page) : this.page
    },
  },
  methods: {
    ...mapMutations({
      updateConfig: 'imgControl/UPDATE_CONFIG'
    }),
    pinchHandler(event: AnyTouchEvent) {
      switch (event.phase) {
        case 'start': {
          console.warn('start')
          this.isPinching = true
          this.initImgPos = {
            x: this.config.styles.imgX,
            y: this.config.styles.imgY
          }
          this.initImgSize = {
            width: this.config.styles.imgWidth,
            height: this.config.styles.imgHeight
          }

          break
        }
        case 'move': {
          this.isPinching = true
          const { contentScaleRatio, mobilePysicalSize: { pageCenterPos, pageSize } } = this.page
          const { styles } = this.config
          const _sizeRatio = contentScaleRatio
          if (!this.initPinchPos) {
            this.initPinchPos = { x: event.x, y: event.y }
          }
          const posInConfig = {
            x: (event.x - pageCenterPos.x + pageSize.width * 0.5) / _sizeRatio - styles.imgX,
            y: (event.y - pageCenterPos.y + pageSize.height * 0.5) / _sizeRatio - styles.imgY
          }
          const translationRatio = {
            x: -posInConfig.x / styles.imgWidth,
            y: -posInConfig.y / styles.imgHeight
          }
          const sizeDiff = {
            width: this.initImgSize.width * (event.scale - 1) * 0.5,
            height: this.initImgSize.height * (event.scale - 1) * 0.5
          }
          const newSize = {
            width: this.initImgSize.width + sizeDiff.width,
            height: this.initImgSize.height + sizeDiff.height
          }
          const movingTraslate = {
            x: (event.x - this.initPinchPos.x) / _sizeRatio,
            y: (event.y - this.initPinchPos.y) / _sizeRatio
          }
          const newPos = {
            x: this.initImgPos.x + (sizeDiff.width * translationRatio.x) + movingTraslate.x,
            y: this.initImgPos.y + (sizeDiff.height * translationRatio.y) + movingTraslate.y,
          }
          const { imgWidth, imgHeight, imgX, imgY } = this.imgPinchScaleClamp(newSize, newPos, translationRatio, movingTraslate)
          this.updateConfig({ imgX, imgY, imgWidth, imgHeight })
          break
        }
        case 'end': {
          console.warn('end', this.initialPos)
          this.isPinching = false
          if (!this.isMoving) {
            Object.assign(this.initImgPos, { x: this.getImgX, y: this.getImgY })
            eventUtils.addPointerEvent('pointermove', this.moving)
            eventUtils.addPointerEvent('pointerup', this.moveEnd)
            this.setCursorStyle('move')
          }
          this.initialPos = null

          this.initPinchPos = null
          this.initImgPos = {
            x: this.config.styles.imgX,
            y: this.config.styles.imgY
          }
          this.initImgSize = {
            width: this.config.styles.imgWidth,
            height: this.config.styles.imgHeight
          }
        }
      }
    },
    imgPinchScaleClamp(newSize: ISize, newPos: ICoordinate, translationRatio: { x: number, y: number }, movingTraslate: { x: number, y: number }) {
      const baseLine = {
        x: -newSize.width * 0.5 + (this.pageSize.width / this.getPageScale) * 0.5,
        y: -newSize.height * 0.5 + (this.pageSize.height / this.getPageScale) * 0.5
      }
      const translateLimit = {
        width: (newSize.width - this.pageSize.width / this.getPageScale) * 0.5,
        height: (newSize.height - this.pageSize.height / this.getPageScale) * 0.5
      }
      const sizeDiff = {
        width: newSize.width - this.initImgSize.width,
        height: newSize.height - this.initImgSize.height
      }
      if (Math.abs(newPos.x - baseLine.x) > translateLimit.width) {
        /**
         * The imgX has already been 0,
         * or the bgImg is exact algined with the right edge limit.
         * The new state should remain as the old one.
         */
        if (this.getImgX === 0 || Math.round(-this.getImgX + this.pageSize.width - this.getImgWidth) === 0) {
          return {
            imgWidth: this.getImgWidth,
            imgHeight: this.getImgHeight,
            imgX: this.getImgX,
            imgY: this.getImgY
          }
        } else {
          let pinchScale = -1
          if (newPos.x - baseLine.x > 0) {
            newPos.x = 0
            sizeDiff.width = -(this.initImgPos.x + movingTraslate.x) / translationRatio.x
          } else {
            /**
             * Derived from.
             * newPos.x = this.pageSize.width - (this.pageSize.width + this.initImgSize.width)
             * newPos.x = this.initImgPos.x + (sizeDiff.width * translationRatio.x) + (event.x - this.initPinchPos.x) / _sizeRatio
             */
            sizeDiff.width = -(this.initImgPos.x + movingTraslate.x - this.pageSize.width + this.initImgSize.width) / (1 + translationRatio.x)
            newPos.x = this.pageSize.width - (this.initImgSize.width + sizeDiff.width)
          }
          newSize.width = this.initImgSize.width + sizeDiff.width
          pinchScale = (sizeDiff.width * 2 / this.initImgSize.width) + 1
          sizeDiff.height = this.initImgSize.height * (pinchScale - 1) * 0.5
          newSize.height = this.initImgSize.height + sizeDiff.height
          newPos.y = this.initImgPos.y + (sizeDiff.height * translationRatio.y) + movingTraslate.y

          baseLine.x = -newSize.width * 0.5 + (this.pageSize.width / this.getPageScale) * 0.5
          baseLine.y = -newSize.height * 0.5 + (this.pageSize.height / this.getPageScale) * 0.5
          translateLimit.width = (newSize.width - this.pageSize.width / this.getPageScale) * 0.5
          translateLimit.height = (newSize.height - this.pageSize.height / this.getPageScale) * 0.5
        }
      }
      if (Math.abs(newPos.y - baseLine.y) > translateLimit.height) {
        if (this.getImgY === 0 || Math.round(-this.getImgY + this.pageSize.height - this.getImgHeight) === 0) {
          return {
            imgWidth: this.getImgWidth,
            imgHeight: this.getImgHeight,
            imgX: this.getImgX,
            imgY: this.getImgY
          }
        } else {
          let pinchScale = -1
          if (newPos.y - baseLine.y > 0) {
            newPos.y = 0
            sizeDiff.height = -(this.initImgPos.y + movingTraslate.y) / translationRatio.y
          } else {
            sizeDiff.height = -(this.initImgPos.y + movingTraslate.y - this.pageSize.height + this.initImgSize.height) / (1 + translationRatio.y)
            newPos.y = this.pageSize.height - (this.initImgSize.height + sizeDiff.height)
          }
          newSize.height = this.initImgSize.height + sizeDiff.height
          pinchScale = (sizeDiff.height * 2 / this.initImgSize.height) + 1
          sizeDiff.width = this.initImgSize.width * (pinchScale - 1) * 0.5
          newSize.width = this.initImgSize.width + sizeDiff.width
          newPos.x = this.initImgPos.x + (sizeDiff.width * translationRatio.x) + movingTraslate.x
        }
      }
      return {
        imgWidth: newSize.width,
        imgHeight: newSize.height,
        imgX: newPos.x,
        imgY: newPos.y
      }
    },
    moveStart(event: PointerEvent) {
      this.isPinching = false
      this.isMoving = true
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      Object.assign(this.initImgPos, { x: this.getImgX, y: this.getImgY })

      eventUtils.addPointerEvent('pointermove', this.moving)
      eventUtils.addPointerEvent('pointerup', this.moveEnd)

      this.setCursorStyle('move')
    },
    moving(event: PointerEvent) {
      if (this.isPinching) {
      // if (eventUtils.checkIsMultiTouch(event) || this.isPinching) {
        return
      }
      /**
       * The initialPos might be null bcz after the pinch-scaling,
       * the pos of the initialPos should be re-assigned
       */
      if (this.initialPos === null) {
        this.initialPos = MouseUtils.getMouseAbsPoint(event)
        Object.assign(this.initImgPos, { x: this.getImgX, y: this.getImgY })
      }
      event.preventDefault()
      const baseLine = {
        x: -this.getImgWidth * 0.5 + (this.pageSize.width / this.getPageScale) * 0.5,
        y: -this.getImgHeight * 0.5 + (this.pageSize.height / this.getPageScale) * 0.5
      }
      const translateLimit = {
        width: (this.getImgWidth - this.pageSize.width / this.getPageScale) * 0.5,
        height: (this.getImgHeight - this.pageSize.height / this.getPageScale) * 0.5
      }

      const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)

      offsetPos.x = (offsetPos.x / this.getPageScale) * (100 / this.scaleRatio) / this.page.contentScaleRatio
      offsetPos.y = (offsetPos.y / this.getPageScale) * (100 / this.scaleRatio) / this.page.contentScaleRatio
      const imgPos = this.imgPosMapper(offsetPos)
      if (Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        imgPos.x = imgPos.x - baseLine.x > 0 ? 0 : this.pageSize.width / this.getPageScale - this.getImgWidth
      }
      if (Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        imgPos.y = imgPos.y - baseLine.y > 0 ? 0 : this.pageSize.height / this.getPageScale - this.getImgHeight
      }
      this.updateConfig({ imgX: imgPos.x, imgY: imgPos.y })
    },
    imgPosMapper(offsetPos: ICoordinate): ICoordinate {
      const angleInRad = this.getPageRotate * Math.PI / 180
      return {
        x: offsetPos.x * Math.cos(angleInRad) + offsetPos.y * Math.sin(angleInRad) + this.initImgPos.x,
        y: -offsetPos.x * Math.sin(angleInRad) + offsetPos.y * Math.cos(angleInRad) + this.initImgPos.y
      }
    },
    moveEnd(event: PointerEvent) {
      this.isMoving = false
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      // pageUtils.setBackgroundImageControlDefault()
      // stepsUtils.record()
      // pageUtils.startBackgroundImageControl(this.pageIndex)
      this.setCursorStyle('default')

      eventUtils.removePointerEvent('pointermove', this.moving)
      eventUtils.removePointerEvent('pointerup', this.moveEnd)
    },
    scaleStart(event: MouseEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initImgSize = {
        width: this.getImgWidth,
        height: this.getImgHeight
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)
      Object.assign(this.initImgPos, { x: this.getImgX, y: this.getImgY })
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
      if (eventUtils.checkIsMultiTouch(event) || !this.initialPos) {
        return
      }
      event.preventDefault()
      let width = this.getImgWidth
      let height = this.getImgHeight
      const angleInRad = this.getPageRotate * Math.PI / 180
      const tmp = MouseUtils.getMouseRelPoint(event, this.initialPos)
      const diff = MathUtils.getActualMoveOffset(tmp.x, tmp.y)
      const [dx, dy] = [diff.offsetX / this.getPageScale / this.page.contentScaleRatio, diff.offsetY / this.getPageScale / this.page.contentScaleRatio]

      const offsetWidth = this.control.xSign * (dy * Math.sin(angleInRad) + dx * Math.cos(angleInRad))
      const offsetHeight = this.control.ySign * (dy * Math.cos(angleInRad) - dx * Math.sin(angleInRad))
      if (offsetWidth === 0 || offsetHeight === 0) return

      const initWidth = this.initImgSize.width
      const initHeight = this.initImgSize.height

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
        x: this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.x : this.initImgPos.x,
        y: this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.y : this.initImgPos.y
      }
      const baseLine = {
        x: -width * 0.5 + (this.pageSize.width / this.getPageScale) * 0.5,
        y: -height * 0.5 + (this.pageSize.height / this.getPageScale) * 0.5
      }
      const translateLimit = {
        width: (width - this.pageSize.width / this.getPageScale) * 0.5,
        height: (height - this.pageSize.height / this.getPageScale) * 0.5
      }

      const ratio = width / height
      if (Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        if (this.control.xSign < 0) {
          imgPos.x = 0
          offsetSize.width = this.initImgPos.x
        } else {
          offsetSize.width = this.pageSize.width - this.initImgPos.x - initWidth
        }
        offsetSize.height = offsetSize.width / ratio
        imgPos.y = this.control.ySign < 0 ? -offsetSize.height + this.initImgPos.y : this.initImgPos.y
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth

        baseLine.x = -width * 0.5 + (this.pageSize.width / this.getPageScale) * 0.5
        baseLine.y = -height * 0.5 + (this.pageSize.height / this.getPageScale) * 0.5
        translateLimit.width = (width - this.pageSize.width / this.getPageScale) * 0.5
        translateLimit.height = (height - this.pageSize.height / this.getPageScale) * 0.5
      }
      if (Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        if (this.control.ySign < 0) {
          imgPos.y = 0
          offsetSize.height = this.initImgPos.y
        } else {
          offsetSize.height = this.pageSize.height - this.initImgPos.y - initHeight
        }
        offsetSize.width = offsetSize.height * ratio
        imgPos.x = this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.x : this.initImgPos.x
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth
      }
      this.updateConfig({ imgX: imgPos.x, imgY: imgPos.y, imgWidth: width, imgHeight: height })
    },
    scaleEnd(e: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(e)) {
        return
      }
      this.isControlling = false
      // pageUtils.setBackgroundImageControlDefault()
      stepsUtils.record()
      pageUtils.startBackgroundImageControl(this.pageIndex)
      this.setCursorStyle('default')
      eventUtils.removePointerEvent('pointermove', this.scaling)
      eventUtils.removePointerEvent('pointerup', this.scaleEnd)
    },
    cursorStyles(index: number, rotateAngle: number): Record<string, string> {
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
  }
})
</script>

<style lang="scss" scoped>
.nu-background-controller {
  position: absolute;
  top:0;
}
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
    pointer-events: initial;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    &:hover {
      cursor: move;
    }
    &__wrapper {
      width: max-content;
      height: max-content;
    }
  }
}
</style>
