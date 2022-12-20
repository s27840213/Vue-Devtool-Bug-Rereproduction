import { IPage } from '@/interfaces/page'
import store from '@/store'
import { LineTemplatesType } from '@/store/types'
import { EventEmitter } from 'events'
import pageUtils from './pageUtils'
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

  RULER_SIZE = 20
  event: any
  eventHash: { [index: string]: (pagePos: number, pos: number, type: string, from?: number) => void }
  templates: {
    type1: Array<ITemplateSetting>,
    type2: Array<ITemplateSetting>
  }

  fbCover: { v: Array<number>, h: Array<number> }

  splitUnitMap: {
    xxs: number,
    xs: number,
    s: number,
    m: number,
    l: number,
    xl: number
  }

  isDragging: boolean
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
    this.isDragging = false
    this.splitUnitMap = {
      xxs: 250,
      xs: 200,
      s: 150,
      m: 100,
      l: 50,
      xl: 25
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
        const pageRect = document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guidelineRect.left - pageRect.left) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > targetPage.width
        }
        break
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guidelineRect.top - pageRect.top) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > targetPage.height
        }
        break
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

  mapSnaplineToGuidelineArea(pos: number, type: string, pageIndex: number): number {
    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.left
        return mapResult
        break
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.top
        return mapResult
        break
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

  clearGuidelines() {
    store.commit('CLEAR_guideline')
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
    this.isDragging = bool
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

  mapSplitUnit() {
    if (this.scaleRatio < 30) {
      return this.splitUnitMap.xxs
    } else if (this.scaleRatio < 30) {
      return this.splitUnitMap.xs
    } else if (this.scaleRatio < 80) {
      return this.splitUnitMap.s
    } else if (this.scaleRatio < 150) {
      return this.splitUnitMap.m
    } else if (this.scaleRatio < 350) {
      return this.splitUnitMap.l
    } else {
      return this.splitUnitMap.xl
    }
  }

  removeInvalidGuides(pageIndex: number, format: { width: number, height: number }) {
    const { guidelines } = pageUtils.getPage(pageIndex)
    const { width, height } = format
    this.setGuideline(pageIndex, {
      v: guidelines.v.filter((line) => line <= width),
      h: guidelines.h.filter((line) => line <= height)
    })
  }
}

const rulerUtils = new RulerUtils()

export default rulerUtils
