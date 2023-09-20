import { ILayer } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import layerUtils from '@/utils/layerUtils'
import { MovingUtils } from '@/utils/movingUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { AnyTouchEvent } from 'any-touch'

export default class PinchControlUtils {
  private init = null as null | {
    pos: { x: number, y: number },
    layerPos: { x: number, y: number }
    scale: number,
    size: ISize,
    rotate: number
  }

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
    if (this.init === null) {
      this.movingUtils.removeListener()
      store.commit('SET_isPinchLayer', true)
      if (store.getters['vivisticker/getControllerHidden']) {
        vivistickerUtils.showController()
      }
      this.init = {
        pos: { x: e.x, y: e.y },
        layerPos: { x: this.config.styles.x, y: this.config.styles.y },
        size: { width: this.config.styles.width, height: this.config.styles.height },
        scale: this.config.styles.scale,
        rotate: this.config.styles.rotate
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
    if (this.layerInfo.pageIndex !== -1 && this.layerInfo.layerIndex !== -1) {
      layerUtils.updateLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, {
        scale: newScale,
        width: newSize.width,
        height: newSize.height,
        rotate: e.angle + this.init.rotate,
        x: this.init.layerPos.x + totalTranslate.x,
        y: this.init.layerPos.y + totalTranslate.y
      })
    }
  }

  end(e: AnyTouchEvent) {
    store.commit('SET_isPinchLayer', false)
    this.init = null
    const nativeEvt = e.nativeEvent as TouchEvent
    if (nativeEvt.touches.length === 1) {
      this.movingUtils.moveStart(nativeEvt)
    }
  }
}
