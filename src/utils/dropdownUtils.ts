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
      const targetEl = document.querySelector(target)?.getBoundingClientRect()
      el.style.transform = `translate3d(${targetEl?.left}px, ${targetEl?.bottom}px,0)`
    })
  }

  openDropdownOnMousePos(dropdown: string, event: MouseEvent) {
    Vue.nextTick(() => {
      const el = document.querySelector(dropdown) as HTMLElement
      const mousePos = MouseUtils.getMouseAbsPoint(event)
      el.style.transform = `translate3d(${mousePos.x}px, ${mousePos.y}px,0)`
    })
  }

  openOrderDropdown() {
    store.commit('dropdown/SET_STATE', {
      isOrderDropdownsOpened: true
    })
    this.openDropdownUnderTarget(DROPDOWN_ORDER, '.layers-alt')
  }

  openAlignDropdown() {
    store.commit('dropdown/SET_STATE', {
      isAlignDropdownsOpened: true
    })
    this.openDropdownUnderTarget(DROPDOWN_ALIGN, '.btn-align')
  }

  openFlipDropdown() {
    store.commit('dropdown/SET_STATE', {
      isFlipDropdownsOpened: true
    })
    this.openDropdownUnderTarget(DROPDOWN_FLIP, '.btn-flip')
  }

  openLayerDropdown(event: MouseEvent) {
    store.commit('dropdown/SET_STATE', {
      isLayerDropdownsOpened: true
    })
    this.openDropdownOnMousePos(DROPDOWN_LAYER, event)
  }

  openPageDropdown(event: MouseEvent) {
    store.commit('dropdown/SET_STATE', {
      isPageDropdownsOpened: true
    })
    this.openDropdownOnMousePos(DROPDOWN_PAGE, event)
  }

  closeDropdown() {
    store.commit('dropdown/SET_STATE', {
      isOrderDropdownsOpened: false,
      isLayerDropdownsOpened: false,
      isPageDropdownsOpened: false,
      isFlipDropdownsOpened: false,
      isAlignDropdownsOpened: false
    })
  }
}

const dropdownUtils = new DropdownUtils()

export default dropdownUtils
