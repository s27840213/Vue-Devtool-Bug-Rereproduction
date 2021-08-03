import store from '@/store'
import GroupUtils from '@/utils/groupUtils'
import GeneralUtils from '@/utils/generalUtils'
import ZindexUtils from '@/utils/zindexUtils'
import LayerUtils from '@/utils/layerUtils'
import StepsUtils from '@/utils/stepsUtils'
import { ILayer } from '@/interfaces/layer'

class ShortcutHandler {
  // target: HTMLElement
  // constructor(target: HTMLElement) {
  //   this.target = target
  // }

  copy() {
    if (store.getters.getCurrSelectedIndex >= 0 && !LayerUtils.getTmpLayer().locked) {
      store.commit('SET_clipboard', GeneralUtils.deepCopy(store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex)))
    } else {
      console.warn('You did\'t select any unlocked layer')
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
    if (store.getters.getCurrSelectedIndex >= 0 && lastSelectedPageIndex === store.getters.getCurrSelectedPageIndex) {
      const tmpIndex = store.getters.getCurrSelectedIndex
      const tmpLayers = store.getters.getCurrSelectedLayers
      const tmpLayersNum = isTmp ? tmpLayers.length : 1
      GroupUtils.deselect()
      if (isTmp) {
        console.log('1')
        store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(lastSelectedPageIndex, tmpIndex + tmpLayersNum, GeneralUtils.deepCopy(clipboardInfo[0].layers))
      } else {
        console.log('2')
        store.commit('ADD_layersToPos', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)], pos: tmpIndex + tmpLayersNum })
        GroupUtils.set(lastSelectedPageIndex, tmpIndex + tmpLayersNum, [...GeneralUtils.deepCopy(clipboardInfo)])
      }
    } else {
      if (store.getters.getCurrSelectedIndex >= 0) {
        GroupUtils.deselect()
      }
      if (isTmp) {
        console.log('3')
        store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(lastSelectedPageIndex, store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, GeneralUtils.deepCopy(clipboardInfo[0].layers))
      } else {
        console.log('4')
        store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: [...GeneralUtils.deepCopy(clipboardInfo)] })
        GroupUtils.set(lastSelectedPageIndex, store.getters.getLayersNum(store.getters.getLastSelectedPageIndex) - 1, [...GeneralUtils.deepCopy(clipboardInfo)])
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

  selectAll() {
    GroupUtils.selectAll()
  }

  group() {
    GroupUtils.group()
  }

  ungroup() {
    GroupUtils.ungroup()
  }

  undo() {
    console.log('undo')
    StepsUtils.undo()
  }

  redo() {
    console.log('redo')
    StepsUtils.redo()
  }
}

const shortcutHandler = new ShortcutHandler()

export default shortcutHandler
