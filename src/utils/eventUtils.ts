import { EventEmitter } from 'events'
import generalUtils from './generalUtils'

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
  showPhotoShadow = 'showPhotoShadow',
  switchTab = 'switchTab',
  scrollPanelObjectToTop = 'scrollPanelObjectToTop',
  scrollPanelTextToTop = 'scrollPanelTextToTop',
  scrollPanelBackgroundToTop = 'scrollPanelBackgroundToTop',
  scrollPanelTemplateToTop = 'scrollPanelTemplateToTop',
}

export enum ImageEvent {
  redrawCanvasShadow = 'redrawCanvasShadow'
}

class EventUtils {
  checkIsMultiTouch(event: MouseEvent | TouchEvent | PointerEvent) {
    switch (eventUtils.getEventType(event)) {
      case 'pointer': {
        if (!(event as PointerEvent).isPrimary) {
          return true
        }
        break
      }
      case 'touch': {
        if ((event as TouchEvent).touches.length > 1) {
          return true
        }
        break
      }
    }

    return false
  }

  getEventType(event: MouseEvent | TouchEvent | PointerEvent): 'pointer' | 'touch' | 'mouse' {
    return event.type.includes('pointer') ? 'pointer' : event.type.includes('touch') ? 'touch' : 'mouse'
  }

  addPointerEvent(type: 'pointerdown' | 'pointerup' | 'pointermove', callback: any) {
    if (window.PointerEvent) {
      window.addEventListener(type, callback)
    } else {
      const targetEvent = generalUtils.isTouchDevice() ? mobileHash[type] : computerHash[type]

      window.addEventListener(targetEvent, callback)
    }
  }

  removePointerEvent(type: 'pointerdown' | 'pointerup' | 'pointermove', callback: any) {
    if (window.PointerEvent) {
      window.removeEventListener(type, callback)
    } else {
      const targetEvent = generalUtils.isTouchDevice() ? mobileHash[type] : computerHash[type]

      window.removeEventListener(targetEvent, callback)
    }
  }

  private event: any
  private eventHash: { [index: string]: (event: string) => void }
  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
  }

  on(type: string, callback: (...args: Array<any>) => void) {
    this.off(type)
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  emit(type: string, ...param: Array<any>) {
    if (this.eventHash[type]) {
      this.event.emit(type, ...param)
    }
  }

  off(type: string) {
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
  }
}

const eventUtils = new EventUtils()
export default eventUtils
