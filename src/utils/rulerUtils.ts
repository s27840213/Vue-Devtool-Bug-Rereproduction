import store from '@/store'
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

  event: any
  eventHash: { [index: string]: (pos: number, type: string) => void }
  templateSettings: Array<ITemplateSetting>
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
    index: number
  }

  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
    this.lastMapedInfo = {
      type: 'v',
      index: -1
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
    this.templateSettings = [
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

  on(type: string, callback: (pos: number, type: string) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  mapGuidelineToPage(guildline: HTMLElement, type: string): { pos: number, outOfPage: boolean } {
    const guildlineRect = guildline.getBoundingClientRect()
    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageUtils.currFocusPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guildlineRect.left - pageRect.left) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > this.currFocusPage.width
        }
        break
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageUtils.currFocusPageIndex}`)[0].getBoundingClientRect()
        const mapResult = (guildlineRect.top - pageRect.top) / (this.scaleRatio / 100)
        return {
          pos: mapResult,
          outOfPage: mapResult < 0 || mapResult > this.currFocusPage.height
        }
        break
      }
    }
    return {
      pos: -1,
      outOfPage: true
    }
  }

  mapSnaplineToGuidelineArea(pos: number, type: string): number {
    switch (type) {
      case 'v': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageUtils.currFocusPageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.left
        return mapResult
        break
      }
      case 'h': {
        const pageRect = document.getElementsByClassName(`nu-page-${pageUtils.currFocusPageIndex}`)[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + pageRect.top
        return mapResult
        break
      }
    }
    return -1
  }

  addGuidelineToPage(pos: number, type: string) {
    this.lastMapedInfo.index = this.currFocusPageGuidelineNum[type]
    this.lastMapedInfo.type = type
    store.commit('ADD_guideline', {
      pos,
      type
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

  setIsDragging(bool: boolean) {
    this.isDragging = bool
  }

  deleteGuideline(index: number, type: string) {
    store.commit('DELETE_guideline', {
      index,
      type
    })
  }

  deleteLastMapedGuideline() {
    const { index, type } = this.lastMapedInfo
    this.deleteGuideline(index, type)
  }

  addLineTemplate(index: number) {
    this.clearGuidelines()
    this.setShowGuideline(true)
    const targetTemplate = this.templateSettings[index]
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
}

const rulerUtils = new RulerUtils()

export default rulerUtils
