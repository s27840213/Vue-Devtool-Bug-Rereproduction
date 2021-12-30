
import store from '@/store'

class FocusUtils {
  focusLastSelectedPage() {
    const middlemostPageIndex = store.getters.getMiddlemostPageIndex
    const targetPage = document.querySelector(`.nu-page-${middlemostPageIndex}`) as HTMLElement
    targetPage.focus()
  }

  focusElement(el: string, scrollTo: boolean) {
    const target = document.querySelector(el) as HTMLElement
    target.focus({ preventScroll: scrollTo })
  }
}

const focusUtils = new FocusUtils()

export default focusUtils
