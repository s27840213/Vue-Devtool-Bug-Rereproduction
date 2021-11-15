import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import router from '@/router'
import store from '@/store'
import FocusUtils from './focusUtils'
import GeneralUtils from './generalUtils'
import uploadUtils from './uploadUtils'

class PageUtils {
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get getPage() { return store.getters.getPage }
  get getPages(): Array<IPage> { return store.getters.getPages }
  get lastSelectedPageIndex(): number {
    return store.getters.getLastSelectedPageIndex
  }

  get currActivePageIndex(): number {
    return store.getters.getCurrActivePageIndex
  }

  get currFocusPageIndex() {
    const { pageIndex } = this.currSelectedInfo
    return pageIndex > 0 ? pageIndex : this.currActivePageIndex > 0 ? this.currActivePageIndex : this.lastSelectedPageIndex
  }

  get currFocusPage(): IPage {
    const targetIndex = this.currActivePageIndex > 0 ? this.currActivePageIndex : this.lastSelectedPageIndex
    return this.getPage(targetIndex)
  }

  get pageRect(): { [index: string]: number } {
    const { left, top, bottom, right } = document.getElementsByClassName(`nu-page-${this.currFocusPageIndex}`)[0].getBoundingClientRect()
    return {
      left,
      top,
      bottom,
      right
    }
  }

  newPage(pageData: Partial<IPage>) {
    console.log(pageData)
    const defaultPage = {
      width: 1080,
      height: 1080,
      backgroundColor: '#ffffff',
      backgroundImage: {
        config: {
          type: 'image',
          src: 'none',
          clipPath: '',
          active: false,
          shown: false,
          locked: false,
          moved: false,
          imgControl: false,
          isClipper: false,
          dragging: false,
          designId: '',
          styles: {
            x: 0,
            y: 0,
            scale: 1,
            scaleX: 0,
            scaleY: 0,
            rotate: 0,
            width: 0,
            height: 0,
            initWidth: 0,
            initHeight: 0,
            imgX: 0,
            imgY: 0,
            imgWidth: 0,
            imgHeight: 0,
            zindex: -1,
            opacity: 100
          }
        },
        posX: -1,
        posY: -1
      },
      name: '',
      layers: [
      ],
      documentColors: [],
      designId: '',
      guidelines: {
        v: [],
        h: []
      }
    }
    return Object.assign(defaultPage, pageData)
  }

  newPages(pages: Array<IPage>) {
    return pages.map((page: IPage) => {
      return this.newPage(page)
    })
  }

  addPageToPos(newPage: IPage, pos: number) {
    store.commit('ADD_pageToPos', {
      newPage,
      pos
    })
  }

  setPages(pages = [this.newPage({})]) {
    store.commit('SET_pages', pages)
  }

  activeMostCentralPage(): number {
    const pages = [...document.getElementsByClassName('nu-page')].map((page) => {
      const rect = (page as HTMLElement).getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom
      }
    })
    const container = document.getElementsByClassName('content__editor')[0] as HTMLElement
    if (container === undefined) {
      return -1
    }
    const containerRect = container.getBoundingClientRect()
    const centerLinePos = (containerRect.bottom - containerRect.top) / 2

    let targetIndex = -1
    let minDistance = Number.MAX_SAFE_INTEGER

    pages.some((page: { top: number, bottom: number }, index: number) => {
      if (page.top < centerLinePos && page.bottom > centerLinePos) {
        targetIndex = index
        return true
      } else {
        const dist = Math.min(Math.abs(centerLinePos - page.top), Math.abs(centerLinePos - page.bottom))
        if (minDistance > dist) {
          targetIndex = index
          minDistance = dist
        }
      }
    })
    FocusUtils.focusElement(`.nu-page-${targetIndex}`, true)
    store.commit('SET_lastSelectedPageIndex', targetIndex)
    return targetIndex
  }

  activeCurrActivePage(): void {
    FocusUtils.focusElement(`.nu-page-${this.currFocusPageIndex}`, true)
  }

  scrollIntoPage(pageIndex: number): void {
    const currentPage = document.getElementsByClassName('nu-page')[pageIndex] as HTMLElement
    currentPage.scrollIntoView({
      behavior: 'smooth'
    })
  }

  clearPagesInfo() {
    store.commit('CLEAR_pagesInfo')
  }

  updateSpecPage(index: number, json: any): void {
    const pages = store.getters.getPages
    const pagesTmp = GeneralUtils.deepCopy(pages)
    if (pagesTmp[index]) {
      // keep original page name
      const oriPageName = pagesTmp[index].name
      json.name = oriPageName
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

  updateBackgroundImageMode(pageIndex: number, mode: boolean): void {
    store.commit('SET_backgroundImageMode', {
      pageIndex: pageIndex,
      newDisplayMode: mode
    })
  }

  updatePageProps(props: { [index: string]: unknown }): void {
    store.commit('UPDATE_pageProps', {
      pageIndex: this.currFocusPageIndex,
      props
    })
  }

  appendPagesTo(pages: IPage[], index?: number) {
    const currentPages = store.getters.getPages as IPage[]
    let currentPagesTmp = GeneralUtils.deepCopy(currentPages)
    if (typeof index === 'number') {
      currentPagesTmp = currentPagesTmp.slice(0, index)
        .concat(pages)
        .concat(currentPagesTmp.slice(index))
    } else {
      currentPagesTmp = currentPagesTmp.concat(pages)
    }
    store.commit('SET_pages', currentPagesTmp)
  }
}

const pageUtils = new PageUtils()

export default pageUtils
