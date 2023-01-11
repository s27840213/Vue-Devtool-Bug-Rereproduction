import store from '@/store'
import ShortcutUtils from '@/utils/shortcutUtils'
import AlignUtils from '@/utils/alignUtils'
import OrderUtils from './orderUtils'
import layerUtils from './layerUtils'
import popupUtils from './popupUtils'
import flipUtils from './flipUtils'
import stepsUtils from './stepsUtils'
import groupUtils from './groupUtils'
import backgroundUtils from './backgroundUtils'

const iconAlign = ['left-align', 'center-horizontally', 'right-align', 'top-align', 'center-vertically', 'bottom-align']
const iconDistribute = ['distribute-horizontally', 'distribute-vertically']
const iconAction = ['layers-alt', 'copy', 'unlock', 'trash']
const iconOrder = ['layers-forward', 'layers-front', 'layers-backward', 'layers-back']
const iconFont = ['bold', 'underline', 'italic', 'font-vertical']
const iconFontAlign = ['text-align-left', 'text-align-center', 'text-align-right', 'text-align-justify']
const iconLineTemplate = [...Array(12).keys()].slice(1).map((num: number) => {
  return `line-template-${num}`
})
const minMaxHash: { [index: string]: { min: number, max: number } } = {
  opacity: {
    min: 0,
    max: 100
  },
  fontSize: {
    min: 6, max: 800
  },
  lineHeight: {
    min: 0.5, max: 2.5
  },
  letterSpacing: {
    min: -200, max: 800
  },
  lineWidth: {
    min: 1, max: 100
  },
  cornerRadius: {
    min: 0, max: 100
  }
}

const langMap: { [index: string]: string } = {
  tw: 'zh-TW',
  us: 'en-US',
  jp: 'ja-JP'
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
      case 'lineTemplate':
        return iconLineTemplate
      default:
        return []
    }
  }
  // const iconAlign = ['left-align', 'distribute-horizontally', 'right-align', 'top-align', 'center-vertically', 'distribute-vertically', 'distribute-horizontally']

  mappingIconAction(icon: string) {
    switch (icon) {
      case 'left-align': {
        AlignUtils.align('left')
        stepsUtils.record()
        break
      }
      case 'center-horizontally': {
        AlignUtils.align('centerHr')
        stepsUtils.record()
        break
      }
      case 'right-align': {
        AlignUtils.align('right')
        stepsUtils.record()
        break
      }
      case 'top-align': {
        AlignUtils.align('top')
        stepsUtils.record()
        break
      }
      case 'center-vertically': {
        AlignUtils.align('centerVr')
        stepsUtils.record()
        break
      }
      case 'bottom-align': {
        AlignUtils.align('bottom')
        stepsUtils.record()
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
        stepsUtils.record()
        break
      }
      case 'distribute-horizontally': {
        AlignUtils.distribueHr()
        stepsUtils.record()
        break
      }
      case 'layers-alt': {
        popupUtils.openPopup('order')
        break
      }
      case 'copy': {
        ShortcutUtils.copy()
        ShortcutUtils.paste()
        stepsUtils.record()
        break
      }
      case 'unlock': {
        if (backgroundUtils.inBgSettingMode) {
          backgroundUtils.handleLockBackground()
        } else {
          const { index, pageIndex } = layerUtils.currSelectedInfo
          layerUtils.updateLayerProps(pageIndex, index, { locked: true })
          stepsUtils.record()
        }
        break
      }
      case 'lock': {
        if (backgroundUtils.inBgSettingMode) {
          backgroundUtils.handleLockBackground()
        } else {
          const { currSelectedInfo: { index, pageIndex }, getCurrConfig } = layerUtils
          const props = { locked: false } as { [key: string]: string | boolean | number }
          if (getCurrConfig.type === 'text') {
            props.editing = false
          }
          layerUtils.updateLayerProps(pageIndex, index, props)
          stepsUtils.record()
        }
        break
      }
      case 'group': {
        groupUtils.group()
        break
      }
      case 'ungroup': {
        groupUtils.ungroup()
        break
      }
      case 'trash': {
        if (backgroundUtils.inBgSettingMode) {
          backgroundUtils.handleDeleteBackground()
        } else {
          ShortcutUtils.del()
        }
        break
      }
      case 'flip-h': {
        flipUtils.horizontalFlip()
        stepsUtils.record()
        break
      }
      case 'flip-v': {
        flipUtils.verticalFlip()
        stepsUtils.record()
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

  mappingLocales(lang: string) {
    return langMap[lang]
  }
}

const mappingUtils = new MappingUtils()
export default mappingUtils
