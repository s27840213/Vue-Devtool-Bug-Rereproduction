import store from '@/store'
import Vue from 'vue'
import MouseUtils from './mouseUtils'

const DROPDOWN_ORDER = '.dropdown__order' as const
const DROPDOWN_LAYER = '.dropdown__layer' as const
const DROPDOWN_PAGE = '.dropdown__page' as const
const DROPDOWN_ALIGN = '.dropdown__align' as const
const DROPDOWN_FLIP = '.dropdown__flip' as const

class DropdownUtils {
  openDropdownUnderTarget(dropdown: string, target: string) {
    Vue.nextTick(() => {
      const el = document.querySelector(dropdown) as HTMLElement
      const [width, height] = [el.offsetWidth, el.offsetHeight]
      const [vw, vh] = [window.innerWidth || document.documentElement.clientWidth, window.innerHeight || document.documentElement.clientHeight]
      const { left, bottom } = document.querySelector(target)?.getBoundingClientRect() as DOMRect
      let xDiff = 0
      let yDiff = 0
      if ((left + width) > vw) {
        xDiff = (left + width) - vw
      }
      if ((bottom + height) > vh) {
        yDiff = (bottom + height) - vh
      }

      el.style.transform = `translate3d(${left - xDiff}px, ${bottom - yDiff}px,0)`
    })
  }

  openDropdownOnMousePos(dropdown: string, event: MouseEvent) {
    Vue.nextTick(() => {
      const el = document.querySelector(dropdown) as HTMLElement
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

  openOrderDropdown() {
    store.commit('dropdown/SET_STATE', {
      isOrderDropdownOpened: true
    })
    this.openDropdownUnderTarget(DROPDOWN_ORDER, '.layers-alt')
  }

  openAlignDropdown() {
    store.commit('dropdown/SET_STATE', {
      isAlignDropdownOpened: true
    })
    this.openDropdownUnderTarget(DROPDOWN_ALIGN, '.btn-align')
  }

  openFlipDropdown() {
    store.commit('dropdown/SET_STATE', {
      isFlipDropdownOpened: true
    })
    this.openDropdownUnderTarget(DROPDOWN_FLIP, '.btn-flip')
  }

  openLayerDropdown(event: MouseEvent) {
    store.commit('dropdown/SET_STATE', {
      isLayerDropdownOpened: true
    })
    this.openDropdownOnMousePos(DROPDOWN_LAYER, event)
  }

  openPageDropdown(event: MouseEvent) {
    store.commit('dropdown/SET_STATE', {
      isPageDropdownOpened: true
    })
    this.openDropdownOnMousePos(DROPDOWN_PAGE, event)
  }

  closeDropdown(type: string) {
    type = type.charAt(0).toUpperCase() + type.slice(1)
    const key = `is${type}DropdownOpened`
    const result = {} as { [index: string]: boolean }
    result[key] = false
    if (type === 'layer' || type === 'page') {
      Object.assign(result, {
        isOrderDropdownOpened: false,
        isLayerDropdownOpened: false,
        isPageDropdownOpened: false,
        isFlipDropdownOpened: false,
        isAlignDropdownOpened: false
      })
    }
    store.commit('dropdown/SET_STATE', result)
  }
}

const dropdownUtils = new DropdownUtils()

export default dropdownUtils
