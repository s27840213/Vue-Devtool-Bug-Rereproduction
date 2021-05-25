// import store from '@/store'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import { IShape, IText, IImage, IGroup, ILayer, ITmp } from '@/interfaces/layer'
import store from '@/store'
import ZindexUtils from '@/utils/zindexUtils'
import GroupUtils from '@/utils/groupUtils'

class LayerUtils {
  addLayers(pageIndex: number, layer: IShape | IText | IImage | IGroup | ITmp) {
    store.commit('ADD_newLayers', {
      pageIndex: pageIndex,
      layers: [layer]
    })
    ZindexUtils.reassignZindex(pageIndex)
    GroupUtils.deselect()
    store.commit('SET_lastSelectedPageIndex', pageIndex)
    const targetPage = document.querySelector(`.nu-page-${pageIndex}`) as HTMLElement
    targetPage.focus()
    GroupUtils.select([store.getters.getLayers(pageIndex).length - 1])
  }

  addLayersToPos(pageIndex: number, layers: Array<IShape | IText | IImage | IGroup | ITmp>, pos: number) {
    store.commit('ADD_layersToPos', {
      pageIndex: pageIndex,
      layers: layers,
      pos: pos
    })
  }

  deleteSelectedLayer() {
    store.commit('DELETE_selectedLayer')
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    ZindexUtils.reassignZindex(lastSelectedPageIndex)
  }

  updateLayersOrder(pageIndex: number) {
    store.commit('UPDATE_layerOrders', {
      pageIndex: pageIndex
    })
  }

  /**
   * Not finish yet
   */
  // updateLayersStyles() {

  // }

  // updateLayerProps() {

  // }
}

const layerUtils = new LayerUtils()

export default layerUtils
