
import store from '@/store'

class FocusUtils {
  focusElement(el: string, scrollTo: boolean) {
    const target = document.querySelector(el) as HTMLElement
    target.focus({ preventScroll: scrollTo })
  }
}

const focusUtils = new FocusUtils()

export default focusUtils
