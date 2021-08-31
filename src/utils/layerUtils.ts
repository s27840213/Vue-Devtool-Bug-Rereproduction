// import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import store from '@/store'
import ZindexUtils from '@/utils/zindexUtils'
import GroupUtils from '@/utils/groupUtils'
import FocusUtils from './focusUtils'
import { ISpecLayerData } from '@/store/types'
import { IPage } from '@/interfaces/page'
import TemplateUtils from './templateUtils'

class LayerUtils {
  get currSelectedInfo() { return store.getters.getCurrSelectedInfo }
  get lastSelectedPageIndex() { return store.getters.getLastSelectedPageIndex }

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
    console.log(this.currSelectedInfo.index)
    store.commit('SET_lastSelectedLayerIndex', -1)
    ZindexUtils.reassignZindex(store.getters.getCurrSelectedPageIndex)
    TemplateUtils.updateTextInfoTarget()
  }

  deleteLayer(index: number) {
    store.commit('DELETE_layer', {
      pageIndex: this.lastSelectedPageIndex,
      layerIndex: index
    })
  }

  getLayer(pageIndex: number, layerIndex: number): IShape | IText | IImage | IGroup | ITmp {
    return store.getters.getLayer(pageIndex, layerIndex)
  }

  getTmpLayer(): IShape | IText | IImage | IGroup | ITmp {
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

  updateSpecLayerData(data: ISpecLayerData) {
    const { pageIndex, layerIndex, subLayerIndex, styles, props, type } = data
    store.commit('UPDATE_specLayerData', {
      pageIndex,
      layerIndex,
      subLayerIndex,
      props,
      styles,
      type
    })
  }

  isOutOfBoundary() {
    const pageInfo = store.getters.getPage(this.currSelectedInfo.pageIndex) as IPage
    const targetLayer = this.getTmpLayer()

    if (targetLayer.styles.x > pageInfo.width || targetLayer.styles.y > pageInfo.height ||
      (targetLayer.styles.x + targetLayer.styles.width) < 0 || (targetLayer.styles.y + targetLayer.styles.height) < 0) {
      console.log('Is out of bound!')
    }
  }
}

const layerUtils = new LayerUtils()

export default layerUtils
