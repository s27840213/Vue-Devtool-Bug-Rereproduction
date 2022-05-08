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

  removePointerEvent(type: EventType, callback: any) {
    if (window.PointerEvent) {
      window.removeEventListener(type, callback)
    } else {
      const targetEvent = generalUtils.isMobile() ? mobileHash[type] : computerHash[type]

      window.removeEventListener(targetEvent, callback)
    }
  }
}

const eventUtils = new EventUtils()
export default eventUtils
