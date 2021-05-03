import store from '@/store'
import GroupUtils from '@/utils/groupUtils'

class ShortcutHandler {
  // target: HTMLElement
  // constructor(target: HTMLElement) {
  //   this.target = target
  // }

  copy() {
    console.log('copy')
    const selectedLayers = store.getters.getCurrSelectedLayers
    console.log(selectedLayers)
    store.commit('SET_clipboard', [...selectedLayers])
  }

  paste() {
    console.log('paste')
    const clipboardInfo = store.getters.getClipboard.map((layer: any) => {
      layer.styles.x += 10
      layer.styles.y += 10
      return layer
    })
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    store.commit('ADD_newLayers', { pageIndex: lastSelectedPageIndex, layers: JSON.parse(JSON.stringify(clipboardInfo)) })
    store.commit('CLEAR_currSelectedInfo')
    const layersNum = store.getters.getLayersNum(lastSelectedPageIndex)
    const pasteNum = clipboardInfo.length
    const diff = layersNum - pasteNum
    store.commit('ADD_selectedLayer', { layerIndexs: [...Array(pasteNum)].fill(diff).map((el, index) => el + index), pageIndex: lastSelectedPageIndex })
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
    GroupUtils.appendGroup()
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
