import { IFrame, IImage, ILayer, IShape } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import frameUtils from '@/utils/frameUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pageUtils from '@/utils/pageUtils'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
import shapeUtils from '@/utils/shapeUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import { AnyTouchEvent } from 'any-touch'

export default class PinchControlUtils {
  private init = null as null | {
    evtPos: { x: number, y: number },
    evtScale: number,
    evtAngle: number,
    layerPos: { x: number, y: number }
    scale: number,
    size: ISize,
    img?: { imgWidth: number, imgHeight: number, imgX: number, imgY: number },
    rotate: number
  }

  private id = generalUtils.generateRandomString(4)
  private layerInfo: ILayerInfo
  private _config?: ILayer
  private movingUtils: MovingUtils

  get config() {
    return this._config ?? layerUtils.getLayer(this.layerInfo.pageIndex, this.layerInfo.layerIndex)
  }

  constructor(data: { layerInfo: ILayerInfo, config?: ILayer, movingUtils: MovingUtils }) {
    const { layerInfo, config, movingUtils } = data
    this._config = config
    this.layerInfo = layerInfo
    this.movingUtils = movingUtils
    this.pinch = this.pinch.bind(this)
  }

  pinch(e: AnyTouchEvent) {
    requestAnimationFrame(() => {
      switch (e.phase) {
        case 'move':
          return this.move(e)
        case 'end':
          return this.end(e)
      }
    })
  }

  initialize(e: AnyTouchEvent) {
    if (layerUtils.layerIndex === -1) {
      groupUtils.select(this.layerInfo.pageIndex, [this.layerInfo.layerIndex])
    }
    store.commit('SET_STATE', {
      controlState: {
        layerInfo: this.layerInfo,
        type: 'pinch',
        id: this.id
      }
    })
    if (store.getters['vivisticker/getControllerHidden']) {
      stkWVUtils.showController()
    }

    this.init = {
      evtPos: { x: e.x, y: e.y },
      evtScale: (e.nativeEvent as any).scale,
      evtAngle: (e.nativeEvent as any).rotation % 180,
      layerPos: { x: this.config.styles.x, y: this.config.styles.y },
      size: { width: this.config.styles.width, height: this.config.styles.height },
      scale: this.config.styles.scale,
      rotate: this.config.styles.rotate,
    }
    if (this.config.type === 'image') {
      this.init.img = {
        imgWidth: (this.config as IImage).styles.imgWidth,
        imgHeight: (this.config as IImage).styles.imgHeight,
        imgX: (this.config as IImage).styles.imgX,
        imgY: (this.config as IImage).styles.imgY,
      }
    } else if (this.config.type === 'frame' && frameUtils.isImageFrame(this.config as IFrame)) {
      this.init.img = {
        imgWidth: (this.config as IFrame).clips[0].styles.imgWidth,
        imgHeight: (this.config as IFrame).clips[0].styles.imgHeight,
        imgX: (this.config as IFrame).clips[0].styles.imgX,
        imgY: (this.config as IFrame).clips[0].styles.imgY,
      }
    } else if (this.config.type === 'shape' && this.config.category === 'D') {
      const { angle } = shapeUtils.lineDimension((this.config as any).point)
      this.init.rotate = angle / Math.PI * 180
    }
    return this.init
  }

  move(e: AnyTouchEvent) {
    // initialization
    if (this.init === null) {
      this.init = this.initialize(e)
    }

    const evtScale = (e.nativeEvent as any).scale / this.init.evtScale
    let evtAngle = (e.nativeEvent as any).rotation % 180 - this.init.evtAngle
    // following math demostrated as a workround for anytouch e.angle always return integer,
    if (Math.abs(evtAngle - e.angle) > 90) {
      evtAngle -= 180
    }
    if (evtAngle < 0) {
      evtAngle += 360
    }

    const newScale = evtScale * this.init.scale
    const newSize = {
      width: this.init.size.width * evtScale,
      height: this.init.size.height * evtScale
    }
    const movingTranslate = {
      x: e.x - this.init.evtPos.x,
      y: e.y - this.init.evtPos.y
    }
    const compensateTranslate = {
      x: (this.init.size.width - newSize.width) * 0.5,
      y: (this.init.size.height - newSize.height) * 0.5
    }
    const totalTranslate = {
      x: movingTranslate.x + compensateTranslate.x,
      y: movingTranslate.y + compensateTranslate.y
    }

    const snapUtils = pageUtils.getPageState(this.layerInfo.pageIndex).modules.snapUtils
    const rotate = snapUtils.calAngleSnapHandler((evtAngle + this.init.rotate) % 360, { snapIncrement: 45, allowedOffset: 5 })

    let styles = {
      scale: newScale,
      width: newSize.width,
      height: newSize.height,
      rotate,
      x: this.init.layerPos.x + totalTranslate.x,
      y: this.init.layerPos.y + totalTranslate.y
    } as { [key: string]: number | undefined }

    if (this.init.img) {
      const imgWidth = this.init.img.imgWidth * evtScale
      const imgHeight = this.init.img.imgHeight * evtScale
      const imgX = this.init.img.imgX * evtScale
      const imgY = this.init.img.imgY * evtScale
      if (this.config.type === 'image') {
        styles.imgWidth = imgWidth
        styles.imgHeight = imgHeight
        styles.imgX = imgX
        styles.imgY = imgY
      } else if (frameUtils.isImageFrame(this.config as IFrame)) {
        console.warn('is frame image')
        frameUtils.updateFrameLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, 0, {
          width: newSize.width,
          height: newSize.height,
          imgWidth,
          imgHeight,
          imgX,
          imgY
        })
      }
    } else if (this.config.type === 'shape' && this.config.category === 'D') {
      const shape = this.config as IShape
      const { point, dx, dy } = shapeUtils.lineCenterRotate(shape.point as number[], rotate, shape.size?.[0] ?? 1, false)
      styles = {
        x: this.config.styles.x + e.deltaX + dx,
        y: this.config.styles.y + e.deltaY + dy
      }
      controlUtils.updateShapeLinePoint(this.layerInfo.pageIndex, this.layerInfo.layerIndex, point)
    }

    if (this.layerInfo.pageIndex !== -1 && this.layerInfo.layerIndex !== -1) {
      layerUtils.updateLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, styles)
    }
    // console.log(this.id, styles)
    // console.log((e.nativeEvent as any).rotation)
  }

  end(e: AnyTouchEvent) {
    console.warn('pinch end', store.getters.getControlState.id, this.id)
    this.init = null
    if (store.getters.getControlState.id === this.id) {
      store.commit('SET_STATE', { controlState: { type: '' } })
      const nativeEvt = e.nativeEvent as TouchEvent
      const isHasOnePtrEvt = pointerEvtUtils.pointers.length === 1
      const isLayerExist = layerUtils.getLayer(this.layerInfo.pageIndex, this.layerInfo.layerIndex).id === this.config.id
      // console.log('pinch end', pointerEvtUtils.pointers, pointerEvtUtils.pointers[0], nativeEvt.touches.length)
      if (isHasOnePtrEvt && isLayerExist) {
        this.movingUtils.moveStart(nativeEvt, { pointerId: pointerEvtUtils.pointerIds[0] ?? 0, isFollowByPinch: true })
      }
    }
  }
}
