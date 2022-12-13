import { IPage } from '@/interfaces/page'
import store from '@/store'
import { LineTemplatesType } from '@/store/types'
import { EventEmitter } from 'events'
import pageUtils from './pageUtils'
interface ITemplateSetting {
  v: Array<number>
  h: Array<number>
}

const RULER_SCALE_MIN = 25
const RULER_SCALE = 50
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

  mapGuidelineToPage(guildline: HTMLElement, type: string, from: number): { pos: number, outOfPage: boolean } {
    const guildlineRect = guildline.getBoundingClientRect()
    const targetPageIndex = from === -1 ? pageUtils.currFocusPageIndex : from
    const targetPage: IPage = from === -1 ? this.currFocusPage : pageUtils.getPage(targetPageIndex)

    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guildlineRect.left - pageRect.left) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > targetPage.width
        }
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-${targetPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guildlineRect.top - pageRect.top) / (this.scaleRatio / 100)
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

  mapSnaplineToGuidelineArea(pos: number, type: string, pageIndex: number): number {
    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.left
        return mapResult
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageIndex}`)[0].getBoundingClientRect()
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

  removeInvalidGuides(pageIndex: number, format: { width: number, height: number }) {
    const { guidelines } = pageUtils.getPage(pageIndex)
    const { width, height } = format
    this.setGuideline(pageIndex, {
      v: guidelines.v.filter((line) => line <= width),
      h: guidelines.h.filter((line) => line <= height)
    })
  }

  adjRulerScale(scale = RULER_SCALE): number {
    const space = 30 // space between scale lines
    const rulerScaleSpace = () => scale * this.scaleRatio / 100
    while (rulerScaleSpace() > space * 2 && scale > RULER_SCALE_MIN) {
      scale -= RULER_SCALE
      console.log('rdc split', scale)
    }
    if (scale < RULER_SCALE_MIN) {
      scale = RULER_SCALE_MIN
      console.log('set split', scale)
    }
    if (scale === RULER_SCALE_MIN && rulerScaleSpace() < space) {
      scale = RULER_SCALE
      console.log('set split', scale)
    }
    while (rulerScaleSpace() < space) {
      scale += RULER_SCALE
      console.log('inc split', scale)
    }
    return scale
  }
}

const rulerUtils = new RulerUtils()

export default rulerUtils
