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

class EventUtils {
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
}

const eventUtils = new EventUtils()
export default eventUtils
