import store from '@/store'
import ShortcutUtils from '@/utils/shortcutUtils'
import AlignUtils from '@/utils/alignUtils'
import OrderUtils from './orderUtils'
import layerUtils from './layerUtils'
import popupUtils from './popupUtils'

const iconAlign = ['left-align', 'center-horizontally', 'right-align', 'top-align', 'center-vertically', 'bottom-align']
const iconDistribute = ['distribute-horizontally', 'distribute-vertically']
const iconAction = ['layers-alt', 'copy', 'unlock', 'trash']
const iconOrder = ['layers-forward', 'layers-front', 'layers-backward', 'layers-back']
const iconFont = ['bold', 'underline', 'italic', 'font-vertical']
const iconFontAlign = ['text-align-left', 'text-align-center', 'text-align-right', 'text-align-justify']
const minMaxHash: { [index: string]: { min: number, max: number } } = {
  opacity: {
    min: 0,
    max: 100
  },
  fontSize: {
    min: 6, max: 800
  },
  lineHeight: {
    min: 0, max: 300
  },
  letterSpacing: {
    min: -200, max: 800
  }
}
class MappingUtils {
  mappingIconSet(set: string): string[] {
    switch (set) {
      case 'align':
        return iconAlign
      case 'distribute':
        return iconDistribute
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
        popupUtils.openPopup('order')
        break
      }
      case 'copy': {
        ShortcutUtils.copy()
        ShortcutUtils.paste()
        break
      }
      case 'unlock': {
        const currSelecteInfo = store.getters.getCurrSelectedInfo
        const currSelectedIndex = store.getters.getCurrSelectedIndex
        const isLocked = store.getters.getLayer(currSelecteInfo.pageIndex, currSelecteInfo.index).locked
        layerUtils.updateLayerProps(currSelecteInfo.pageIndex, currSelectedIndex, { locked: !isLocked })
        break
      }
      case 'trash': {
        ShortcutUtils.del()
        break
      }
      case 'flip-h': {
        break
      }
      case 'flip-v': {
        break
      }
    }
  }

  mappingLayers(pageIndex: number, indexs: number[]) {
    const layers = store.getters.getLayers(pageIndex)
    return indexs.map(index => layers[index])
  }

  mappingMinMax(type: string) {
    return minMaxHash[type]
  }
}

const mappingUtils = new MappingUtils()
export default mappingUtils
