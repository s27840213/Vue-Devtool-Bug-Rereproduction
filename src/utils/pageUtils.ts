import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IBgRemoveInfo } from '@/interfaces/image'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import Vue from 'vue'
import designUtils from './designUtils'
import editorUtils from './editorUtils'
import FocusUtils from './focusUtils'
import generalUtils from './generalUtils'
import layerFactary from './layerFactary'
import resizeUtils from './resizeUtils'

class PageUtils {
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get inBgRemoveMode(): boolean { return store.getters['bgRemove/getInBgRemoveMode'] }
  get autoRemoveResult(): IBgRemoveInfo { return store.getters['bgRemove/getAutoRemoveResult'] }
  get getPage(): (pageIndex: number) => IPage { return store.getters.getPage }
  get getPages(): Array<IPage> { return store.getters.getPages }
  get pageNum(): number { return this.getPages.length }
  get getPageSize(): (pageIndex: number) => { width: number, height: number } { return store.getters.getPageSize }
  get pagesName(): string { return store.getters.getPagesName }
  get scaleRatio() { return store.getters.getPageScaleRatio }
  get currFocusPageSize() { return store.getters.getPageSize(this.currFocusPageIndex) }
  get isLastPage(): boolean {
    return this.pageNum - 1 === this.currFocusPageIndex
  }

  get middlemostPageIndex(): number {
    return store.getters.getMiddlemostPageIndex
  }

  /**
   * @param currCardIndex - only used in touch device
   */
  get currCardIndex(): number {
    return store.getters['mobileEditor/getCurrCardIndex']
  }

  get currActivePageIndex(): number {
    return store.getters.getCurrActivePageIndex
  }

  get currFocusPageIndex() {
    return store.getters.getCurrFocusPageIndex
  }

