import { IPage } from '@nu/vivi-lib/interfaces/page'
import store from '@/store'
import { LineTemplatesType } from '@nu/vivi-lib/store/types'
import { EventEmitter } from 'events'
import mouseUtils from './mouseUtils'
import pageUtils from './pageUtils'
import unitUtils from './unitUtils'
interface ITemplateSetting {
  v: Array<number>
  h: Array<number>
}
class RulerUtils {
  get currFocusPage() {
    return pageUtils.currFocusPage
  }

  get currFocusPageGuidelineNum(): { [index: string]: number } {
    return {
      v: this.currFocusPage.guidelines.v.length,
      h: this.currFocusPage.guidelines.h.length
    }
  }

  get scaleRatio() { return store.getters.getPageScaleRatio }
  get showRuler() { return store.getters.getShowRuler }
  get showGuideline() { return store.getters.getShowGuideline }
  get lockGuideline() { return store.getters.getLockGuideline }
  get isDragging() { return store.getters.getIsDraggingGuideline }

  RULER_SIZE = 20
  event: any
  eventHash: { [index: string]: (pagePos: number, pos: number, type: string, from?: number) => void }
  templates: {
    type1: Array<ITemplateSetting>,
    type2: Array<ITemplateSetting>
  }

  fbCover: { v: Array<number>, h: Array<number> }

  lastMapedInfo: {
    type: string,
    index: number,
    pageIndex: number
  }

  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.lastMapedInfo = {
      type: 'v',
      index: -1,
      pageIndex: -1
    }
    this.templates = {
      type1: [
        {
          v: [],
          h: []
        },
        {
          v: [50],
          h: []
        },
        {
          v: [],
          h: [50]
        },
        {
          v: [],
          h: [33.33, 66.66]
        },
        {
          v: [50],
          h: [50]
        },
        {
          v: [50],
          h: [50]
        },
        {
          v: [],
          h: [50, 75]
        },
        {
          v: [33.33, 66.66],
          h: [50]
        },
        {
          v: [33.33, 66.66],
          h: [33.33, 66.66]
        }
      ],
      type2: [
        {
          v: [33.33, 66.66],
          h: [33.33, 66.66]
        },
        {
          v: [50],
          h: [50]
        },
        {
          v: [50],
          h: [33.33, 66.66]
        }
      ]
    }

