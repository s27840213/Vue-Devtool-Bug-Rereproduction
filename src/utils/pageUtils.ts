import i18n from '@/i18n'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IBgRemoveInfo } from '@/interfaces/image'
import { IFrame, IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { ISize } from '@/interfaces/math'
import { IBleed, IPage, IPageSizeWithBleeds, IPageState } from '@/interfaces/page'
import store from '@/store'
import { LayerType } from '@/store/types'
import { floor, round, throttle } from 'lodash'
import { nextTick } from 'vue'
import designUtils from './designUtils'
import editorUtils from './editorUtils'
import FocusUtils from './focusUtils'
import generalUtils from './generalUtils'
import groupUtils from './groupUtils'
import layerFactary from './layerFactary'
import layerUtils from './layerUtils'
import resizeUtils from './resizeUtils'
import unitUtils, { PRECISION } from './unitUtils'

class PageUtils {
  get MAX_WIDTH() { return 5200 }
  get MAX_HEIGHT() { return 5200 }
  get MAX_AREA() { return this.MAX_WIDTH * this.MAX_HEIGHT }
  get MAX_SIZE() { return 8000 }
  get MIN_SIZE() { return 40 }
  get MAX_BLEED() { return { px: 216, mm: 18.288 } }
  get MOBILE_CARD_PADDING() { return 16 }

  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get isDetailPage(): boolean { return store.getters.getGroupType === 1 }
  get isMobile(): boolean { return store.getters.getUseMobileEditor }
  get isLogin(): boolean { return store.getters['user/isLogin'] }
  get inBgRemoveMode(): boolean { return store.getters['bgRemove/getInBgRemoveMode'] }
  get autoRemoveResult(): IBgRemoveInfo { return store.getters['bgRemove/getAutoRemoveResult'] }
  get getPage(): (pageIndex: number) => IPage { return store.getters.getPage }
  get getCurrPage(): IPage { return this.getPage(layerUtils.pageIndex) }
  get getPageState(): (pageIndex: number) => IPageState { return store.getters.getPageState }
  get getPages(): Array<IPage> { return store.getters.getPages }
  get hasBleed(): boolean { return store.getters.getHasBleed }
  get pageNum(): number { return this.getPages.length }
  get getPageSize(): (pageIndex: number) => { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } { return store.getters.getPageSize }
  get pagesName(): string { return store.getters.getPagesName }
  get scaleRatio() { return store.getters.getPageScaleRatio }
  get currFocusPageSize(): {
    width: number,
    height: number,
    physicalWidth: number,
    physicalHeight: number,
    unit: string
    } { return store.getters.getPageSize(this.currFocusPageIndex) }

  get currFocusPageSizeWithBleeds() { return this.getPageSizeWithBleeds(this.currFocusPage) }
  get defaultBleed() { return i18n.global.locale === 'us' ? 3 : 2 } // mm
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

  get currFocusPageInViewRatio(): number {
    const focusPage = document.getElementsByClassName('nu-page')[this.currFocusPageIndex]
    const rect = focusPage.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const topInView = Math.max(rect.top, 0)
    const bottomInView = Math.min(rect.bottom, windowHeight)
    return (bottomInView - topInView) / rect.height
  }

  get addAssetTargetPageIndex(): number {
    return this.currFocusPageInViewRatio < 0.25 ? this.middlemostPageIndex : this.currFocusPageIndex
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

  get topBound() {
    return store.getters['page/getTopBound']
  }

  get bottomBound() {
    return store.getters['page/getBottomBound']
  }

  get getEditorRenderSize(): { pageRect: DOMRect, editorRect: DOMRect } {
    const page = document.getElementById(`nu-page_${layerUtils.pageIndex}`) as HTMLElement
    const editor = document.getElementById('mobile-editor__content') as HTMLElement
    return {
      pageRect: page.getBoundingClientRect(),
      editorRect: editor.getBoundingClientRect()
    }
  }

  mobileMinScaleRatio: number
  isSwitchingToEditor: boolean
  originPageSize = { width: -1, height: -1 }
  originEditorSize = { width: -1, height: -1 }
  pageEventPosOffset = null as unknown as { x: number, y: number }
  pageCenterPos = { x: 0, y: 0 }
  originPageY = 0

  constructor() {
    this.mobileMinScaleRatio = 0
    this.isSwitchingToEditor = false
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

    pageData.shownSize ||= { width: 1080, height: 1080 }
    // set physical size to px size if not exist
    if (pageData.width) {
      pageData.physicalWidth ||= pageData.width
    }
    if (pageData.height) {
      pageData.physicalHeight ||= pageData.height
    }
    pageData.unit ||= 'px'

    const defaultBleeds = this.getPageDefaultBleeds()
    const defaultPage: IPage = {
      width: 1080,
      height: 1080,
      x: 0,
      y: this.originPageY || 0,
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
      mobilePhysicalSize: {
        originSize: { width: 0, height: 0 },
        initPos: { x: 0, y: 0 }
      },
      shownSize: { width: 1080, height: 1080 },
      isEnableBleed: false,
      bleeds: defaultBleeds,
      physicalBleeds: defaultBleeds,
      contentScaleRatio: 1
    }
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

    // remove top and bottom bleeds for email marketing design
    if (this.isDetailPage) {
      if (pos !== 0) {
        this.setBleeds(pos, { ...newPage.physicalBleeds, top: 0, ...(pos !== this.pageNum - 1 && { bottom: 0 }) })
        this.setBleeds(pos - 1, { ...this.getPage(pos - 1).physicalBleeds, bottom: 0 })
      } else if (this.pageNum > 1) {
        this.setBleeds(pos, { ...newPage.physicalBleeds, top: this.getPage(this.pageNum - 1).physicalBleeds.bottom, bottom: 0 })
        this.setBleeds(1, { ...this.getPage(1).physicalBleeds, top: 0 })
      }
    }
  }

  deletePage(pageIndex: number) {
    const page = this.getPage(pageIndex)
    store.commit('DELETE_page', pageIndex)

    // add top and bottom bleeds for email marketing design
    if (this.isDetailPage) {
      if (this.pageNum === 1) {
        pageUtils.setBleeds(0, {
          ...page.physicalBleeds,
          top: pageIndex === 0 ? page.physicalBleeds.top : this.getPage(0).physicalBleeds.top,
          bottom: pageIndex === 1 ? page.physicalBleeds.bottom : this.getPage(0).physicalBleeds.bottom
        })
      } else if (pageIndex === 0) pageUtils.setBleeds(0, page.physicalBleeds)
      else if (pageIndex === this.pageNum) pageUtils.setBleeds(this.pageNum - 1, page.physicalBleeds)
    }
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
    if (!this.getPage(index).isEnableBleed) this.resetBleeds(index)
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
    if (generalUtils.isTouchDevice()) {
      editorUtils.setShowMobilePanel(false)
    }
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

    store.commit('page/SET_STATE', {
      topBound: this.findBoundary(pages, containerRect, targetIndex - 1, true),
      bottomBound: this.findBoundary(pages, containerRect, targetIndex + 1, false)
    })
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
    if (this.isMobile && !minRatioFiRestricttDisable && pageUtils.mobileMinScaleRatio < pageUtils.scaleRatio) {
      return
    }

    // Get size of target(design) and editor.
    // Target size can be pass by param or get according to situation.
    const editorViewBox = document.getElementsByClassName('editor-view')[0]
    const mobilePanelHeight = document.getElementsByClassName('mobile-panel')[0]?.clientHeight ?? 0
    if (!editorViewBox) return
    let { clientWidth: editorWidth, clientHeight: editorHeight } = editorViewBox
    const { width: targetWidth, height: targetHeight }: { width: number, height: number } =
      (this.inBgRemoveMode ? { width: 1600, height: this.autoRemoveResult.height * (1600 / this.autoRemoveResult.width) }
        : (this.hasBleed ? this.currFocusPageSizeWithBleeds : this.currFocusPageSize))

    const RESIZE_MULTIPLIER = this.isMobile ? 1 : 0.8

    if (this.isMobile) {
      editorWidth -= this.MOBILE_CARD_PADDING * 2
      editorHeight -= this.MOBILE_CARD_PADDING * 2
    }

    // Calculate and do resize
    const resizeRatio = Math.min(
      editorWidth / (targetWidth * (this.scaleRatio / 100)),
      (editorHeight - mobilePanelHeight) / (targetHeight * (this.scaleRatio / 100))
    ) * RESIZE_MULTIPLIER
    const newRatio = Math.max(3, Math.round(this.scaleRatio * resizeRatio))

    if ((store.state as any).user.userId === 'backendRendering' || Number.isNaN(resizeRatio)) {
      store.commit('SET_pageScaleRatio', 100)
    } else {
      // @testing not use scaleRatio in mobile
      if (!generalUtils.isTouchDevice()) {
        store.commit('SET_pageScaleRatio', newRatio)
      } else {
        store.commit('SET_pageScaleRatio', 100)
      }
    }

    if (!this.inBgRemoveMode) {
      this.findCentralPageIndexInfo()
    }
    if (scrollToTop) {
      nextTick(() => {
        editorViewBox.scrollTo((editorViewBox.scrollWidth - editorWidth) / 2, 0)
      })
    }
    if (!this.isDetailPage) {
      pageUtils.mobileMinScaleRatio = pageUtils.scaleRatio
    } else {
      this.isSwitchingToEditor = true
      nextTick(() => {
        setTimeout(() => {
          this.scrollIntoPage(this.currFocusPageIndex, 'auto')
          this.isSwitchingToEditor = false
        }, 0)
      })
    }

    editorUtils.handleContentScaleRatio(this.currFocusPageIndex)
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

  getMinScaleRatio(pageState: IPageState, editorView: Element) {
    // Get size of target(design) and editor.
    // Target size can be pass by param or get according to situation.
    const mobilePanelHeight = editorUtils.showMobilePanel ? 0 : document.getElementsByClassName('mobile-panel')[0]?.clientHeight

    let { clientWidth: editorWidth, clientHeight: editorHeight } = editorView
    const { width: targetWidth, height: targetHeight }: { width: number, height: number } = pageState.config

    const RESIZE_MULTIPLIER = this.isMobile ? 1 : 0.8

    if (this.isMobile) {
      editorWidth -= this.MOBILE_CARD_PADDING * 2
      editorHeight -= this.MOBILE_CARD_PADDING * 2
    }

    // Calculate and do resize
    const resizeRatio = Math.min(
      editorWidth / (targetWidth * (this.scaleRatio / 100)),
      (editorHeight - mobilePanelHeight) / (targetHeight * (this.scaleRatio / 100))
    ) * RESIZE_MULTIPLIER

    const newRatio = Math.max(3, Math.round(this.scaleRatio * resizeRatio))

    return newRatio
    // if ((store.state as any).user.userId === 'backendRendering' || Number.isNaN(resizeRatio)) {
    //   store.commit('SET_pageScaleRatio', 100)
    // } else {
    //   // @testing not use scaleRatio in mobile
    //   if (!generalUtils.isTouchDevice()) {
    //     store.commit('SET_pageScaleRatio', newRatio)
    //   } else {
    //     store.commit('SET_pageScaleRatio', 100)
    //   }
    // }
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

  hasDesignId(pageIndex: number) {
    return this.getPage(pageIndex).designId !== ''
  }

  /**
   * Returns DPI of target page based on it's px size and physical size.
   * @param page Target page, use current focused page if undefined
   * @returns DPI of target page if target page is in physical size, otherwise 96 (default DPI)
   */
  getPageDPI(pageSize: { width: number, height: number, physicalWidth: number, physicalHeight: number, unit: string } = this.currFocusPageSize): { width: number, height: number } {
    return {
      width: pageSize.width / unitUtils.convert(pageSize.physicalWidth, pageSize.unit, 'in'),
      height: pageSize.height / unitUtils.convert(pageSize.physicalHeight, pageSize.unit, 'in')
    }
  }

  /**
   * Returns page size with bleeds and size of bleeds
   * @param pageSize Target page size, use size of current focused page if undefined
   * @returns
   ** width, height, physicalWidth, physicalHeight: page size with bleeds
   ** bleeds, physicalBleeds: size of bleeds
   ** unit: unit of physical size for page and bleeds
   */
  getPageSizeWithBleeds(pageSize: IPageSizeWithBleeds = this.currFocusPage): IPageSizeWithBleeds {
    const noBleed = { top: 0, bottom: 0, left: 0, right: 0 } as IBleed
    const { width, height, physicalWidth, physicalHeight, unit } = pageSize
    let { bleeds, physicalBleeds } = pageSize
    bleeds ??= noBleed
    physicalBleeds ??= bleeds
    return {
      width: width + bleeds.left + bleeds.right,
      height: height + bleeds.top + bleeds.bottom,
      physicalWidth: physicalWidth + physicalBleeds.left + physicalBleeds.right,
      physicalHeight: physicalHeight + physicalBleeds.top + physicalBleeds.bottom,
      bleeds,
      physicalBleeds,
      unit
    }
  }

  /**
   * Returns page size without bleeds and size of bleeds
   * @param pageSize Target page size
   * @returns
   ** width, height, physicalWidth, physicalHeight: page size without bleeds
   ** bleeds, physicalBleeds: size of bleeds
   ** unit: unit of physical size for page and bleeds
   */
  removeBleedsFromPageSize(pageSize: IPageSizeWithBleeds): IPageSizeWithBleeds {
    const { width, height, physicalWidth, physicalHeight, bleeds, physicalBleeds, unit } = pageSize
    if (!(bleeds && physicalBleeds)) return pageSize
    return {
      width: width - bleeds.left - bleeds.right,
      height: height - bleeds.top - bleeds.bottom,
      physicalWidth: physicalWidth - physicalBleeds.left - physicalBleeds.right,
      physicalHeight: physicalHeight - physicalBleeds.top - physicalBleeds.bottom,
      bleeds,
      physicalBleeds,
      unit
    }
  }

  /**
   * Set isEnableBleed for one or all pages
   * @param value New value of isEnableBleed
   * @param pageIndex Index of target page, apply to all pages if unspecified
   */
  setIsEnableBleed(value: boolean, pageIndex?: number) {
    store.commit('SET_isEnableBleed', {
      value,
      pageIndex
    })
  }

  setBleeds(pageIndex: number, physicalBleeds: IBleed, bleeds?: IBleed) {
    const page = this.getPage(pageIndex)
    const dpi = this.getPageDPI(page)
    physicalBleeds = Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, isNaN(v) ? 0 : v])) as IBleed // map NaN to 0
    const newBleeds = bleeds || Object.fromEntries(Object.entries(physicalBleeds).map(([k, v]) => [k, round(unitUtils.convert(v, page.unit, 'px', k === 'left' || k === 'right' ? dpi.width : dpi.height))])) as IBleed // convert bleed to px size
    const newPhysicalBleeds = physicalBleeds
    store.commit('SET_bleeds', { pageIndex, bleeds: newBleeds, physicalBleeds: newPhysicalBleeds })
  }

  resetBleeds(pageIndex: number) {
    const page = this.getPage(pageIndex)
    const defaultBleeds = this.getPageDefaultBleeds(page, 'px')
    const unit = page.unit ?? 'px'
    const pagesLength = store.getters.getPagesLength
    defaultBleeds.top = this.isDetailPage && pageIndex !== 0 ? 0 : defaultBleeds.top
    defaultBleeds.bottom = this.isDetailPage && pageIndex !== pagesLength - 1 ? 0 : defaultBleeds.bottom
    const defaultPhysicalBleeds = unit === 'px' ? defaultBleeds : this.getPageDefaultBleeds(page)
    if (unit !== 'px') {
      defaultPhysicalBleeds.top = this.isDetailPage && pageIndex !== 0 ? 0 : defaultPhysicalBleeds.top
      defaultPhysicalBleeds.bottom = this.isDetailPage && pageIndex !== pagesLength - 1 ? 0 : defaultPhysicalBleeds.bottom
    }
    store.commit('SET_bleeds', { pageIndex, bleeds: defaultBleeds, physicalBleeds: defaultPhysicalBleeds })
  }

  /**
   * Resize pages oversized to max size
   * @returns Whether any page has been fixed
   */
  fixPageSize(): boolean {
    const pages = this.getPages
    let fixed = false
    if (this.isDetailPage) {
      // resize all pages of email marketing design to minimum fixed width
      let minFixedWidth = Number.POSITIVE_INFINITY
      pages.forEach(page => {
        if (page.width * page.height > this.MAX_AREA) {
          const format = { width: page.width, height: page.height, physicalWidth: page.physicalWidth ?? page.width, physicalHeight: page.physicalHeight ?? page.height, unit: page.unit ?? 'px' }

          // clamp aspect ratio within allowed range
          const aspectRatio = Math.max(Math.min(format.width / format.height, this.MAX_SIZE / this.MIN_SIZE), this.MIN_SIZE / this.MAX_SIZE)

          format.width = Math.sqrt(this.MAX_AREA * aspectRatio)
          format.height = Math.floor(format.width / aspectRatio)
          format.width = Math.floor(format.width)

          // clamp fixed width within allowed range
          if (Math.max(format.width, format.height) > this.MAX_SIZE) {
            format.width = this.MAX_SIZE
            if (aspectRatio < 1) {
              format.width = Math.floor(format.width * aspectRatio)
            }
          }
          if (Math.min(format.width, format.height) < this.MIN_SIZE) {
            format.width = this.MIN_SIZE
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
          format.height = Math.max(Math.min(Math.floor(format.width / aspectRatio), this.MAX_SIZE), this.MIN_SIZE)

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
        if (page.width * page.height > this.MAX_AREA) {
          const format = { width: page.width, height: page.height, physicalWidth: page.physicalWidth ?? page.width, physicalHeight: page.physicalHeight ?? page.height, unit: page.unit ?? 'px' }
          const precision = format.unit === 'px' ? 0 : PRECISION
          const aspectRatio = format.width / format.height
          format.width = Math.sqrt(this.MAX_AREA * aspectRatio)
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
    if (Math.max(width, height) > this.MAX_SIZE) {
      if (aspectRatio > 1) {
        width = this.MAX_SIZE
        height = Math.ceil(width / aspectRatio)
      } else {
        height = this.MAX_SIZE
        width = Math.ceil(height * aspectRatio)
      }
    }
    if (Math.min(width, height) < this.MIN_SIZE) {
      if (aspectRatio > 1) {
        height = this.MIN_SIZE
        width = Math.floor(height * aspectRatio)
      } else {
        width = this.MIN_SIZE
        height = Math.floor(width / aspectRatio)
      }
    }

    // adjust aspect ratio to fit limitation if still oversize
    if (Math.max(width, height) > this.MAX_SIZE) {
      if (aspectRatio > 1) {
        width = this.MAX_SIZE
      } else {
        height = this.MAX_SIZE
      }
    }
    return { width, height }
  }

  getPageDefaultBleeds(pageSize = { physicalWidth: 1080, physicalHeight: 1080, unit: 'px' }, unit = pageSize.unit): IBleed {
    const defaultBleed = this.defaultBleed
    const precision = unit === 'px' ? 0 : PRECISION
    const dpi = unitUtils.getConvertDpi(pageSize)
    return {
      top: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.height), precision),
      bottom: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.height), precision),
      left: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.width), precision),
      right: round(unitUtils.convert(defaultBleed, 'mm', unit, dpi.width), precision)
    } as IBleed
  }

  getDefaultBleedMap(pageIndex: number) {
    const defaultBleed = this.defaultBleed
    const toBleed = (val: number) => ({
      top: this.isDetailPage && pageIndex !== 0 ? 0 : val,
      bottom: this.isDetailPage && pageIndex !== store.getters.getPagesLength - 1 ? 0 : val,
      left: val,
      right: val
    } as IBleed)
    const defaultPxBleed = this.getPageDefaultBleeds(this.getPageSize(pageIndex), 'px')
    if (this.isDetailPage) {
      if (pageIndex !== 0) defaultPxBleed.top = 0
      if (pageIndex !== store.getters.getPagesLength - 1) defaultPxBleed.bottom = 0
    }
    return {
      px: defaultPxBleed,
      cm: toBleed(round(unitUtils.convert(defaultBleed, 'mm', 'cm'), PRECISION)),
      mm: toBleed(defaultBleed),
      in: toBleed(round(unitUtils.convert(defaultBleed, 'mm', 'in'), PRECISION))
    } as { [index: string]: IBleed }
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

  updatePageInitPos(pageIndex: number, initPos: { x?: number, y?: number }) {
    store.commit('UPDATE_pageInitPos', {
      pageIndex,
      initPos
    })
  }

  setMobilePhysicalPage(payload: { pageIndex: number, originSize?: ISize }) {
    store.commit('SET_pagePhysicalSize', payload)
  }
}

const pageUtils = new PageUtils()

export default pageUtils
