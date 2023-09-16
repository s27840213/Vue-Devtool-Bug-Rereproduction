import { ILayer } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import layerUtils from '@/utils/layerUtils'
import { AnyTouchEvent } from 'any-touch'

export default class PinchControlUtils {
  private init = null as null | {
    pos: { x: number, y: number },
    layerPos: { x: number, y: number }
    scale: number,
    size: ISize
  }

  private layerInfo: ILayerInfo
  private config: ILayer

  constructor(data: { layerInfo: ILayerInfo, config: ILayer }) {
    const { layerInfo, config } = data
    this.config = config
    this.layerInfo = layerInfo
    this.pinch = this.pinch.bind(this)
  }

  pinch(e: AnyTouchEvent) {
    switch (e.phase) {
      case 'move':
        return this.move(e)
      case 'end':
        return this.end(e)
    }
  }

  move(e: AnyTouchEvent) {
    if (this.init === null) {
      store.commit('SET_isPinchLayer', true)
      this.init = {
        pos: { x: e.x, y: e.y },
        layerPos: { x: this.config.styles.x, y: this.config.styles.y },
        size: { width: this.config.styles.width, height: this.config.styles.height },
        scale: this.config.styles.scale
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
    layerUtils.updateLayerStyles(this.layerInfo.pageIndex, this.layerInfo.layerIndex, {
      scale: newScale,
      width: newSize.width,
      height: newSize.height,
      x: this.init.layerPos.x + totalTranslate.x,
      y: this.init.layerPos.y + totalTranslate.y
    })
    console.log('moving', e.scale, this.init.layerPos.x + totalTranslate.x, this.init.layerPos.y + totalTranslate.y)
    console.log(this.init.layerPos.x, this.init.layerPos.y)
  }

  end(e: AnyTouchEvent) {
    store.commit('SET_isPinchLayer', false)
    console.log('move end')
    this.init = null
  }
}
