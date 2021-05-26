// import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
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

  // store.commit('UPDATE_layerProps', {
  //   pageIndex: lastSelectedPageIndex,
  //   layerIndex: store.getters.getCurrSelectedIndex,
  //   props: {
  //     type: 'tmp',
  //     active: true
  //   }
  // })
  // store.commit('UPDATE_layerStyles', {
  //   pageIndex: lastSelectedPageIndex,
  //   layerIndex: store.getters.getCurrSelectedIndex,
  //   styles: {
  //     zindex: -1
  //   }
  // })

  updateLayersStyles(pageIndex: number, layerIndex: number, styles: { [index: string]: number | string | boolean }) {
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
}

const layerUtils = new LayerUtils()

export default layerUtils
