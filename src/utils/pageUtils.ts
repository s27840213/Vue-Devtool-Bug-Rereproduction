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
    if (container === undefined) {
      return -1
    }
    const centerLinePos = (container.getBoundingClientRect().bottom - container.getBoundingClientRect().top) / 2

    let targetIndex = -1
    let minDistance = Number.MAX_SAFE_INTEGER

    pages.forEach((page: { top: number, bottom: number }, index: number) => {
      const dist = Math.min(Math.abs(centerLinePos - page.top), Math.abs(centerLinePos - page.bottom))
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

  startBackgroundImageControl(pageIndex: number): void {
    store.commit('SET_backgroundImageControl', {
      pageIndex: pageIndex,
      imgControl: true
    })
  }

  setBackgroundImageControlDefault(): void {
    store.commit('SET_allBackgroundImageControl', false)
  }

  updateBackgroundImagePos(pageIndex: number, imgX: number, imgY: number): void {
    store.commit('SET_backgroundImagePos', {
      pageIndex: pageIndex,
      imagePos: {
        x: imgX,
        y: imgY
      }
    })
  }

  updateBackgroundImageSize(pageIndex: number, width: number, height: number): void {
    store.commit('SET_backgroundImageSize', {
      pageIndex: pageIndex,
      imageSize: {
        width: width,
        height: height
      }
    })
  }
}

const pageUtils = new PageUtils()

export default pageUtils
