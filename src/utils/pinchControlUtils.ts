import { IImage, ILayer, IShape } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import controlUtils from '@/utils/controlUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
import shapeUtils from '@/utils/shapeUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { AnyTouchEvent } from 'any-touch'

export default class PinchControlUtils {
  private init = null as null | {
    pos: { x: number, y: number },
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

  move(e: AnyTouchEvent) {
    // initialization
    if (this.init === null) {
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
        vivistickerUtils.showController()
      }

      this.init = {
        pos: { x: e.x, y: e.y },
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
      } else if (this.config.type === 'shape' && this.config.category === 'D') {
        const { angle } = shapeUtils.lineDimension((this.config as any).point)
        this.init.rotate = angle / Math.PI * 180
      }
    }

    const evtScale = (e.nativeEvent as any).scale
    let evtAngle = (e.nativeEvent as any).rotation % 180
    // following math demostrated as workround for anytouch e.angle always return integer,
    if (Math.abs(evtAngle - e.angle) > 90) {
      if (evtAngle > 0) {
        evtAngle -= 180
      } else {
        evtAngle -= 180
      }
    }

    const newScale = evtScale * this.init.scale
    const newSize = {
      width: this.init.size.width * evtScale,
      height: this.init.size.height * evtScale
    }
    const movingTranslate = {
      x: e.x - this.init.pos.x,
      y: e.y - this.init.pos.y
    }
    const compensateTranslate = {
      x: (this.init.size.width - newSize.width) * 0.5,
      y: (this.init.size.height - newSize.height) * 0.5
    }
    const totalTranslate = {
      x: movingTranslate.x + compensateTranslate.x,
      y: movingTranslate.y + compensateTranslate.y
    }
    let styles = {
      scale: newScale,
      width: newSize.width,
      height: newSize.height,
      rotate: evtAngle + this.init.rotate,
      x: this.init.layerPos.x + totalTranslate.x,
      y: this.init.layerPos.y + totalTranslate.y
    } as { [key: string]: number | undefined }

    if (this.config.type === 'image' && this.init.img) {
      styles.imgWidth = this.init.img.imgWidth * evtScale
      styles.imgHeight = this.init.img.imgHeight * evtScale
      styles.imgX = this.init.img.imgX * evtScale
      styles.imgY = this.init.img.imgY * evtScale
    } else if (this.config.type === 'shape' && this.config.category === 'D') {
      const shape = this.config as IShape
      const { point, dx, dy } = shapeUtils.lineCenterRotate(shape.point as number[], evtAngle + this.init.rotate, shape.size?.[0] ?? 1, false)
      // const newPoint = [0, 0, point[2] * e.deltaScale, point[3] * e.deltaScale]
      // const [scaleDX, scaleDY] = [point[2] - newPoint[2], point[3] - newPoint[3]]
      styles = {
        x: this.config.styles.x + e.deltaX + dx,
        y: this.config.styles.y + e.deltaY + dy
      }
      controlUtils.updateShapeLinePoint(this.layerInfo.pageIndex, this.layerInfo.layerIndex, point)
    }

    if (this.layerInfo.pageIndex !== -1 && this.layerInfo.layerIndex !== -1) {
      layerUtils.updateLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, styles)
    }
  }

  end(e: AnyTouchEvent) {
    if (store.getters.getControlState.id === this.id) {
      store.commit('SET_STATE', { controlState: { type: '' } })
    }
    this.init = null
    const nativeEvt = e.nativeEvent as TouchEvent
    const isHasOnePtrEvt = pointerEvtUtils.pointers.length === nativeEvt.touches.length && nativeEvt.touches.length === 1
    const isLayerExist = layerUtils.getLayer(this.layerInfo.pageIndex, this.layerInfo.layerIndex).id === this.config.id
    console.log('pinch end', pointerEvtUtils.pointers, pointerEvtUtils.pointerIds, nativeEvt.touches.length)
    if (isHasOnePtrEvt && isLayerExist) {
      this.movingUtils.moveStart(nativeEvt, pointerEvtUtils.pointerIds[0] ?? 0)
    }
  }
}
