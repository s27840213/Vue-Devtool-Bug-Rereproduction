import store from '@/store'
import FocusUtils from './focusUtils'
import GeneralUtils from './generalUtils'

class PageUtils {
  activeMostCentralPage(): number {
    const pages = [...document.getElementsByClassName('nu-page')].map((page) => {
      return {
        top: (page as HTMLElement).getBoundingClientRect().top,
        bottom: (page as HTMLElement).getBoundingClientRect().bottom
      }
    })
    const container = document.getElementsByClassName('content__editor')[0] as HTMLElement
    const centerLinePos = (container.getBoundingClientRect().bottom - container.getBoundingClientRect().top) / 2

    let targetIndex = -1
    let minDistance = Number.MAX_SAFE_INTEGER

    pages.forEach((page: { top: number, bottom: number }, index: number) => {
      const dist = Math.min(Math.abs(centerLinePos - page.top), Math.abs(centerLinePos - page.bottom))
      console.log(`dist: ${dist} ${index}`)
      console.log(minDistance > dist)
      if (minDistance > dist) {
        targetIndex = index
        minDistance = dist
      }
    })

    FocusUtils.focusElement(`.nu-page-${targetIndex}`, true)
    store.commit('SET_lastSelectedPageIndex', targetIndex)
    return targetIndex
  }

  activeCurrActivePage(): void {
    const currActivePageIndex = store.getters.getCurrActivePageIndex
    FocusUtils.focusElement(`.nu-page-${currActivePageIndex}`, true)
  }

  updateSpecPage(index: number, json: any): void {
    const pages = store.getters.getPages
    const pagesTmp = GeneralUtils.deepCopy(pages)
    if (pagesTmp[index]) {
      pagesTmp[index] = json
      store.commit('SET_pages', pagesTmp)
    }
  }
}

const pageUtils = new PageUtils()

export default pageUtils
