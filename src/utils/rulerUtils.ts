import store from '@/store'
import { EventEmitter } from 'events'
import pageUtils from './pageUtils'

class RulerUtils {
  get currFocusPage() {
    return pageUtils.currFocusPage
  }

  get scaleRatio() { return store.getters.getPageScaleRatio }

  event: any
  eventHash: { [index: string]: (pos: number, type: string) => void }

  constructor() {
    this.event = new EventEmitter()
    this.eventHash = {}
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

  mapGuidelineToPage(guildline: HTMLElement, type: string): number {
    const guildlineRect = guildline.getBoundingClientRect()
    switch (type) {
      case 'v': {
        const rulerHRect = document.getElementsByClassName('ruler-hr__body')[0].getBoundingClientRect()
        const mapResult = (guildlineRect.left - rulerHRect.left) / (this.scaleRatio / 100)
        if (mapResult < 0 || mapResult > this.currFocusPage.width) {
          return -1
        }
        return mapResult
        break
      }
      case 'h': {
        const rulerHRect = document.getElementsByClassName('ruler-vr__body')[0].getBoundingClientRect()
        const mapResult = (guildlineRect.top - rulerHRect.top) / (this.scaleRatio / 100)
        if (mapResult < 0 || mapResult > this.currFocusPage.height) {
          return -1
        }
        return mapResult
        break
      }
    }
    return -1
  }

  mapSnaplineToGuidelineArea(pos: number, type: string): number {
    switch (type) {
      case 'v': {
        const rulerHRect = document.getElementsByClassName('ruler-hr__body')[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + rulerHRect.left
        console.log(pos, pos * (this.scaleRatio / 100), rulerHRect.left)
        return mapResult
        break
      }
      case 'h': {
        const rulerHRect = document.getElementsByClassName('ruler-vr__body')[0].getBoundingClientRect()
        const mapResult = pos * (this.scaleRatio / 100) + rulerHRect.top
        return mapResult
        break
      }
    }
    return -1
  }

  addGuidelineToPage(pos: number, type: string) {
    store.commit('ADD_guideline', {
      pos,
      type
    })
  }
}

const rulerUtils = new RulerUtils()

export default rulerUtils
