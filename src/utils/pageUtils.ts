import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IBgRemoveInfo } from '@/interfaces/image'
import { IFrame, IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { IBleed, IPage, IPageState } from '@/interfaces/page'
import store from '@/store'
import Vue from 'vue'
import designUtils from './designUtils'
import editorUtils from './editorUtils'
import FocusUtils from './focusUtils'
import generalUtils from './generalUtils'
import layerFactary from './layerFactary'
import resizeUtils from './resizeUtils'
import { floor, round, throttle } from 'lodash'
import groupUtils from './groupUtils'
import { LayerType } from '@/store/types'
import unitUtils, { PRECISION } from './unitUtils'
import SnapUtils from './snapUtils'
import layerUtils from './layerUtils'

class PageUtils {
  get MAX_AREA() { return 6000 * 6000 }
  get MAX_SIZE() { return 8000 }
  get MIN_SIZE() { return 40 }
  get defaultBleedMap() {
    const toBleed = (val: number) => ({
      top: val,
      bottom: val,
      left: val,
      right: val
    } as IBleed)
    return {
      px: toBleed(11),
      cm: toBleed(0.3),
      mm: toBleed(3),
      in: toBleed(0.118)
    } as {[index: string]: IBleed}
  }

  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get isDetailPage(): boolean { return store.getters.getGroupType === 1 }
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get inBgRemoveMode(): boolean { return store.getters['bgRemove/getInBgRemoveMode'] }
  get autoRemoveResult(): IBgRemoveInfo { return store.getters['bgRemove/getAutoRemoveResult'] }
  get getPage(): (pageIndex: number) => IPage { return store.getters.getPage }
  get getCurrPage(): IPage { return this.getPage(layerUtils.pageIndex) }
  get getPageState(): (pageIndex: number) => IPageState { return store.getters.getPageState }
  get getPages(): Array<IPage> { return store.getters.getPages }
  get pageNum(): number { return this.getPages.length }
  get getPageSize(): (pageIndex: number) => { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } { return store.getters.getPageSize }
  get pagesName(): string { return store.getters.getPagesName }
  get scaleRatio() { return store.getters.getPageScaleRatio }
  get currFocusPageSize() { return store.getters.getPageSize(this.currFocusPageIndex) }
  get currFocusPageSizeWithBleeds() { return this.getPageSizeWithBleeds(this.currFocusPage) }
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

  get currHoveredPageIndex(): number {
    return store.getters.getCurrHoveredPageIndex
  }

  get currFocusPageIndex() {
    return store.getters.getCurrFocusPageIndex
  }

  get _3dEnabledPageIndex() {
    return store.getters.get3dEnabledPageIndex
  }

  get currFocusPage(): IPage {
    return this.getPage(this.currFocusPageIndex)
  }

  get pageRect(): { [index: string]: number } {
    const { left, top, bottom, right } = document.getElementsByClassName(`nu-page-bleed-${this.currFocusPageIndex}`)[0]?.getBoundingClientRect() ?? document.getElementsByClassName(`nu-page-${this.currFocusPageIndex}`)[0].getBoundingClientRect()
    return {
      left,
      top,
      bottom,
      right
    }
  }

  get getEditorRenderSize(): { pageRect: DOMRect, editorRect: DOMRect } {
    const page = document.getElementById(`nu-page_${layerUtils.pageIndex}`) as HTMLElement
    const editor = document.getElementById('mobile-editor__content') as HTMLElement
    return {
      pageRect: page.getBoundingClientRect(),
      editorRect: editor.getBoundingClientRect()
    }
  }

  topBound: number
  bottomBound: number
  mobileMinScaleRatio: number
  isSwitchingToEditor: boolean
  editorSize: { width: number, height: number }
  pageSize: { width: number, height: number }

  constructor() {
    this.topBound = -1
    this.bottomBound = Number.MAX_SAFE_INTEGER
    this.mobileMinScaleRatio = 0
    this.isSwitchingToEditor = false
    this.editorSize = { width: 0, height: 0 }
    this.pageSize = { width: 0, height: 0 }
  }

  newPage(pageData: Partial<IPage>) {
    // @TODO The temporarily fetched json has some issue
    // the scale of background will be null
    pageData.backgroundImage && (pageData.backgroundImage.config.styles.scale = 1)
    if (pageData.layers) {
      pageData.layers.forEach(l => {
        l.id = generalUtils.generateRandomString(8)
        if (l.type === LayerType.frame) {
          (l as IFrame).clips.forEach(c => (c.id = generalUtils.generateRandomString(8)))
        } else if (l.type === LayerType.group) {
          (l as IGroup).layers.forEach(l => (l.id = generalUtils.generateRandomString(8)))
        }
      })
    }

    // set physical size to px size if not exist
    if (pageData.width) pageData.physicalWidth ||= pageData.width
    if (pageData.height) pageData.physicalHeight ||= pageData.height
    pageData.unit ||= 'px'

    const defaultPage: IPage = {
      width: 1080,
      height: 1080,
      x: 0,
      y: 0,
      physicalWidth: 1080,
      physicalHeight: 1080,
      unit: 'px',
      // snapUtils: new SnapUtils(-1),
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
      isEnableBleed: false,
      bleeds: this.getDefaultBleeds('px'),
      physicalBleeds: this.getDefaultBleeds('px'),
      isAutoResizeNeeded: false
    }
    // pageData.snapUtils && delete pageData.snapUtils
    return Object.assign(defaultPage, layerFactary.newTemplate(pageData))
  }

  newPages(pages: Array<IPage>) {
    return pages.map((page: IPage) => {
      return this.newPage(page)
    })
  }

  addPage(newPage: IPage) {
    store.commit('ADD_page', newPage)
  }

  addPages(newPages: Array<IPage>) {
    store.commit('ADD_pages', newPages)
  }

  duplicatePage1(times: number) {
    groupUtils.deselect()
    const page = generalUtils.deepCopy(this.getPage(0)) as IPage

    const arr = new Array(times).fill({}).map(() => {
      return this.newPage(page)
    })

    this.setPages(arr)
  }

  clearAllPagesContent() {
    const arr = new Array(this.pageNum).fill(this.newPage({}))

    this.setPages(arr)
  }

  addTwentyPages() {
    const arr = new Array(20).fill(this.newPage({}))

    this.addPages(arr)
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

  setPageSize(index: number, width: number, height: number, physicalWidth = width, physicalHeight = height, unit = 'px') {
    store.commit('SET_pageSize', { index, width, height, physicalWidth, physicalHeight, unit })

    // update default bleeds with page dpi
    if (!this.getPages[index].isEnableBleed) {
      const inSize = unitUtils.convertSize(physicalWidth, physicalHeight, unit, 'in')
      const dpi = {
        width: width / inSize.width,
        height: height / inSize.height
      }
      const bleeds = pageUtils.getDefaultBleeds('px', dpi)
      store.commit('SET_bleeds', { pageIndex: index, bleeds, physicalBleeds: unit === 'px' ? bleeds : pageUtils.getDefaultBleeds(unit, dpi) })
    }
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
    const targetIndex = generalUtils.isTouchDevice() && this.isDetailPage ? this.currActivePageIndex : this.middlemostPageIndex
    FocusUtils.focusElement(`.nu-page-${targetIndex}`, true)
    return this.middlemostPageIndex
  }

  activeCurrActivePage(): void {
    FocusUtils.focusElement(`.nu-page-${this.currFocusPageIndex}`, true)
  }

  scrollIntoPage(pageIndex: number, behavior?: 'auto' | 'smooth'): void {
    const currentPage = document.getElementsByClassName('nu-page')[pageIndex] as HTMLElement
    if (currentPage !== undefined) {
      currentPage.scrollIntoView({
        behavior: behavior ?? 'smooth',
        block: 'center',
        inline: 'center'
      })
      this.findCentralPageIndexInfo()
    }
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
      store.commit('SET_pageToPos', {
        newPage: this.newPage(json),
        pos: index
      })
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
    store.commit('SET_pages', currentPagesTmp)
  }

  // findCentralPageIndexInfo(preventFocus = false) {
  //   // console.lg
  // }
  findCentralPageIndexInfo = throttle(this.findCentralPageIndexInfoHandler, 100)

  private findCentralPageIndexInfoHandler(preventFocus = false) {
    const showMobilePanel = editorUtils.showMobilePanel || editorUtils.mobileAllPageMode
    const isTouchDevice = generalUtils.isTouchDevice()

    // for mobile version
    if (isTouchDevice) {
      if (!this.isDetailPage) {
        store.commit('SET_middlemostPageIndex', this.currCardIndex)
        return this.currCardIndex
      } else {
        if (showMobilePanel) {
          return this.middlemostPageIndex
        }
      }
    }

    const pages = [...document.getElementsByClassName('nu-page')].map((page) => {
      const rect = (page as HTMLElement).getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom
      }
    })

    const targetContainer = this.isDetailPage && isTouchDevice ? 'mobile-editor__content' : 'content__editor'

    const container = document.getElementsByClassName(targetContainer)[0] as HTMLElement

    if (container === undefined) {
      return -1
    }
    const containerRect = container.getBoundingClientRect()
    const centerLinePos = (containerRect.bottom - containerRect.top) / 2

    const minDistance = Number.MAX_SAFE_INTEGER
    const targetIndex = this.searchMiddlemostPageIndex(pages, centerLinePos, minDistance, -1)
    store.commit('SET_middlemostPageIndex', targetIndex)
    if (isTouchDevice && this.isDetailPage) {
      store.commit('SET_currActivePageIndex', targetIndex)
    }

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
    return generalUtils.isTouchDevice() && !this.isDetailPage ? (pageIndex <= this.currCardIndex - 2 || pageIndex >= this.currCardIndex + 2)
      : pageIndex <= (this.topBound - 4) || pageIndex >= (this.bottomBound + 4)
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

  fitPage(scrollToTop = false, minRatioFiRestricttDisable = false) {
    // In these mode, don't fitPage.

    if (editorUtils.mobileAllPageMode || this.isSwitchingToEditor) {
      return
    }
    // If mobile user zoom in page, don't fitPage.
    if (generalUtils.isTouchDevice() && !minRatioFiRestricttDisable && pageUtils.mobileMinScaleRatio < pageUtils.scaleRatio) {
      return
    }

    // Get size of target(design) and editor.
    // Target size can be pass by param or get according to situation.
    const editorViewBox = document.getElementsByClassName('editor-view')[0]
    const mobilePanelHeight = document.getElementsByClassName('mobile-panel')[0]?.clientHeight ?? 0

    if (!editorViewBox) return
    const { clientWidth: editorWidth, clientHeight: editorHeight } = editorViewBox
    const { width: targetWidth, height: targetHeight }: { width: number, height: number } =
      (this.inBgRemoveMode ? this.autoRemoveResult
        : this.currFocusPageSize)

    // Calculate and do resize
    const resizeRatio = Math.min(
      editorWidth / (targetWidth * (this.scaleRatio / 100)),
      (editorHeight - mobilePanelHeight) / (targetHeight * (this.scaleRatio / 100))
    ) * 0.8
    const newRatio = Math.max(3, Math.round(this.scaleRatio * resizeRatio))

    if ((store.state as any).user.userId === 'backendRendering' || Number.isNaN(resizeRatio)) {
      store.commit('SET_pageScaleRatio', 100)
    } else {
      store.commit('SET_pageScaleRatio', newRatio)
    }

    if (!this.inBgRemoveMode) {
      this.findCentralPageIndexInfo()
    }
    if (scrollToTop) {
      Vue.nextTick(() => {
        editorViewBox.scrollTo((editorViewBox.scrollWidth - editorWidth) / 2, 0)
      })
    }
    if (!this.isDetailPage) {
      pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
    } else {
      this.isSwitchingToEditor = true
      Vue.nextTick(() => {
        setTimeout(() => {
          this.scrollIntoPage(this.currFocusPageIndex, 'auto')
          this.isSwitchingToEditor = false
        }, 0)
      })
    }
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

  setIsEnableBleedForPages(pages: IPage[], isEnableBleed: boolean) {
    for (const page of pages) {
      this.setIsEnableBleedForPage(page, isEnableBleed)
    }
  }

  setIsEnableBleedForPage(page: IPage, isEnableBleed: boolean) {
    page.isEnableBleed = isEnableBleed
  }

  /**
   * Returns DPI of target page based on it's px size and physical size.
   * @param page Target page, use current focused page if undefined
   * @returns DPI of target page if target page is in physical size, otherwise 96 (default DPI)
   */
  getPageDPI(page: IPage = this.currFocusPage): {width: number, height: number} {
    return {
      width: page.width / unitUtils.convert(page.physicalWidth, page.unit, 'in'),
      height: page.height / unitUtils.convert(page.physicalHeight, page.unit, 'in')
    }
  }

  /**
   * returns page size without bleeds and bleed sizes
   * @param page Target page, use current focused page if undefined
   * @returns
   ** width, height, physicalWidth, physicalHeight: page size without bleeds
   ** bleeds, physicalBleeds: page bleed sizes
   ** unit: Unit for physical size and physical bleeds
   */
  getPageSizeWithBleeds(page: IPage): { width: number, height: number, physicalWidth: number, physicalHeight: number, bleeds: IBleed, physicalBleeds: IBleed, unit: string } {
    const noBleed = { top: 0, bottom: 0, left: 0, right: 0 } as IBleed
    const physicalWidth = page.physicalWidth ?? page.width
    const physicalHeight = page.physicalHeight ?? page.height
    const bleeds = page.bleeds ?? this.getDefaultBleeds('px')
    const physicalBleeds = page.physicalBleeds ?? page.bleeds ?? this.getDefaultBleeds(page.unit ?? 'px')
    const isEnableBleed = page.isEnableBleed
    return {
      width: isEnableBleed ? page.width - bleeds.left - bleeds.right : page.width,
      height: isEnableBleed ? page.height - bleeds.top - bleeds.bottom : page.height,
      physicalWidth: isEnableBleed ? physicalWidth - physicalBleeds.left - physicalBleeds.right : physicalWidth,
      physicalHeight: isEnableBleed ? physicalHeight - physicalBleeds.top - physicalBleeds.bottom : physicalHeight,
      bleeds: isEnableBleed ? bleeds : noBleed,
      physicalBleeds: isEnableBleed ? physicalBleeds : noBleed,
      unit: page.unit ?? 'px'
    }
  }

  /**
   * Resize pages oversized to max size
   * @returns Whether any page has been fixed
   */
  fixPageSize(): boolean {
    const pages = this.getPages
    let fixed = false
    if (store.getters.getGroupType === 1) {
      // resize all pages of email marketing design to minimum fixed width
      let minFixedWidth = Number.POSITIVE_INFINITY
      pages.forEach(page => {
        if (page.width * page.height > pageUtils.MAX_AREA) {
          const format = { width: page.width, height: page.height, physicalWidth: page.physicalWidth ?? page.width, physicalHeight: page.physicalHeight ?? page.height, unit: page.unit ?? 'px' }

          // clamp aspect ratio within allowed range
          const aspectRatio = Math.max(Math.min(format.width / format.height, pageUtils.MAX_SIZE / pageUtils.MIN_SIZE), pageUtils.MIN_SIZE / pageUtils.MAX_SIZE)

          format.width = Math.sqrt(pageUtils.MAX_AREA * aspectRatio)
          format.height = Math.floor(format.width / aspectRatio)
          format.width = Math.floor(format.width)

          // clamp fixed width within allowed range
          if (Math.max(format.width, format.height) > pageUtils.MAX_SIZE) {
            format.width = pageUtils.MAX_SIZE
            if (aspectRatio < 1) {
              format.width = Math.floor(format.width * aspectRatio)
            }
          }
          if (Math.min(format.width, format.height) < pageUtils.MIN_SIZE) {
            format.width = pageUtils.MIN_SIZE
            if (aspectRatio < 1) {
              format.width = Math.floor(format.width * aspectRatio)
            }
          }

          minFixedWidth = Math.min(minFixedWidth, format.width)
          fixed = true
        }
      })
      if (fixed) {
        pages.forEach((page, index) => {
          const format = { width: page.width, height: page.height, physicalWidth: page.physicalWidth ?? page.width, physicalHeight: page.physicalHeight ?? page.height, unit: page.unit ?? 'px' }
          const aspectRatio = format.width / format.height
          const precision = format.unit === 'px' ? 0 : PRECISION
          format.width = minFixedWidth
          format.height = Math.max(Math.min(Math.floor(format.width / aspectRatio), pageUtils.MAX_SIZE), pageUtils.MIN_SIZE)

          /**
           * @Note don't use unitUtils.converSize() to get physical size, because DPI calculation for pages in email marketing designs is different.
           */
          format.physicalWidth = floor(format.physicalWidth * format.width / page.width, precision)
          format.physicalHeight = floor(format.physicalHeight * format.height / page.height, precision)
          resizeUtils.resizePage(index, page, format)
        })
      }
    } else {
      pages.forEach((page, index) => {
        if (page.width * page.height > pageUtils.MAX_AREA) {
          const format = { width: page.width, height: page.height, physicalWidth: page.physicalWidth ?? page.width, physicalHeight: page.physicalHeight ?? page.height, unit: page.unit ?? 'px' }
          const precision = format.unit === 'px' ? 0 : PRECISION
          const aspectRatio = format.width / format.height
          format.width = Math.sqrt(pageUtils.MAX_AREA * aspectRatio)
          format.height = Math.floor(format.width / aspectRatio)
          format.width = Math.floor(format.width)
          const cap = this.clampSize(format.width, format.height)
          format.width = cap.width
          format.height = cap.height
          const physicalSize = format.unit === 'px' ? { width: format.width, height: format.height } : unitUtils.convertSize(format.width, format.height, 'px', format.unit)
          format.physicalWidth = floor(physicalSize.width, precision)
          format.physicalHeight = floor(physicalSize.height, precision)
          resizeUtils.resizePage(index, page, format)
          fixed = true
        }
      })
    }
    return fixed
  }

  clampSize(width: number, height: number) {
    // resize oversized edge to limitation while preserves aspect ratio
    const aspectRatio = width / height
    if (Math.max(width, height) > pageUtils.MAX_SIZE) {
      if (aspectRatio > 1) {
        width = pageUtils.MAX_SIZE
        height = Math.ceil(width / aspectRatio)
      } else {
        height = pageUtils.MAX_SIZE
        width = Math.ceil(height * aspectRatio)
      }
    }
    if (Math.min(width, height) < pageUtils.MIN_SIZE) {
      if (aspectRatio > 1) {
        height = pageUtils.MIN_SIZE
        width = Math.floor(height * aspectRatio)
      } else {
        width = pageUtils.MIN_SIZE
        height = Math.floor(width / aspectRatio)
      }
    }

    // adjust aspect ratio to fit limitation if still oversize
    if (Math.max(width, height) > pageUtils.MAX_SIZE) {
      if (aspectRatio > 1) {
        width = pageUtils.MAX_SIZE
      } else {
        height = pageUtils.MAX_SIZE
      }
    }
    return { width, height }
  }

  getDefaultBleeds(unit: string, dpi = { width: 96, height: 96 }) {
    const defaultBleed = 3 // mm
    const precision = unit === 'px' ? 0 : PRECISION
    const res = {
      top: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.height), precision),
      bottom: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.height), precision),
      left: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.width), precision),
      right: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.width), precision)
    } as IBleed
    return res
  }

  updatePagePos(pageIndex: number, pos: { x?: number, y?: number }) {
    const { x, y } = pos
    store.commit('UPDATE_pagePos', {
      pageIndex,
      styles: {
        ...((typeof x !== 'undefined') && { x }),
        ...((typeof y !== 'undefined') && { y })
      }
    })
  }
}

const pageUtils = new PageUtils()

export default pageUtils
