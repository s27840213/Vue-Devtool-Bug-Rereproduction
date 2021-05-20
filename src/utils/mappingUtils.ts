import store from '@/store'
import ShortcutUtils from '@/utils/shortcutUtils'

const iconAlign = ['left-align', 'distribute-horizontally', 'right-align', 'top-align', 'center-vertically', 'distribute-vertically', 'distribute-horizontally']
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

  mappingIconAction(icon: string) {
    switch (icon) {
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
