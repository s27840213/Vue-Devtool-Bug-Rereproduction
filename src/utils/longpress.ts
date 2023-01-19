import store from '@/store'
import { VNode, DirectiveBinding } from 'vue'

let pressTimer = -1

const start = (callback: (e: PointerEvent) => void) => {
  return (e: PointerEvent) => {
    if (pressTimer === -1) {
      pressTimer = setTimeout((e: PointerEvent) => {
        const isImgControl = store.getters['imgControl/isImgCtrl']
        if (!isImgControl) {
          callback(e)
        }
        pressTimer = -1
      }, 800)
    }
  }
}

const cancel = (e: PointerEvent) => {
  if (e.type === 'pointermove' && e.movementX === 0 && e.movementY === 0) {
    return
  }
  if (pressTimer !== -1) {
    clearTimeout(pressTimer)
    pressTimer = -1
  }
}

const preventDefault = (e: MouseEvent) => {
  e.preventDefault()
}

const longpress = {
  mounted: function (el: HTMLElement, binding: DirectiveBinding, vNode: VNode) {
    if (typeof binding.value !== 'function') {
      return
    }

    const handler = (e: PointerEvent) => {
      binding.value(e)
    }
    const startEvent = start(handler)

    el.addEventListener('pointerdown', startEvent)
    el.addEventListener('contextmenu', preventDefault)
    el.addEventListener('pointerout', cancel)
    // el.addEventListener('pointermove', cancel)
    el.addEventListener('pointerup', cancel)
    el.addEventListener('pointercancel', cancel)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    (el as any).$value = binding.value
  },
  unmounted(el: HTMLElement) {
    clearTimeout(pressTimer)
    el.removeEventListener('pointerdown', (el as any).handler)
    el.removeEventListener('contextmenu', preventDefault)
    el.removeEventListener('pointerout', cancel)
    // el.removeEventListener('pointermove', cancel)
    el.removeEventListener('pointerup', cancel)
    el.removeEventListener('pointercancel', cancel)
  }
}

export default longpress
