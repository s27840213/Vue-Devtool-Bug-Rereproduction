<template lang="pug">
  div(class="nu-img-controller")
    div(class="nu-controller"
      :style="controllerStyles()")
    div(class="nu-controller__body"
        ref="body"
        :style="styles"
        @pointerdown.stop="moveStart"
        @touchstart="disableTouchEvent")
      div(v-for="(scaler, index) in controlPoints.scalers"
          class="controller-point"
          :key="index"
          :style="Object.assign(scaler.styles, cursorStyles(scaler.cursor, getLayerRotate), { pointerEvents: forRender ? 'none' : 'initial' })"
          @pointerdown.prevent.stop="scaleStart"
          @touchstart="disableTouchEvent")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import MouseUtils from '@/utils/mouseUtils'
import ControlUtils from '@/utils/controlUtils'
import { ICoordinate } from '@/interfaces/frame'
import MathUtils from '@/utils/mathUtils'
import LayerUtils from '@/utils/layerUtils'
import FrameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import eventUtils from '@/utils/eventUtils'
import imageShadowUtils from '@/utils/imageShadowUtils'
import pageUtils from '@/utils/pageUtils'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { ShadowEffectType } from '@/interfaces/imgShadow'

export default defineComponent({
  props: {
    config: Object,
    layerIndex: Number,
    pageIndex: Number,
    primaryLayerIndex: Number,
    primaryLayer: Object,
    forRender: {
      type: Boolean,
      default: false
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
      control: { xSign: 1, ySign: 1, isHorizon: false },
      isSnappedInVertical: false
    }
  },
  mounted() {
    if (this.forRender) {
      return
    }
    const shadow = (this.config as IImage).styles.shadow
    if (shadow && ![ShadowEffectType.none, ShadowEffectType.floating].includes(shadow.currentEffect)) {
      if (shadow.currentEffect === ShadowEffectType.imageMatched || shadow.isTransparent) {
        imageShadowUtils.setProcessId({
          pageId: pageUtils.currFocusPage.id,
          layerId: this.primaryLayer ? this.primaryLayer.id : this.config.id,
          subLayerId: this.primaryLayer ? this.config.id : undefined
        })
        const hasPrimaryLayer = typeof this.primaryLayerIndex !== 'undefined' && this.primaryLayerIndex !== -1
        imageShadowUtils.updateShadowSrc({
          pageIndex: this.pageIndex,
          layerIndex: hasPrimaryLayer ? this.primaryLayerIndex : this.layerIndex,
          subLayerIdx: hasPrimaryLayer ? this.layerIndex : undefined
        }, { type: '', userId: '', assetId: '' })
      }
    }
  },
  unmounted() {
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
    styles(): any {
      const zindex = (this.layerIndex + 1) * 1000
      const pos = this.imgControllerPosHandler()
      return {
        transform: `translate3d(${pos.x * this.contentScaleRatio}px, ${pos.y * this.contentScaleRatio}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.imgWidth * this.contentScaleRatio}px`,
        height: `${this.config.styles.imgHeight * this.contentScaleRatio}px`,
        outline: `${2 * (100 / this.scaleRatio * this.contentScaleRatio)}px solid #7190CC`,
        'pointer-events': this.pointerEvents ?? 'initial'
      }
    },
    isMobile(): boolean {
      return generalUtils.isTouchDevice()
    },
    pointerEvents(): string {
      return this.forRender ? 'none' : 'initial'
    },
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
    scaledConfig(): { [index: string]: string | number } {
      const { width, height, imgWidth, imgHeight, imgX, imgY } = this.config.styles as IImageStyle
      return {
        width: width * this.contentScaleRatio,
        height: height * this.contentScaleRatio,
        imgWidth: imgWidth * this.contentScaleRatio,
        imgHeight: imgHeight * this.contentScaleRatio,
        imgX: imgX * this.contentScaleRatio,
        imgY: imgY * this.contentScaleRatio
      }
    },
    primaryLayerType(): string {
      return this.primaryLayer.type
    },
    getLayerScale(): number {
      /** only the image in frame use the scale to strech */
      return this.primaryLayer && this.primaryLayerType === 'frame' && !this.config.isFrameImg ? this.config.styles.scale : 1
    },
    getLayerRotate(): number {
      return this.config.styles.rotate
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
    ...mapMutations({
      updateConfig: 'imgControl/UPDATE_CONFIG'
    }),
    controllerStyles() {
      const zindex = 0
      return {
        transform: `translate3d(${this.config.styles.x * this.contentScaleRatio}px, ${this.config.styles.y * this.contentScaleRatio}px, ${zindex}px ) rotate(${this.config.styles.rotate}deg)`,
        width: `${this.config.styles.width * this.contentScaleRatio}px`,
        height: `${this.config.styles.height * this.contentScaleRatio}px`,
        outline: `${2 * (100 / this.scaleRatio * this.contentScaleRatio)}px solid #7190CC`
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
      const scale = this.getLayerScale
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
      // const currLayer = LayerUtils.getCurrLayer
      // if (currLayer.type === 'frame' && !this.config.forRender) {
      //   const baseLine = {
      //     x: -w / 2 + currLayer.styles.width / 2,
      //     y: -h / 2 + currLayer.styles.height / 2
      //   }
      //   imgControllerPos.x += currLayer.styles.horizontalFlip ? -2 * (imgControllerPos.x - baseLine.x) : 0
      //   imgControllerPos.y += currLayer.styles.verticalFlip ? -2 * (imgControllerPos.y - baseLine.y) : 0
      // }

      return imgControllerPos
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
    moveStart(event: MouseEvent | PointerEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })

      eventUtils.addPointerEvent('pointerup', this.moveEnd)
      eventUtils.addPointerEvent('pointermove', this.moving)

      this.setCursorStyle('move')
      this.setLastSelectedLayerIndex(this.layerIndex)
    },
    moving(event: MouseEvent | PointerEvent) {
      this.setCursorStyle('move')
      event.preventDefault()
      const _layerScale = 1 / this.getLayerScale
      const baseLine = {
        x: -this.getImgWidth * 0.5 + (this.config.styles.width * _layerScale) * 0.5,
        y: -this.getImgHeight * 0.5 + (this.config.styles.height * _layerScale) * 0.5
      }
      const translateLimit = {
        width: (this.getImgWidth - this.config.styles.width * _layerScale) * 0.5,
        height: (this.getImgHeight - this.config.styles.height * _layerScale) * 0.5
      }

      const offsetPos = MouseUtils.getMouseRelPoint(event, this.initialPos)
      offsetPos.x = (offsetPos.x * _layerScale) * (100 / this.scaleRatio)
      offsetPos.y = (offsetPos.y * _layerScale) * (100 / this.scaleRatio)

      const currLayer = LayerUtils.getCurrLayer
      if (typeof this.primaryLayerIndex !== 'undefined' && currLayer.type === 'group') {
        const primaryScale = LayerUtils.getCurrLayer.styles.scale
        offsetPos.x /= primaryScale
        offsetPos.y /= primaryScale
      }
      const imgPos = this.imgPosMapper(offsetPos)
      if (Math.abs(imgPos.x - baseLine.x) > translateLimit.width) {
        imgPos.x = imgPos.x - baseLine.x > 0 ? 0 : this.config.styles.width * _layerScale - this.getImgWidth
      }
      if (Math.abs(imgPos.y - baseLine.y) > translateLimit.height) {
        imgPos.y = imgPos.y - baseLine.y > 0 ? 0 : this.config.styles.height * _layerScale - this.getImgHeight
      }
      this.updateConfig({
        imgX: imgPos.x,
        imgY: imgPos.y
      })
    },
    imgPosMapper(offsetPos: ICoordinate): ICoordinate {
      const angleInRad = this.angleInRad
      return {
        x: offsetPos.x * Math.cos(angleInRad) + offsetPos.y * Math.sin(angleInRad) + this.initImgPos.imgX,
        y: -offsetPos.x * Math.sin(angleInRad) + offsetPos.y * Math.cos(angleInRad) + this.initImgPos.imgY
      }
    },
    moveEnd(e: MouseEvent) {
      this.setCursorStyle('default')
      eventUtils.removePointerEvent('pointerup', this.moveEnd)
      eventUtils.removePointerEvent('pointermove', this.moving)
    },
    scaleStart(event: MouseEvent) {
      this.isControlling = true
      this.initialPos = MouseUtils.getMouseAbsPoint(event)
      this.initialWH = {
        width: this.getImgWidth,
        height: this.getImgHeight
      }
      const rect = (this.$refs.body as HTMLElement).getBoundingClientRect()
      this.center = ControlUtils.getRectCenter(rect)

      Object.assign(this.initImgPos, { imgX: this.getImgX, imgY: this.getImgY })
      const angleInRad = this.angleInRad
      const vect = MouseUtils.getMouseRelPoint(event, this.center)
      const clientP = ControlUtils.getNoRotationPos(vect, this.center, angleInRad)

      this.control.xSign = (clientP.x - this.center.x > 0) ? 1 : -1
      this.control.ySign = (clientP.y - this.center.y > 0) ? 1 : -1

      this.currCursorStyling(event)

      eventUtils.addPointerEvent('pointerup', this.scaleEnd)
      eventUtils.addPointerEvent('pointermove', this.scaling)
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
      const [dx, dy] = [diff.offsetX / this.getLayerScale, diff.offsetY / this.getLayerScale]

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
            offsetSize.width = this.config.styles.width - this.initImgPos.imgX - initWidth
            // offsetSize.width = this.config.styles.width / currLayer.styles.scale - this.initImgPos.imgX - initWidth
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
            offsetSize.height = this.config.styles.height - this.initImgPos.imgY - initHeight
            // offsetSize.height = this.config.styles.height / currLayer.styles.scale - this.initImgPos.imgY - initHeight
          } else {
            offsetSize.height = this.config.styles.height - this.initImgPos.imgY - initHeight
          }
        }
        offsetSize.width = offsetSize.height * ratio
        imgPos.x = this.control.xSign < 0 ? -offsetSize.width + this.initImgPos.imgX : this.initImgPos.imgX
        height = offsetSize.height + initHeight
        width = offsetSize.width + initWidth
      }
      this.updateConfig({
        imgWidth: width,
        imgHeight: height,
        imgX: imgPos.x,
        imgY: imgPos.y
      })
    },
    scaleEnd(e: MouseEvent) {
      this.isControlling = false
      this.setCursorStyle('default')

      eventUtils.removePointerEvent('pointerup', this.scaleEnd)
      eventUtils.removePointerEvent('pointermove', this.scaling)
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
      if (this.isMobile) {
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
    &__wrapper {
      width: max-content;
      height: max-content;
    }
  }
}
</style>
