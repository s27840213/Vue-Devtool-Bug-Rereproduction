import { IShape, IText, IImage, IGroup, ITmp, ILayer } from '@/interfaces/layer'
import store from '@/store'
import ZindexUtils from '@/utils/zindexUtils'
import GroupUtils from '@/utils/groupUtils'
import FocusUtils from './focusUtils'
import { ISpecLayerData } from '@/store/types'
import { IPage } from '@/interfaces/page'
import TemplateUtils from './templateUtils'
import TextUtils from './textUtils'

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

  updateLayerProps(pageIndex: number, layerIndex: number, props: { [index: string]: number | string | boolean | string[] }) {
    store.commit('UPDATE_layerProps', {
      pageIndex,
      layerIndex,
      props
    })
  }

  updateAllGroupStyles(styles: { [key: string]: string | number | boolean }) {
    store.commit('UPDATE_groupLayerStyles', {
      styles
    })
  }

  updateSubLayerStyles(pageIndex: number, indexs: Array<number> = [], styles: { [index: string]: number | string | boolean }) {
    store.commit('UPDATE_selectedLayersStyles', {
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

  updateSelectedLayerProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | boolean | number | Array<string> }) {
    store.commit('UPDATE_selectedLayerProps', {
      pageIndex,
      layerIndex,
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

  initialLayerScale(pageIndex: number, layerIndex: number) {
    const layer = this.getLayer(pageIndex, layerIndex)
    const { styles: { scale }, type: primaryType } = layer
    const applyLayers = layer.layers ? (layer.layers as ILayer[]) : [layer]
    const isMultipleLayer = ['tmp', 'group'].includes(primaryType)
    for (const idx in applyLayers) {
      const { styles: subStyles, type, paragraphs } = applyLayers[idx] as IText
      const fixScale = isMultipleLayer ? scale * subStyles.scale : scale
      const props = {}
      const styles = {}
      switch (type) {
        case 'text':
          Object.assign(props, { paragraphs: TextUtils.initialParagraphsScale({ scale: fixScale }, paragraphs) })
          if (isMultipleLayer) {
            Object.assign(styles, { scale: 1 })
          }
          break
        default:
          if (isMultipleLayer) {
            const [newLayer] = GroupUtils.mapLayersToPage([applyLayers[idx] as IText], layer as ITmp)
            Object.assign(styles, newLayer.styles)
            Object.assign(
              props,
              { clipPath: newLayer.clipPath }
            )
          }
      }
      if (isMultipleLayer) {
        Object.assign(styles, {
          x: subStyles.x * scale,
          y: subStyles.y * scale
        })
      }
      store.commit('UPDATE_specLayerData', {
        pageIndex,
        layerIndex,
        subLayerIndex: +idx,
        props,
        styles
      })
    }
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: { scale: 1, initWidth: layer.styles.width }
    })
  }

  resetLayerWidth(pageIndex: number, layerIndex: number) {
    const layer = this.getLayer(pageIndex, layerIndex)
    store.commit('UPDATE_layerStyles', {
      pageIndex,
      layerIndex,
      styles: { initWidth: layer.styles.width }
    })
  }
}

const layerUtils = new LayerUtils()

export default layerUtils
