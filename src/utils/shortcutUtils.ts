import store from '@/store'
import GroupUtils from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'
import ZindexUtils from '@/utils/zindexUtils'
import LayerUtils from '@/utils/layerUtils'
import { ILayer } from '@/interfaces/layer'

class ShortcutHandler {
  // target: HTMLElement
  // constructor(target: HTMLElement) {
  //   this.target = target
  // }

  copy() {
    if (store.getters.getCurrSelectedIndex >= 0) {
      store.commit('SET_clipboard', GeneralUtils.deepCopy(store.getters.getLayer(store.getters.getLastSelectedPageIndex, store.getters.getCurrSelectedIndex)))
    } else {
      console.warn('You did\'t select any layer')
    }
  }

  paste() {
    const clipboardInfo = store.getters.getClipboard.map((layer: ILayer) => {
      layer.styles.x += 10
      layer.styles.y += 10
      layer.shown = false
      return layer
    })
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const isTmp: boolean = clipboardInfo[0].type === 'tmp'
    if (store.getters.getCurrSelectedIndex >= 0) {
      const tmpIndex = store.getters.getCurrSelectedIndex
      const tmpLayers = store.getters.getCurrSelectedLayers
      const tmpLayersNum = isTmp ? tmpLayers.length : 1
      GroupUtils.deselect()
      if (isTmp) {
        store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(tmpIndex + tmpLayersNum, GeneralUtils.deepCopy(clipboardInfo[0].layers))
      } else {
        store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(tmpIndex + tmpLayersNum, [...GeneralUtils.deepCopy(clipboardInfo)])
      }
    } else {
      if (isTmp) {
        store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, GeneralUtils.deepCopy(clipboardInfo[0].layers))
      } else {
        store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, [...GeneralUtils.deepCopy(clipboardInfo)])
      }
    }
    ZindexUtils.reassignZindex(lastSelectedPageIndex)
  }

  del() {
    LayerUtils.deleteSelectedLayer()
    GroupUtils.reset()
  }

  cut() {
    console.log('cut')
  }

  group() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    GroupUtils.group()
    ZindexUtils.reassignZindex(lastSelectedPageIndex)
  }

  ungroup() {
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
