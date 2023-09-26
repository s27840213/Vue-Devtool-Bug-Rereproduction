
class FocusUtils {
  focusElement(el: string, scrollTo: boolean) {
    const target = document.querySelector(el) as HTMLElement
    if (target) {
      target.focus({ preventScroll: scrollTo })
    }
  }
}

const focusUtils = new FocusUtils()

export default focusUtils
