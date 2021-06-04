
import store from '@/store'

class FocusUtils {
  focusLastSelectedPage() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const targetPage = document.querySelector(`.nu-page-${lastSelectedPageIndex}`) as HTMLElement
    targetPage.focus()
  }

  focusElment(el: string) {
    const target = document.querySelector(el) as HTMLElement
    target.focus()
  }
}

const focusUtils = new FocusUtils()

export default focusUtils
