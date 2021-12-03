import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import FocusUtils from './focusUtils'
import GeneralUtils from './generalUtils'
import layerFactary from './layerFactary'
import uploadUtils from './uploadUtils'

class PageUtils {
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get getPage() { return store.getters.getPage }
  get getPages(): Array<IPage> { return store.getters.getPages }
  get getPageSize() { return store.getters.getPageSize }
  get pagesName(): string { return store.getters.getPagesName }
  get scaleRatio() { return store.getters.getPageScaleRatio }
  get currFocusPageSize() { return store.getters.getPageSize(this.currFocusPageIndex) }
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

  topBound: number
  bottomBound: number

  constructor() {
    this.topBound = -1
    this.bottomBound = Number.MAX_SAFE_INTEGER
  }

  newPage(pageData: Partial<IPage>) {
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
    return Object.assign(defaultPage, layerFactary.newTemplate(pageData))
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

  setPagesName(name: string) {
    store.commit('SET_pagesName', name)
    uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_DB)
  }

  activeMostCentralPage(): number {
    // pages.some((page: { top: number, bottom: number }, index: number) => {
    //   if (page.top < centerLinePos && page.bottom > centerLinePos) {
    //     targetIndex = index
    //     return true
    //   } else {
    //     const dist = Math.min(Math.abs(centerLinePos - page.top), Math.abs(centerLinePos - page.bottom))
    //     if (minDistance > dist) {
    //       targetIndex = index
    //       minDistance = dist
    //     }
    //   }
    // })
    FocusUtils.focusElement(`.nu-page-${this.lastSelectedPageIndex}`, true)
    return this.lastSelectedPageIndex
  }

  activeCurrActivePage(): void {
    FocusUtils.focusElement(`.nu-page-${this.currFocusPageIndex}`, true)
  }

  scrollIntoPage(pageIndex: number): void {
    const currentPage = document.getElementsByClassName('nu-page')[pageIndex] as HTMLElement
    currentPage.scrollIntoView({
      behavior: 'smooth'
    })
    this.findCentralPageIndexInfo()
  }

  jumpIntoPage(pageIndex: number): void {
    const currentPage = document.getElementsByClassName('nu-page')[pageIndex] as HTMLElement
    currentPage.scrollIntoView()
    this.findCentralPageIndexInfo()
  }

  clearPagesInfo() {
    store.commit('CLEAR_pagesInfo')
  }

  updateSpecPage(index: number, json: Partial<IPage>): void {
    const pages = store.getters.getPages
    const pagesTmp = GeneralUtils.deepCopy(pages)
    if (pagesTmp[index]) {
      // keep original page name
      const oriPageName = pagesTmp[index].name
      json.name = oriPageName
      pagesTmp[index] = json
      store.commit('SET_pages', this.newPages(pagesTmp))
    }

    console.log('Update spec page')
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

  appendPagesTo(pages: IPage[], index?: number, replace?: boolean) {
    const currentPages = store.getters.getPages as IPage[]
    const newPages = this.newPages(pages)
    let currentPagesTmp = GeneralUtils.deepCopy(currentPages)
    if (typeof index === 'number') {
      currentPagesTmp = currentPagesTmp.slice(0, index)
        .concat(newPages)
        .concat(currentPagesTmp.slice(replace ? index + 1 : index))
    } else {
      currentPagesTmp = currentPagesTmp.concat(newPages)
    }
    store.commit('SET_pages', currentPagesTmp)
  }

  findCentralPageIndexInfo() {
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

    const minDistance = Number.MAX_SAFE_INTEGER
    const targetIndex = this.searchMostCentralPageIndex(pages, centerLinePos, minDistance, -1)
    store.commit('SET_lastSelectedPageIndex', targetIndex)
    this.activeMostCentralPage()
    this.topBound = this.findBoundary(pages, containerRect, targetIndex - 1, true)
    this.bottomBound = this.findBoundary(pages, containerRect, targetIndex + 1, false)
  }

  findBoundary(posArr: Array<{ top: number, bottom: number }>, containerRect: DOMRect, currIndex: number, toTop: boolean): number {
    if (currIndex < 0 || currIndex >= posArr.length) {
      return currIndex
    }
    if (toTop) {
      if (posArr[currIndex].bottom < containerRect.top) {
        return currIndex
      } else {
        return this.findBoundary(posArr, containerRect, currIndex - 1, toTop)
      }
    } else {
      if (posArr[currIndex].top > containerRect.bottom) {
        return currIndex
      } else {
        return this.findBoundary(posArr, containerRect, currIndex + 1, toTop)
      }
    }
  }

  isOutOfBound(pageIndex: number) {
    return pageIndex <= this.topBound || pageIndex >= this.bottomBound
  }

  // Algorithm: Binary Search
  searchMostCentralPageIndex(posArr: Array<{ top: number, bottom: number }>, centerLinePos: number, minDist: number, minIndex: number): number {
    // get the middle inext of the posArr
    const middleIndex = Math.floor(posArr.length / 2)
    // if centerLinePos is exactly in the posArr, return the index
    if (posArr[middleIndex].top < centerLinePos && posArr[middleIndex].bottom > centerLinePos) {
      return middleIndex
    }

    // if remaining posArr number is equal to one and we still haven't get the target, return the middle index
    if (posArr.length === 1) {
      return middleIndex
    }
    const searchTopDir = posArr[middleIndex].top > centerLinePos
    const dist = Math.min(Math.abs(centerLinePos - posArr[middleIndex].top), Math.abs(centerLinePos - posArr[middleIndex].bottom))
    if (dist < minDist) {
      minDist = dist
    }
    if (searchTopDir) {
      return this.searchMostCentralPageIndex(posArr.slice(0, middleIndex), centerLinePos, minDist, middleIndex)
    } else {
      return middleIndex + this.searchMostCentralPageIndex(posArr.slice(middleIndex, posArr.length), centerLinePos, minDist, middleIndex)
    }
  }

  fitPage() {
    const editorViewBox = document.getElementsByClassName('editor-view')[0]
    const resizeRatio = Math.min(editorViewBox.clientWidth / (this.currFocusPageSize.width * (this.scaleRatio / 100)), editorViewBox.clientHeight / (this.currFocusPageSize.height * (this.scaleRatio / 100))) * 0.8

    editorViewBox.scrollTo((editorViewBox.scrollWidth - editorViewBox.clientWidth) / 2, 0)
    if ((store.state as any).user.userId === 'backendRendering') {
      store.commit('SET_pageScaleRatio', 100)
    } else {
      store.commit('SET_pageScaleRatio', Math.round(this.scaleRatio * resizeRatio))
    }
    this.findCentralPageIndexInfo()
  }
}

const pageUtils = new PageUtils()

export default pageUtils