    this.fbCover = {
      v: [],
      h: [120, 573]
    }
  }
  /**
   * @param type
   * @param callback
   * @param from - from which pageIndex
   */

  on(type: string, callback: (pagePos: number, pos: number, type: string, from?: number) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  mapGuidelineToPage(guideline: HTMLElement, type: string, from: number): { pos: number, outOfPage: boolean } {
    const guidelineRect = guideline.getBoundingClientRect()
    const targetPageIndex = from === -1 ? pageUtils.currFocusPageIndex : from
    const targetPage: IPage = from === -1 ? this.currFocusPage : pageUtils.getPage(targetPageIndex)

    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-bleed-${targetPageIndex}`)[0]?.getBoundingClientRect() ?? document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guidelineRect.left - pageRect.left) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > targetPage.width
        }
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-bleed-${targetPageIndex}`)[0]?.getBoundingClientRect() ?? document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guidelineRect.top - pageRect.top) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > targetPage.height
        }
      }
    }
    return {
      pos: -1,
      outOfPage: true
    }
  }

  getOverlappedPageIndex(guideline: HTMLElement, type: string): number {
    const guidelineRect = guideline.getBoundingClientRect()
    for (const [pageIndex, page] of pageUtils.getPages.entries()) {
      switch (type) {
        case 'v': {
          const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
          const mapResult = (guidelineRect.left - pageRect.left) / (this.scaleRatio / 100)
          if (mapResult >= 0 && mapResult <= page.width) {
            return pageIndex
          }
          break
        }
        case 'h': {
          const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
          const mapResult = (guidelineRect.top - pageRect.top) / (this.scaleRatio / 100)
          if (mapResult >= 0 && mapResult <= page.height) {
            return pageIndex
          }
          break
        }
      }
    }
    return -1
  }

  getMouseOverPageIndex(e: PointerEvent): number {
    const mousePos = mouseUtils.getMouseAbsPoint(e)
    for (const pageIndex in pageUtils.getPages) {
      const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
      if (mousePos.x >= pageRect.x && mousePos.x <= pageRect.x + pageRect.width &&
        mousePos.y >= pageRect.y && mousePos.y <= pageRect.y + pageRect.height) {
        return parseInt(pageIndex, 10)
      }
    }
    return -1
  }

  getMostlyOverlappedPageIndex(e: PointerEvent): number {
    const editorRect = document.getElementsByClassName('editor-view')[0].getBoundingClientRect()
    const mousePos = mouseUtils.getMouseAbsPoint(e)
    let candidates = [] as { index: number, yDiff: number }[]
    let maxOverlappedLen = -1
    for (const pageIndex in pageUtils.getPages) {
      const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
      const pageIndexNum = parseInt(pageIndex, 10)
      if (mousePos.x < pageRect.x || mousePos.x > pageRect.x + pageRect.width ||
        pageRect.y > editorRect.height || pageRect.y + pageRect.height < 0) continue
      const overlappedLen = Math.min(pageRect.y + pageRect.height, editorRect.height) - Math.max(pageRect.y, 0)
      const item = { index: pageIndexNum, yDiff: Math.min(Math.abs(mousePos.y - pageRect.y), Math.abs(mousePos.y - pageRect.y - pageRect.height)) }
      if (overlappedLen > maxOverlappedLen) {
        maxOverlappedLen = overlappedLen
        candidates = [item]
      } else if (overlappedLen === maxOverlappedLen) {
        candidates.push(item)
      }
    }
    if (candidates.length === 0) return -1
    let minYDiffPageIndex = -1
    let minYDiff = Number.MAX_SAFE_INTEGER
    for (const candidate of candidates) {
      if (candidate.yDiff < minYDiff) {
        minYDiffPageIndex = candidate.index
        minYDiff = candidate.yDiff
      }
    }
    return minYDiffPageIndex
  }

  mapSnaplineToGuidelineArea(pos: number, type: string, pageIndex: number): number {
    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-bleed-${pageIndex}`)[0]?.getBoundingClientRect() ?? document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.left

        return mapResult
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-bleed-${pageIndex}`)[0]?.getBoundingClientRect() ?? document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.top
        return mapResult
      }
    }
    return -1
  }

  addGuidelineToPage(pos: number, type: string, pageIndex?: number) {
    this.lastMapedInfo.index = this.currFocusPageGuidelineNum[type]
    this.lastMapedInfo.type = type
    this.lastMapedInfo.pageIndex = pageIndex !== undefined ? pageIndex : pageUtils.currFocusPageIndex
    const targetPageindex = pageIndex !== undefined ? pageIndex : pageUtils.currFocusPageIndex
    store.commit('ADD_guideline', {
      pos,
      type,
      pageIndex: targetPageindex
    })
  }

  clearGuidelines(useLastMapped = false) {
    store.commit('CLEAR_guideline', useLastMapped ? this.lastMapedInfo.pageIndex : undefined)
  }

  setShowRuler(bool: boolean) {
    store.commit('SET_showRuler', bool)
  }

  setShowGuideline(bool: boolean) {
    store.commit('SET_showGuideline', bool)
  }

  setLockGuideline(bool: boolean) {
    store.commit('SET_lockGuideline', bool)
  }

  setIsDragging(bool: boolean) {
    store.commit('SET_isDraggingGuideline', bool)
  }

  deleteGuideline(index: number, type: string, pageIndex: number) {
    store.commit('DELETE_guideline', {
      index,
      type,
      pageIndex
    })
  }

  setGuideline(pageIndex: number, guidelines: { v: Array<number>, h: Array<number> }) {
    store.commit('SET_guideline', {
      guidelines,
      pageIndex
    })
  }

  deleteLastMapedGuideline() {
    const { index, type, pageIndex } = this.lastMapedInfo
    this.deleteGuideline(index, type, pageIndex)
  }

  addLineTemplate(index: number, type: LineTemplatesType) {
    this.clearGuidelines()
    this.setShowGuideline(true)
    const targetTemplate = this.templates[type][index]
    const v = targetTemplate.v.map((pos: number) => {
      return this.currFocusPage.width * (pos / 100)
    })
    const h = targetTemplate.h.map((pos: number) => {
      return this.currFocusPage.height * (pos / 100)
    })
    v.forEach((pos: number) => {
      this.addGuidelineToPage(pos, 'v')
    })

    h.forEach((pos: number) => {
      this.addGuidelineToPage(pos, 'h')
    })
  }

  addToSpecPos(posObj: { v: Array<number>, h: Array<number> }) {
    this.clearGuidelines()
    this.setShowGuideline(true)
    posObj.v.forEach((pos: number) => {
      this.addGuidelineToPage(pos, 'v')
    })

    posObj.h.forEach((pos: number) => {
      this.addGuidelineToPage(pos, 'h')
    })
  }

  removeInvalidGuides(pageIndex: number, format: { width: number, height: number }) {
    const { guidelines } = pageUtils.getPage(pageIndex)
    const { width, height } = format
    this.setGuideline(pageIndex, {
      v: guidelines.v.filter((line) => line <= width),
      h: guidelines.h.filter((line) => line <= height)
    })
  }

  adjRulerScale(scale = (this.currFocusPage.unit === 'px' ? 20 : 1), dpi = pageUtils.getPageDPI().width): number {
    const scaleMin = this.currFocusPage.unit === 'px' ? 20 : 1 // min scale for px and physical size
    const scaleStepMax = 5 // max times scale can be increase or reduce
    const scaleSpace = 30 // space between scale lines (in px)
    const getScaleSpace = () => unitUtils.convert(scale, this.currFocusPage.unit, 'px', dpi) * this.scaleRatio / 100

    for (let i = 0; i < scaleStepMax && getScaleSpace() > scaleSpace * 2 && scale > scaleMin; i++) {
      if (scale.toString()[0] === '5') scale = scale / 5 * 4
      scale = Math.floor(scale / 2)
      // console.log('rdc scale', scale)
    }
    if (scale < scaleMin) {
      scale = scaleMin
      // console.log('set scale', scale)
    }
    for (let i = 0; i < scaleStepMax && getScaleSpace() < scaleSpace; i++) {
      if (scale.toString()[0] === '2') scale = scale / 2 * 2.5
      scale *= 2
      // console.log('inc scale', scale)
    }
    return scale
  }
}

const rulerUtils = new RulerUtils()

export default rulerUtils
