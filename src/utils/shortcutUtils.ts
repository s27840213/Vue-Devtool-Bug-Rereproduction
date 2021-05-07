import store from '@/store'
import GroupUtils from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'
class ShortcutHandler {
  // target: HTMLElement
  // constructor(target: HTMLElement) {
  //   this.target = target
  // }

  copy() {
    console.log('copy')
    if (GroupUtils.tmpIndex >= 0) {
      store.commit('SET_clipboard', GeneralUtils.deepCopy(store.getters.getLayer(store.getters.getLastSelectedPageIndex, GroupUtils.tmpIndex)))
    } else {
      console.warn('You did\'t select any layer')
    }
  }

  paste() {
    console.log('paste')
    const clipboardInfo = store.getters.getClipboard.map((layer: any) => {
      layer.styles.x += 10
      layer.styles.y += 10
      return layer
    })
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (GroupUtils.tmpIndex >= 0) {
      const tmpIndex = GroupUtils.tmpIndex
      const tmpLayers = GroupUtils.tmpLayers
      const tmpLayersNum = tmpLayers.length
      GroupUtils.deselect()
      store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
      GroupUtils.set(tmpIndex + tmpLayersNum, GeneralUtils.deepCopy(clipboardInfo[0].layers))
    } else {
      store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
      GroupUtils.set(store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, GeneralUtils.deepCopy(clipboardInfo[0].layers))
    }
  }

  del() {
    console.log('delete')
    store.commit('DELETE_selectedLayer')
  }

  cut() {
    console.log('cut')
  }

  group() {
    console.log('group')
    GroupUtils.group()
  }

  ungroup() {
    console.log('ungroup')
    GroupUtils.ungroup()
  }

  redo() {
    console.log('redo')
  }

  undo() {
    console.log('undo')
  }
}

const shortcutHandler = new ShortcutHandler()

export default shortcutHandler
