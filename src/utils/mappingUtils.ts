import store from '@/store'
import ShortcutUtils from '@/utils/shortcutUtils'
import AlignUtils from '@/utils/alignUtils'
import OrderUtils from './orderUtils'
import Vue from 'vue'
import groupUtils from './groupUtils'
import layerUtils from './layerUtils'

const iconAlign = ['left-align', 'center-horizontally', 'right-align', 'top-align', 'center-vertically', 'bottom-align', 'distribute-vertically', 'distribute-horizontally']
const iconAction = ['layers-alt', 'copy', 'unlock', 'trash']
const iconOrder = ['layers-front', 'layers-forward', 'layers-backward', 'layers-back']
const iconFont = ['bold', 'underline', 'italic', 'font-vertical']
const iconFontAlign = ['text-align-left', 'text-align-center', 'text-align-right', 'text-align-justify']
class MappingUtils {
  mappingIconSet(set: string): string[] {
    switch (set) {
      case 'align':
        return iconAlign
      case 'action':
        return iconAction
      case 'order':
        return iconOrder
      case 'font':
        return iconFont
      case 'font-align':
        return iconFontAlign
      default:
        return []
    }
  }
  // const iconAlign = ['left-align', 'distribute-horizontally', 'right-align', 'top-align', 'center-vertically', 'distribute-vertically', 'distribute-horizontally']

  mappingIconAction(icon: string) {
    switch (icon) {
      case 'left-align': {
        AlignUtils.leftAlign()
        break
      }
      case 'center-horizontally': {
        AlignUtils.centerHrAlign()
        break
      }
      case 'right-align': {
        AlignUtils.rightAlign()
        break
      }
      case 'top-align': {
        AlignUtils.topAlign()
        break
      }
      case 'center-vertically': {
        AlignUtils.centerVrAlign()
        break
      }
      case 'bottom-align': {
        AlignUtils.bottomAlign()
        break
      }
      case 'layers-front': {
        return OrderUtils.bringToFront
      }
      case 'layers-forward': {
        return OrderUtils.bringForward
      }
      case 'layers-backward': {
        return OrderUtils.bringBackward
      }
      case 'layers-back': {
        return OrderUtils.bringToBack
      }
      case 'distribute-vertically': {
        AlignUtils.distribueVr()
        break
      }
      case 'distribute-horizontally': {
        AlignUtils.distribueHr()
        break
      }
      case 'layers-alt': {
        store.commit('SET_isOrderDropdownsOpened', !store.getters.getIsOrderDropdownsOpened)
        Vue.nextTick(() => {
          const el = document.querySelector('.dropdowns--order') as HTMLElement
          const layersAlt = document.querySelector('.layers-alt')?.getBoundingClientRect()
          el.style.transform = `translate3d(${layersAlt?.left}px, ${layersAlt?.bottom}px,0)`
          el.focus()
        })
        break
      }
      case 'copy': {
        ShortcutUtils.copy()
        ShortcutUtils.paste()
        break
      }
      case 'unlock': {
        const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
        const currSelectedIndex = store.getters.getCurrSelectedIndex
        const isLocked = store.getters.getLayer(lastSelectedPageIndex, currSelectedIndex).locked
        layerUtils.updateLayerProps(lastSelectedPageIndex, currSelectedIndex, { locked: !isLocked })
        break
      }
      case 'trash': {
        ShortcutUtils.del()
        break
      }
    }
  }

  mappingLayers(indexs: number[]) {
    const pageIndex = store.getters.getLastSelectedPageIndex
    const layers = store.getters.getLayers(pageIndex)
    return indexs.map(index => layers[index])
  }
}

const mappingUtils = new MappingUtils()
export default mappingUtils
