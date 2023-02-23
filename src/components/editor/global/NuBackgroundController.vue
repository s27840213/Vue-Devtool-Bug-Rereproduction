<template lang="pug">
div(class="nu-background-controller")
  div(class="nu-controller__body"
      ref="body"
      :style="styles"
      @pointerdown.stop="moveStart"
      @pinch="pinchHandler")
    //- @touchstart="disableTouchEvent"
    div(v-for="(scaler, index)  in controlPoints.scalers"
        class="controller-point"
        :key="index"
        :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getPageRotate))"
        @pointerdown.stop="scaleStart")
  //- div(class="nu-controller"
  //-     :style="controllerStyles()")
</template>

<script lang="ts">
import { ICoordinate } from '@/interfaces/frame'
import { IPage } from '@/interfaces/page'
import ControlUtils from '@/utils/controlUtils'
import eventUtils from '@/utils/eventUtils'
import MathUtils from '@/utils/mathUtils'
import MouseUtils from '@/utils/mouseUtils'
import pageUtils from '@/utils/pageUtils'
import stepsUtils from '@/utils/stepsUtils'
import { defineComponent, PropType } from 'vue'
import { AnyTouchEvent } from 'any-touch'
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
      controlPoints: ControlUtils.getControlPoints(4, 25),
      isControlling: false,
      initialPos: { x: 0, y: 0 },
      initImgPos: { x: 0, y: 0 },
      initImgControllerPos: { x: 0, y: 0 },
      initImgSize: { width: this.config.styles.imgWidth, height: this.config.styles.imgHeight },
      center: { x: 0, y: 0 },
      control: { xSign: 1, ySign: 1, isHorizon: false },
      ptrSet: new Set(),
      initPinchPos: null as null | { x: number, y: number }
    }
  },
  unmounted() {
    pageUtils.setBackgroundImageControlDefault()
  },
  computed: {
    ...mapGetters({
      scaleRatio: 'getPageScaleRatio'
    }),
    isActive(): boolean {
      return this.config.active
    },
    isShown(): boolean {
      return this.config.shown
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
    dimBgStyles(): Record<string, string> {
      return {
        width: `${this.config.styles.imgWidth * this.contentScaleRatio}px`,
        height: `${this.config.styles.imgHeight * this.contentScaleRatio}px`
      }
    },
    styles(): Record<string, string> {
      // preserve in case the background image is needed to be rotatable in the future
      // const zindex = (this.pageIndex + 1) * 100
      // const pos = this.imgControllerPosHandler()
      // transform: `translate(${pos.x}px, ${pos.y}px) rotate(${this.config.styles.rotate}deg)`
      return {
        width: `${this.config.styles.imgWidth * this.getPageScale * this.contentScaleRatio}px`,
        height: `${this.config.styles.imgHeight * this.getPageScale * this.contentScaleRatio}px`,
        outline: `${2 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid #7190CC`
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
    imgControllerPosHandler(): ICoordinate {
      const angleInRad = this.getPageRotate * Math.PI / 180
      const rectCenter = {
        x: this.pageSize.width / 2,
        y: this.pageSize.height / 2
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
        width: `${this.pageSize.width * this.contentScaleRatio}px`,
        height: `${this.pageSize.height * this.contentScaleRatio}px`,
        outline: `${3 * (100 / this.scaleRatio) * this.contentScaleRatio}px solid #7190CC`,
        'pointer-events': 'none'
      }
    },
    pinchHandler(event: AnyTouchEvent) {
      switch (event.phase) {
        case 'start': {
          console.log('start')
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
          if (!this.initPinchPos) {
            // this.initPinchPos = { x: event.x - pageUtils.pageEventPosOffset.x, y: event.y - pageUtils.pageEventPosOffset.y }
            this.initPinchPos = { x: event.x, y: event.y }
          }

          const translationRatio = {
            x: -(this.initPinchPos.x - pageUtils.pageCenterPos.x) / pageUtils.originPageSize.width,
            y: -(this.initPinchPos.y - pageUtils.pageCenterPos.y) / pageUtils.originPageSize.height
          }
          const sizeDiff = {
            width: this.initImgSize.width * (event.scale - 1) * 0.5,
            height: this.initImgSize.height * (event.scale - 1) * 0.5
          }

          const newSize = {
            width: this.initImgSize.width + sizeDiff.width,
            height: this.initImgSize.height + sizeDiff.height
            // width: this.initImgSize.width,
            // height: this.initImgSize.height
          }
          console.log(this.initImgSize.width * ((event.scale - 1) * 0.5 + 1), this.initImgSize.height * ((event.scale - 1) * 0.5 + 1))
          const newPos = {
            x: this.initImgPos.x + (sizeDiff.width * Math.min(Math.max(translationRatio.x - 0.5, -1), 1)),
            y: this.initImgPos.y + (sizeDiff.height * Math.min(Math.max(translationRatio.y - 0.5, -1), 1)),
          }
          this.updateConfig({ imgX: newPos.x, imgY: newPos.y, imgWidth: newSize.width, imgHeight: newSize.height })
          break
        }
        case 'end': {
          this.initPinchPos = null
          console.log('end')
        }
      }
      //   case 'start': {
      //     this.oriX = pageUtils.getCurrPage.x
      //     this.oriPageSize = (pageUtils.getCurrPage.width * (pageUtils.scaleRatio / 100))
      //     this.tmpScaleRatio = pageUtils.scaleRatio
      //     this.isScaling = true
      //     store.commit('SET_isPageScaling', true)
      //     break
      //   }
      //   case 'move': {
      //     if (!this.isScaling) {
      //       this.isScaling = true
      //       store.commit('SET_isPageScaling', true)
      //     }
      //     window.requestAnimationFrame(() => {
      //       const limitMultiplier = 4
      //       if (pageUtils.mobileMinScaleRatio * limitMultiplier <= this.tmpScaleRatio * event.scale) {
      //         pageUtils.setScaleRatio(pageUtils.mobileMinScaleRatio * limitMultiplier)
      //         return
      //       }
      //       const newScaleRatio = Math.min(this.tmpScaleRatio * event.scale, pageUtils.mobileMinScaleRatio * limitMultiplier)
      //       if (newScaleRatio >= pageUtils.mobileMinScaleRatio * 0.8) {
      //         pageUtils.setScaleRatio(newScaleRatio)

      //         const baseX = (pageUtils.getCurrPage.width * (newScaleRatio / 100) - this.oriPageSize) * 0.5
      //         pageUtils.updatePagePos(0, {
      //           x: this.oriX - baseX
      //         })
      //       }
      //       clearTimeout(this.hanleWheelTimer)
      //       this.hanleWheelTimer = setTimeout(() => {
      //         if (newScaleRatio <= pageUtils.mobileMinScaleRatio) {
      //           const page = document.getElementById(`nu-page-wrapper_${layerUtils.pageIndex}`) as HTMLElement
      //           page.style.transition = '0.2s linear'
      //           this.handleWheelTransition = true
      //           pageUtils.updatePagePos(layerUtils.pageIndex, { x: 0, y: 0 })
      //           this.setPageScaleRatio(pageUtils.mobileMinScaleRatio)
      //           setTimeout(() => {
      //             page.style.transition = ''
      //             this.handleWheelTransition = false
      //           }, 500)
      //         }
      //       }, 500)
      //     })
      //     break
      //   }

      //   case 'end': {
      //     this.isScaling = false
      //     store.commit('SET_isPageScaling', false)
      //     break
      //   }
      // }
    },
    moveStart(event: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initImgControllerPos = this.getImgController
      Object.assign(this.initImgPos, { x: this.getImgX, y: this.getImgY })

      eventUtils.addPointerEvent('pointermove', this.moving)
      eventUtils.addPointerEvent('pointerup', this.moveEnd)

      this.setCursorStyle('move')
    },
    moving(event: PointerEvent) {
      if (!this.ptrSet.has(event.pointerId)) {
        this.ptrSet.add(event.pointerId)
      }
      // if (eventUtils.checkIsMultiTouch(event)) {
      //   return
      // }
      if (eventUtils.checkIsMultiTouch(event) || this.ptrSet.size > 1) {
        return
      }
      this.setCursorStyle('move')
      event.preventDefault()
      const baseLine = {
        x: -this.getImgWidth / 2 + (this.pageSize.width / this.getPageScale) / 2,
        y: -this.getImgHeight / 2 + (this.pageSize.height / this.getPageScale) / 2
      }
      const translateLimit = {
        width: (this.getImgWidth - this.pageSize.width / this.getPageScale) / 2,
        height: (this.getImgHeight - this.pageSize.height / this.getPageScale) / 2
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
      // pageUtils.updateBackgroundImagePos(this.pageIndex, imgPos.x, imgPos.y)
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
      this.ptrSet.clear()
      if (eventUtils.checkIsMultiTouch(event)) {
        return
      }
      pageUtils.setBackgroundImageControlDefault()
      stepsUtils.record()
      pageUtils.startBackgroundImageControl(this.pageIndex)
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
      this.initImgControllerPos = this.getImgController
      this.initImgSize = {
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
      if (eventUtils.checkIsMultiTouch(event)) {
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
        x: -width / 2 + (this.pageSize.width / this.getPageScale) / 2,
        y: -height / 2 + (this.pageSize.height / this.getPageScale) / 2
      }
      const translateLimit = {
        width: (width - this.pageSize.width / this.getPageScale) / 2,
        height: (height - this.pageSize.height / this.getPageScale) / 2
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

        baseLine.x = -width / 2 + (this.pageSize.width / this.getPageScale) / 2
        baseLine.y = -height / 2 + (this.pageSize.height / this.getPageScale) / 2
        translateLimit.width = (width - this.pageSize.width / this.getPageScale) / 2
        translateLimit.height = (height - this.pageSize.height / this.getPageScale) / 2
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
      // pageUtils.updateBackgroundImageStyles(this.pageIndex, { width, height, imgWidth: width, imgHeight: height })
      // pageUtils.updateBackgroundImagePos(this.pageIndex, imgPos.x, imgPos.y)
      this.updateConfig({ imgX: imgPos.x, imgY: imgPos.y, imgWidth: width, imgHeight: height })
    },
    scaleEnd(e: PointerEvent) {
      if (eventUtils.checkIsMultiTouch(e)) {
        return
      }
      this.isControlling = false
      pageUtils.setBackgroundImageControlDefault()
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
    disableTouchEvent(e: TouchEvent) {
      if (this.$isTouchDevice()) {
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
