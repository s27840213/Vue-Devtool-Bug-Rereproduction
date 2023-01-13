import { IPopupComponent, IPopupProps } from '@/interfaces/popup'
import store from '@/store'
import { PopupSliderEventType } from '@/store/types'
import { EventEmitter } from 'events'
import Vue, { nextTick } from 'vue'
import MouseUtils from './mouseUtils'

interface ISliderConfig {
  value: number,
  min: number,
  max: number,
  step: number,
  noText: boolean
}

const DEFAULT_SLIDER_CONFIG = {
  value: 0,
  min: 0,
  max: 0,
  step: 1,
  noText: false
}

class PopupUtils {
  get isPopupOpen(): boolean { return store.getters['popup/getIsPopupOpen'] }
  get popupComponent(): IPopupComponent { return store.getters['popup/getPopupComponent'] }

  currPopupType: string
  event: any
  eventHash: { [index: string]: (value: number) => void }
  currEvent: string
  sliderConfig: ISliderConfig

  popupEl: HTMLElement

  constructor() {
    this.currPopupType = ''
    this.event = new EventEmitter()
    this.eventHash = {}
    this.currEvent = ''
    this.sliderConfig = DEFAULT_SLIDER_CONFIG
    this.popupEl = null as unknown as HTMLElement
  }

  on(type: string, callback: (value: number) => void) {
    // replace origin event
    if (this.eventHash[type]) {
      this.event.off(type, this.eventHash[type])
      delete this.eventHash[type]
    }
    this.event.on(type, callback)
    this.eventHash[type] = callback
  }

  setCurrEvent(event: string) {
    this.currEvent = event
  }

  setSliderConfig(config: Partial<ISliderConfig>) {
    Object.assign(this.sliderConfig, config)
  }

  private openPopupNearTarget(target: string, pos: { x: 'left' | 'right', y: 'top' | 'bottom' }) {
    nextTick(() => {
      const [width, height] = [this.popupEl.offsetWidth, this.popupEl.offsetHeight]
      const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
      const { left, bottom, right, top } = document.querySelector(target)?.getBoundingClientRect() as DOMRect
      let xDiff = 0
      let yDiff = 0

      const posX = pos.x === 'left' ? left : right - width
      const posY = pos.y === 'bottom' ? bottom : top - height
      if (pos.x === 'left') {
        if ((left + width) > vw) {
          xDiff = (left + width) - vw
        }
      }

      if (pos.y === 'bottom') {
        if ((bottom + height) > vh) {
          yDiff = (bottom + height) - vh
        }
      }

      this.popupEl.style.transform = `translate3d(${posX - xDiff}px, ${posY - yDiff}px,0)`
    })
  }

  private openPopupOnMousePos(event: MouseEvent) {
    nextTick(() => {
      const [width, height] = [this.popupEl.offsetWidth, this.popupEl.offsetHeight]
      const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
      const mousePos = MouseUtils.getMouseAbsPoint(event)
      let xDiff = 0
      let yDiff = 0
      if ((mousePos.x + width) > vw) {
        xDiff = (mousePos.x + width - 5) - vw
      }
      if ((mousePos.y + height) > vh) {
        yDiff = (mousePos.y + height - 5) - vh
      }
      this.popupEl.style.transform = `translate3d(${mousePos.x - xDiff}px, ${mousePos.y - yDiff}px,0)`
    })
  }

  openPopup(type: string, properties?: Partial<IPopupProps>, props = {}) {
    if (!this.popupEl) {
      this.popupEl = document.querySelector('.popup') as HTMLElement
    }
    const underTarget = ['order', 'align', 'flip', 'slider', 'file', 'line-template', 'download', 'page-scale']
    const targetMap: { [index: string]: string } = {
      order: '.layers-alt',
      align: '.btn-align',
      flip: '.btn-flip',
      slider: '.btn-opacity',
      file: '.btn-file',
      download: '.btn-download',
      'page-scale': '.btn-page-resize'
    }
    const onMousePos = ['layer', 'page', 'guideline', 'submit']
    store.dispatch('popup/openPopup', {
      component: `popup-${type}`,
      properties,
      props,
      closeHandler: () => {
        return false
      }
    })

    this.currPopupType = type
    if (underTarget.includes(type)) {
      const target = properties?.target ? properties.target : targetMap[type]
      const posX = properties?.posX ? properties.posX : 'left'
      const posY = properties?.posY ? properties.posY : 'bottom'
      this.openPopupNearTarget(target, {
        x: posX,
        y: posY
      })
      return
    }
    if (onMousePos.includes(type) && properties?.event) {
      this.openPopupOnMousePos(properties.event)
    }
  }

  async closePopup() {
    // await this.popupComponent.closeHandler()
    store.dispatch('popup/closePopup')
    this.currPopupType = ''
    if (this.popupEl) {
      this.popupEl.style.transform = ''
    }
    this.sliderConfig = DEFAULT_SLIDER_CONFIG
  }
}

const popupUtils = new PopupUtils()

export default popupUtils
