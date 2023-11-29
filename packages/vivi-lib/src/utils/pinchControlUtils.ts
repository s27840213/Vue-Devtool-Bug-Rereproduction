import { IFrame, IImage, ILayer, IShape, IText } from '@/interfaces/layer'
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
import stepsUtils from './stepsUtils'
import textPropUtils from './textPropUtils'
import textUtils from './textUtils'

export default class PinchControlUtils {
  private init = null as null | {
    evtPos: { x: number, y: number },
    evtScale: number,
    layerPos: { x: number, y: number }
    scale: number,
    size: ISize,
    img?: { imgWidth: number, imgHeight: number, imgX: number, imgY: number },
    rotate: number
    shape?: {
      initCorRadPercentage: number
    },
    touches: Array<{ pos: { x: number, y: number } }>
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
      layerPos: { x: this.config.styles.x, y: this.config.styles.y },
      size: { width: this.config.styles.width, height: this.config.styles.height },
      scale: this.config.styles.scale,
      rotate: this.config.styles.rotate,
      touches: [
        {
          pos: {
            x: (e.nativeEvent as TouchEvent).touches[0].clientX,
            y: (e.nativeEvent as TouchEvent).touches[0].clientY
          }
        },
        {
          pos: {
            x: (e.nativeEvent as TouchEvent).touches[1].clientX,
            y: (e.nativeEvent as TouchEvent).touches[1].clientY
          }
        }
      ]
    }
    switch (this.config.type) {
      case 'image':
        this.init.img = {
          imgWidth: (this.config as IImage).styles.imgWidth,
          imgHeight: (this.config as IImage).styles.imgHeight,
          imgX: (this.config as IImage).styles.imgX,
          imgY: (this.config as IImage).styles.imgY,
        }
        break
      case 'frame': {
        if (frameUtils.isImageFrame(this.config as IFrame)) {
          this.init.img = {
            imgWidth: (this.config as IFrame).clips[0].styles.imgWidth,
            imgHeight: (this.config as IFrame).clips[0].styles.imgHeight,
            imgX: (this.config as IFrame).clips[0].styles.imgX,
            imgY: (this.config as IFrame).clips[0].styles.imgY,
          }
        }
        break
      }
      case 'shape': {
        if (this.config.category === 'D') {
          const { angle } = shapeUtils.lineDimension((this.config as any).point)
          this.init.rotate = angle / Math.PI * 180
        } else if (this.config.category === 'E') {
          const shape = this.config as IShape
          this.init.shape = {
            initCorRadPercentage: controlUtils.getCorRadPercentage(shape.vSize, shape.size as number[], shape.shapeType as string)
          }
          console.log('controlUtils.getCorRadPercentage(shape.vSize, shape.size as number[], shape.shapeType as string)', controlUtils.getCorRadPercentage(shape.vSize, shape.size as number[], shape.shapeType as string), this.init)
        }
        break
      }
    }
    return this.init
  }

  move(e: AnyTouchEvent) {
    // initialization
    if (this.init === null) {
      this.init = this.initialize(e)
    }

    const evtScale = (e.nativeEvent as any).scale / this.init.evtScale
    // calc rotate angle
    const touches = (e.nativeEvent as TouchEvent).touches
    const lineA = {
      x: this.init.touches[1].pos.x - this.init.touches[0].pos.x,
      y: this.init.touches[1].pos.y - this.init.touches[0].pos.y
    }
    const lineB = {
      x: touches[1].clientX - touches[0].clientX,
      y: touches[1].clientY - touches[0].clientY
    }
    const AdotB = lineA.x * lineB.x + lineA.y * lineB.y
    let _angle = Math.acos(AdotB / (Math.sqrt(lineA.x ** 2 + lineA.y ** 2) * Math.sqrt(lineB.x ** 2 + lineB.y ** 2)))
    const AcrossB = lineA.x * lineB.y - lineA.y * lineB.x
    if (AcrossB < 0) {
      _angle *= -1
    }
    _angle = _angle * 180 / Math.PI

    const newScale = evtScale * this.init.scale
    const newSize = {
      width: this.init.size.width * evtScale,
      height: this.init.size.height * evtScale
    }
    const movingTranslate = {
      x: (e.x - this.init.evtPos.x) / store.getters.getContentScaleRatio,
      y: (e.y - this.init.evtPos.y) / store.getters.getContentScaleRatio
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
    const rotate = snapUtils.calAngleSnapHandler((_angle + this.init.rotate) % 360, { snapIncrement: 45, allowedOffset: 5 })

    let styles = {
      scale: newScale,
      width: newSize.width,
      height: newSize.height,
      rotate,
      x: this.init.layerPos.x + totalTranslate.x,
      y: this.init.layerPos.y + totalTranslate.y
    } as { [key: string]: number }

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
        frameUtils.updateFrameLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, 0, {
          width: newSize.width,
          height: newSize.height,
          imgWidth,
          imgHeight,
          imgX,
          imgY
        })
      }
    } else if (this.config.type === 'shape') {
      const shape = this.config as IShape
      if (this.config.category === 'D') {
        const { point, dx, dy } = shapeUtils.lineCenterRotate(shape.point as number[], rotate, shape.size?.[0] ?? 1, false)
        styles = {
          x: this.config.styles.x + e.deltaX + dx,
          y: this.config.styles.y + e.deltaY + dy
        }
        controlUtils.updateShapeLinePoint(this.layerInfo.pageIndex, this.layerInfo.layerIndex, point)
      } else if (this.config.category === 'E') {
        // controlUtils.updateShapeVSize(this.layerInfo.pageIndex, this.layerInfo.layerIndex, [styles.width, styles.height])
        // const corRad = controlUtils.getCorRadValue([styles.width, styles.height], this.init?.shape?.initCorRadPercentage as number, this.config.shapeType as string)
        // controlUtils.updateShapeCorRad(this.layerInfo.pageIndex, this.layerInfo.layerIndex, (this.config as IShape).size as number[], corRad)
      }
    }

    if (this.layerInfo.pageIndex !== -1 && this.layerInfo.layerIndex !== -1) {
      layerUtils.updateLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, styles)
    }
    // console.log(this.id, styles)
    // console.log((e.nativeEvent as any).rotation)
  }

  end(e: AnyTouchEvent) {
    console.warn('pinch end', store.getters.getControlState.id, this.id)
    this.endLayerHandle()

    this.init = null

    if (store.getters.getControlState.id === this.id) {
      store.commit('SET_STATE', { controlState: { type: '' } })
      const nativeEvt = e.nativeEvent as TouchEvent
      const isHasOnePtrEvt = pointerEvtUtils.pointers.length === 1
      const isLayerExist = layerUtils.getLayer(this.layerInfo.pageIndex, this.layerInfo.layerIndex).id === this.config.id
      if (isHasOnePtrEvt && isLayerExist) {
        this.movingUtils.moveStart(nativeEvt, { pointerId: pointerEvtUtils.pointerIds[0] ?? 0, isFollowByPinch: true })
      }
    } else {
      stepsUtils.record()
    }
  }

  endLayerHandle() {
    switch (this.config.type) {
      case 'text': {
        const config = this.config as IText
        if (config.styles.writingMode.includes('vertical')) {
          const textHW = textUtils.getTextHW(this.config as IText, this.config.styles.height)
          this.config.styles.width = textHW.width
          controlUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { widthLimit: this.config.styles.height, spanDataList: textHW.spanDataList })
        } else {
          const textHW = textUtils.getTextHW(this.config as IText, this.config.styles.width)
          this.config.styles.height = textHW.height
          controlUtils.updateLayerProps(layerUtils.pageIndex, layerUtils.layerIndex, { widthLimit: this.config.styles.width, spanDataList: textHW.spanDataList })
        }
        const textInitWidth = this.config.styles.width / this.config.styles.scale
        const textInitHeight = this.config.styles.height / this.config.styles.scale
        controlUtils.updateLayerInitSize(this.layerInfo.pageIndex, this.layerInfo.layerIndex, textInitWidth, textInitHeight)
        textPropUtils.updateTextPropState('fontSize', true)
        break
      }
      case 'shape': {
        if (this.config.category === 'E') {
          controlUtils.updateShapeVSize(this.layerInfo.pageIndex, this.layerInfo.layerIndex, [this.config.styles.width, this.config.styles.height])
          const corRad = controlUtils.getCorRadValue([this.config.styles.width, this.config.styles.height], this.init?.shape?.initCorRadPercentage as number, this.config.shapeType as string)
          controlUtils.updateShapeCorRad(this.layerInfo.pageIndex, this.layerInfo.layerIndex, (this.config as IShape).size as number[], corRad)
          layerUtils.updateLayerStyles(layerUtils.pageIndex, layerUtils.layerIndex, { scale: 1 })
        }
      }
    }
  }
}
