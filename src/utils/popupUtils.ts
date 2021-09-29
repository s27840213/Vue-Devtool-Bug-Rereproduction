import { IPopupComponent, IPopupProps } from '@/interfaces/popup'
import store from '@/store'
import Vue from 'vue'
import MouseUtils from './mouseUtils'

class PopupUtils {
  get isPopupOpen(): boolean { return store.getters['popup/isPopupOpen'] }
  get popupComponent(): IPopupComponent { return store.getters['popup/popupComponent'] }

  private openPopupUnderTarget(target: string, pos: { x: string, y: string }) {
    Vue.nextTick(() => {
      const el = document.querySelector('.popup') as HTMLElement
      const [width, height] = [el.offsetWidth, el.offsetHeight]
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

      el.style.transform = `translate3d(${posX - xDiff}px, ${posY - yDiff}px,0)`
    })
  }

  private openPopupOnMousePos(event: MouseEvent) {
    Vue.nextTick(() => {
      const el = document.querySelector('.popup') as HTMLElement
      const [width, height] = [el.offsetWidth, el.offsetHeight]
      const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
      const mousePos = MouseUtils.getMouseAbsPoint(event)
      let xDiff = 0
      let yDiff = 0
      if ((mousePos.x + width) > vw) {
        xDiff = (mousePos.x + width) - vw
      }
      if ((mousePos.y + height) > vh) {
        yDiff = (mousePos.y + height) - vh
      }
      el.style.transform = `translate3d(${mousePos.x - xDiff}px, ${mousePos.y - yDiff}px,0)`
    })
  }

  openPopup(type: string, properties?: Partial<IPopupProps>) {
    const underTarget = ['order', 'align', 'flip', 'slider']
    const targetMap: { [index: string]: string } = {
      order: '.layers-alt',
      align: '.btn-align',
      flip: '.btn-flip',
      slider: '.btn-opacity'
    }
    const onMousePos = ['layer', 'page']
    store.dispatch('popup/openPopup', {
      component: `popup-${type}`,
      properties,
      closeHandler: () => {
        return false
      }
    })
    if (underTarget.includes(type)) {
      const target = properties?.target ? properties.target : targetMap[type]
      const posX = properties?.posX ? properties.posX : 'left'
      const posY = properties?.posY ? properties.posY : 'bottom'
      this.openPopupUnderTarget(target, {
        x: posX,
        y: posY
      })
    }
    if (onMousePos.includes(type) && properties?.event) {
      this.openPopupOnMousePos(properties.event)
    }
  }

  async closePopup() {
    // await this.popupComponent.closeHandler()
    store.dispatch('popup/closePopup')
  }
}

const popupUtils = new PopupUtils()

export default popupUtils
