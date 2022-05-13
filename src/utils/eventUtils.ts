import { EventEmitter } from 'events'
import generalUtils from './generalUtils'

export enum EventType {
  pointerDown = 'pointerdown',
  pointerMove = 'pointermove',
  pointerUp = 'pointerup'
}

const computerHash = {
  pointerup: 'mouseup',
  pointermove: 'mousemove',
  pointerdown: 'mousedown'
}

const mobileHash = {
  pointerup: 'touchstart',
  pointermove: 'touchmove',
  pointerdown: 'touchend'
}

export enum PanelEvent {
  showPhotoShadow = 'showPhotoShadow'
}

export enum ImageEvent {
  redrawCanvasShadow = 'redrawCanvasShadow'
}
class EventUtils {
  static readonly EventType = EventType
  readonly EventType = EventUtils.EventType
  addPointerEvent(type: EventType, callback: any) {
    if (window.PointerEvent) {
      window.addEventListener(type, callback)
    } else {
      const targetEvent = generalUtils.isMobile() ? mobileHash[type] : computerHash[type]

      window.addEventListener(targetEvent, callback)
    }
  }

  removeointerEvent(type: EventType, callback: any) {
    if (window.PointerEvent) {
      window.removeEventListener(type, callback)
    } else {
      const targetEvent = generalUtils.isMobile() ? mobileHash[type] : computerHash[type]

      window.addEventListener(targetEvent, callback)
    }
  }

  private event: any
  private eventHash: { [index: string]: (event: string) => void }
  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
  }

  on(type: string, callback: (type?: string) => void) {
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  emit(type: string) {
    if (this.eventHash[type]) {
      this.event.emit(type)
    }
  }
}

const eventUtils = new EventUtils()
export default eventUtils