  get currFocusPage(): IPage {
    return this.getPage(this.currFocusPageIndex)
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
  mobileMinScaleRatio: number

  constructor() {
    this.topBound = -1
    this.bottomBound = Number.MAX_SAFE_INTEGER
    this.mobileMinScaleRatio = 0
  }

  newPage(pageData: Partial<IPage>) {
    // @TODO The temporarily fetched json has some issue
    // the scale of background will be null
    pageData.backgroundImage && (pageData.backgroundImage.config.styles.scale = 1)

    const defaultPage = {
      width: 1080,
      height: 1080,
      backgroundColor: '#ffffff',
      backgroundImage: {
        config: layerFactary.newImage({
          srcObj: {
            type: '',
            userId: '',
            assetId: ''
          },
          styles: {
            width: 0,
            height: 0,
            scale: 1,
            zindex: -1,
            opacity: 100
          }
        }),
        posX: -1,
        posY: -1
      },
      name: '',
      layers: [
      ],
      documentColors: [],
      designId: '',
      id: generalUtils.generateRandomString(8),
      guidelines: {
        v: [],
        h: []
      },
      isAutoResizeNeeded: false
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
    designUtils.renameDesign(name)
  }

  resizePage(format: { width: number, height: number }) {
    resizeUtils.resizePage(pageUtils.currFocusPageIndex, this.getPage(pageUtils.currFocusPageIndex), format)
    this.updatePageProps({
      pageIndex: pageUtils.currFocusPageIndex,
      props: {
        width: format.width,
        height: format.height
      }
    })
  }

  getPageIndexById(id: string): number {
    return this.getPages.findIndex((page: IPage) => {
      return page.id === id
    })
  }

  activeMiddlemostPage(): number {
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
    FocusUtils.focusElement(`.nu-page-${this.middlemostPageIndex}`, true)
    return this.middlemostPageIndex
  }

  activeCurrActivePage(): void {
    FocusUtils.focusElement(`.nu-page-${this.currFocusPageIndex}`, true)
  }

  scrollIntoPage(pageIndex: number, behavior?: 'auto' | 'smooth'): void {
    const currentPage = document.getElementsByClassName('nu-page')[pageIndex] as HTMLElement
    currentPage.scrollIntoView({
      behavior: behavior ?? 'smooth',
      block: 'center',
      inline: 'center'
    })
    this.findCentralPageIndexInfo()
  }

  jumpIntoPage(pageIndex: number): void {
    const currentPage = document.getElementsByClassName('nu-page')[pageIndex] as HTMLElement
    currentPage.scrollIntoView({
      block: 'center',
      inline: 'center'
    })
    this.findCentralPageIndexInfo()
  }

  clearPagesInfo() {
    store.commit('CLEAR_pagesInfo')
  }

  updateSpecPage(index: number, json: Partial<IPage>): void {
    const pages = store.getters.getPages
    const pagesTmp = generalUtils.deepCopy(pages)
    if (pagesTmp[index]) {
      // keep original page name
      const oriPageName = pagesTmp[index].name
      json.name = oriPageName
      pagesTmp[index] = json
      if (generalUtils.isTouchDevice()) this.fitPage(false, pagesTmp[0])
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

  updateBackgroundImageStyles(pageIndex: number, styles: Partial<IImageStyle>): void {
    store.commit('SET_backgroundImageStyles', {
      pageIndex: pageIndex,
      styles
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
    let currentPagesTmp = generalUtils.deepCopy(currentPages)
    if (typeof index === 'number') {
      currentPagesTmp = currentPagesTmp.slice(0, index)
        .concat(newPages)
        .concat(currentPagesTmp.slice(replace ? index + 1 : index))
    } else {
      currentPagesTmp = currentPagesTmp.concat(newPages)
    }
    if (generalUtils.isTouchDevice()) this.fitPage(false, newPages[0])
    store.commit('SET_pages', currentPagesTmp)
  }

  findCentralPageIndexInfo(preventFocus = false) {
    // for mobile version
    if (generalUtils.isTouchDevice()) {
      store.commit('SET_middlemostPageIndex', this.currCardIndex)
      return this.currCardIndex
    }

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
    const targetIndex = this.searchMiddlemostPageIndex(pages, centerLinePos, minDistance, -1)
    store.commit('SET_middlemostPageIndex', targetIndex)
    if (!preventFocus) this.activeMiddlemostPage()
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
    return generalUtils.isTouchDevice() ? (pageIndex <= this.currCardIndex - 2 || pageIndex >= this.currCardIndex + 2)
      : pageIndex <= this.topBound || pageIndex >= this.bottomBound
  }

  // Algorithm: Binary Search
  searchMiddlemostPageIndex(posArr: Array<{ top: number, bottom: number }>, centerLinePos: number, minDist: number, minIndex: number): number {
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
      return this.searchMiddlemostPageIndex(posArr.slice(0, middleIndex), centerLinePos, minDist, middleIndex)
    } else {
      return middleIndex + this.searchMiddlemostPageIndex(posArr.slice(middleIndex, posArr.length), centerLinePos, minDist, middleIndex)
    }
  }

  setScaleRatio(val: number) {
    store.commit('SET_pageScaleRatio', val)
  }

  fitPage(scrollToTop = false, targetSize = null) {
    if (editorUtils.mobileAllPageMode) {
      return
    }

    const { width: targetWidth, height: targetHeight } =
      targetSize ||
      (this.inBgRemoveMode ? this.autoRemoveResult
        : this.currFocusPageSize)
    const editorViewBox = document.getElementsByClassName('editor-view')[0]
    const resizeRatio = Math.min(editorViewBox.clientWidth / (targetWidth * (this.scaleRatio / 100)), editorViewBox.clientHeight / (targetHeight * (this.scaleRatio / 100))) * 0.8

    if ((store.state as any).user.userId === 'backendRendering' || Number.isNaN(resizeRatio)) {
      store.commit('SET_pageScaleRatio', 100)
    } else {
      store.commit('SET_pageScaleRatio', Math.round(this.scaleRatio * resizeRatio))
    }
    if (!this.inBgRemoveMode) {
      this.findCentralPageIndexInfo()
    }
    if (scrollToTop) {
      Vue.nextTick(() => {
        editorViewBox.scrollTo((editorViewBox.scrollWidth - editorViewBox.clientWidth) / 2, 0)
      })
    }
    pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
  }

  fillPage() {
    const editorViewBox = document.getElementsByClassName('editor-view')[0]
    const targetWidth = this.inBgRemoveMode ? this.autoRemoveResult.width : this.getPage(this.middlemostPageIndex).width
    const resizeRatio = editorViewBox.clientWidth / (targetWidth * (this.scaleRatio / 100)) * 0.9

    editorViewBox.scrollTo((editorViewBox.scrollWidth - editorViewBox.clientWidth) / 2, 0)
    if ((store.state as any).user.userId === 'backendRendering') {
      store.commit('SET_pageScaleRatio', 100)
    } else {
      store.commit('SET_pageScaleRatio', Math.round(this.scaleRatio * resizeRatio))
    }
    if (!this.inBgRemoveMode) {
      this.findCentralPageIndexInfo()
    }
  }

  isAllPageSizeEqual() {
    return new Set(this.getPages.map((page: IPage) => {
      return page.width
    })).size === 1
  }

  filterBrokenImageLayer(pages: Array<IPage>) {
    const tmpPages = generalUtils.deepCopy(pages)
    return tmpPages.map((page: IPage) => {
      page.layers = page.layers.filter((layer) => {
        if (layer.type !== 'image') {
          return true
        } else {
          layer = layer as IImage
          return layer.previewSrc
        }
      })
      return page
    })
  }

  getPageWidth(excludes: number[] = []) {
    // return width and height of first page
    const pages = this.getPages
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      if (!excludes.includes(pageIndex)) {
        const { width, height } = pages[pageIndex]
        return { width, height }
      }
    }
    return {}
  }

  hasDesignId(pageIndex: number) {
    return this.getPage(pageIndex).designId !== ''
  }

  setAutoResizeNeededForPages(pages: IPage[], isAutoResizeNeeded: boolean) {
    for (const page of pages) {
      this.setAutoResizeNeededForPage(page, isAutoResizeNeeded)
    }
  }

  setAutoResizeNeededForPage(page: IPage, isAutoResizeNeeded: boolean) {
    page.isAutoResizeNeeded = isAutoResizeNeeded
  }
}

const pageUtils = new PageUtils()

export default pageUtils
