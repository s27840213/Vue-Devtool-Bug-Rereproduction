import { ILayer } from '@/interfaces/layer'
import store from '@/store'
import { ILayerInfo } from '@/store/types'
import { AnyTouchEvent } from 'any-touch'

export default class PinchControlUtils {
  private init = null as null | {
    pos: { x: number, y: number },
    layerPos: { x: number, y: number }
    scale: number
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
        scale: this.config.styles.scale
      }
    }
    console.log('moving', e)
  }

  end(e: AnyTouchEvent) {
    store.commit('SET_isPinchLayer', false)
    console.log('move end')
    this.init = null
  }
}
