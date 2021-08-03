// import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import store from '@/store'
import ZindexUtils from '@/utils/zindexUtils'
import GroupUtils from '@/utils/groupUtils'
import FocusUtils from './focusUtils'

class LayerUtils {
  addLayers(pageIndex: number, layer: IShape | IText | IImage | IGroup | ITmp) {
    store.commit('ADD_newLayers', {
      pageIndex: pageIndex,
      layers: [layer]
    })
    ZindexUtils.reassignZindex(pageIndex)
    GroupUtils.deselect()
    store.commit('SET_lastSelectedPageIndex', pageIndex)
    FocusUtils.focusElement(`.nu-page-${pageIndex}`, false)
    GroupUtils.select(pageIndex, [store.getters.getLayers(pageIndex).length - 1])
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
    store.commit('SET_lastSelectedLayerIndex', -1)
  }

  getLayer(pageIndex: number, layerIndex: number): IShape | IText | IImage | IGroup | ITmp {
    return store.getters.getLayer(pageIndex, layerIndex)
  }

  getTmpLayer(): ITmp {
    return store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex)
  }

  updateLayersOrder(pageIndex: number) {
    store.commit('UPDATE_layerOrders', {
      pageIndex: pageIndex
    })
  }

  updateLayerStyles(pageIndex: number, layerIndex: number, styles: { [index: string]: number | string | boolean }) {
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles
    })
  }

  updateLayerProps(pageIndex: number, layerIndex: number, props: { [index: string]: number | string | boolean }) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props
    })
  }

  updateSubLayerStyles(pageIndex: number, indexs: Array<number>, styles: { [index: string]: number | string | boolean }) {
    store.commit('UPDATE_subLayerStyles', {
      pageIndex,
      indexs,
      styles
    })
  }

  updateSubLayerProps(pageIndex: number, indexs: Array<number>, props: { [index: string]: number | string | boolean }) {
    store.commit('UPDATE_subLayerProps', {
      pageIndex,
      indexs,
      props
    })
  }
}

const layerUtils = new LayerUtils()

export default layerUtils
