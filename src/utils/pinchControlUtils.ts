import { IImage, ILayer } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import pointerEvtUtils from '@/utils/pointerEvtUtils'
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
      }
    }
    const newScale = e.scale * this.init.scale
    const newSize = {
      width: this.init.size.width * e.scale,
      height: this.init.size.height * e.scale
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
    const styles = {
      scale: newScale,
      width: newSize.width,
      height: newSize.height,
      rotate: e.angle + this.init.rotate,
      x: this.init.layerPos.x + totalTranslate.x,
      y: this.init.layerPos.y + totalTranslate.y
    } as { [key: string]: number }
    if (this.config.type === 'image' && this.init.img) {
      styles.imgWidth = this.init.img.imgWidth * e.scale
      styles.imgHeight = this.init.img.imgHeight * e.scale
      styles.imgX = this.init.img.imgX * e.scale
      styles.imgY = this.init.img.imgY * e.scale
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
