import { IShape, IText, IImage, IGroup, ITmp, ILayer, IFrame, IParagraph } from '@/interfaces/layer'
import store from '@/store'
import ZindexUtils from '@/utils/zindexUtils'
import GroupUtils from '@/utils/groupUtils'
import FocusUtils from './focusUtils'
import { ISpecLayerData } from '@/store/types'
import { IPage } from '@/interfaces/page'
import TemplateUtils from './templateUtils'
import TextUtils from './textUtils'
import mouseUtils from './mouseUtils'
import { ICurrSelectedInfo, ICurrSubSelectedInfo } from '@/interfaces/editor'
import stepsUtils from './stepsUtils'
import Vue from 'vue'
import { SrcObj } from '@/interfaces/gallery'

class LayerUtils {
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get currSubSelectedInfo(): ICurrSubSelectedInfo { return store.getters.getSubSelectedInfo }
  get pageIndex(): number { return store.getters.getLastSelectedPageIndex }
  get scaleRatio(): number { return store.getters.getPageScaleRatio }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IImage | IText | IShape | IGroup | IFrame { return this.getLayer(this.pageIndex, this.layerIndex) }
  get getPage() { return store.getters.getPage }
  get getLayer(): (pageIndex: number, layerIndex: number) => IImage | IText | IShape | IGroup | IFrame {
    return store.getters.getLayer
  }

  addLayers(pageIndex: number, layers: Array<IShape | IText | IImage | IGroup | ITmp | IFrame>) {
    store.commit('ADD_newLayers', {
      pageIndex: pageIndex,
      layers: [...layers]
    })
    ZindexUtils.reassignZindex(pageIndex)
    GroupUtils.deselect()
    store.commit('SET_lastSelectedPageIndex', pageIndex)
    FocusUtils.focusElement(`.nu-page-${pageIndex}`, false)
    GroupUtils.select(pageIndex, [store.getters.getLayers(pageIndex).length - 1])

    /**
     * For some existing layers, those active layers might have some props need to be initialized after deactive
     * e.g. text-layer: the editing props need to be set to false after deactive
     * Hence, this kind of initilization should be done before conducting a step-record.
     */
    Vue.nextTick(() => {
      stepsUtils.record()
    })
  }

  addLayersToPos(pageIndex: number, layers: Array<IShape | IText | IImage | IGroup | ITmp | IFrame>, pos: number) {
    store.commit('ADD_layersToPos', {
      pageIndex: pageIndex,
      layers: layers,
      pos: pos
    })
  }

  /**
   * Using this function if you want to remove the layer from the page, and affect the order or undo/redo stack
   * If not, DON'T use this function or it will create an extra record point or affect the layer order. Just use the function deleteLayer()
   */

  deleteSelectedLayer() {
    store.commit('DELETE_selectedLayer')
    ZindexUtils.reassignZindex(this.currSelectedInfo.pageIndex)
    TemplateUtils.updateTextInfoTarget()
    stepsUtils.record()
  }

  deleteLayer(index: number) {
    store.commit('DELETE_layer', {
      pageIndex: this.pageIndex,
      layerIndex: index
    })
  }

  deleteSubLayer(pageIndex: number, primaryIndex: number, subIndex: number) {
    store.commit('DELETE_subLayer', {
      pageIndex,
      primaryIndex,
      subIndex
    })
  }

  replaceLayer(pageIndex: number, layerIndex: number, layer: IImage | IText | IShape | IGroup) {
    store.commit('REPLACE_layer', {
      pageIndex,
      layerIndex,
      layer
    })
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

  updateLayerProps(pageIndex: number, layerIndex: number, props: { [key: string]: string | number | boolean | string[] | number[] | (boolean | undefined)[] | Array<string | IParagraph> | Array<IShape | IText | IImage | IGroup> }) {
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

  updateAllGroupProps(props: { [key: string]: string | number | boolean | number[] }) {
    store.commit('UPDATE_groupLayerProps', {
      props
    })
  }

  updateSubLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: { [key: string]: number }) {
    store.commit('SET_subLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }

  updateSubLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: { [index: string]: number | string | boolean | number[] | IParagraph[] | SrcObj }) {
    store.commit('UPDATE_subLayerProps', {
      pageIndex,
      layerIndex,
      targetIndex,
      props
    })
  }

  setCurrSubSelectedInfo(subIndex: number, type: string) {
    store.commit('SET_currSubSelectedInfo', {
      index: subIndex,
      type
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

  isClickOutOfPagePart(event: MouseEvent, targetLayer: HTMLElement, config: ILayer): boolean {
    let { x, y } = mouseUtils.getMouseRelPoint(event, targetLayer)
    const page = this.getPage(this.currSelectedInfo.pageIndex) as IPage
    const boundaryX = page.width
    const boundaryY = page.height

    // click pos corresponding to page
    x = x * (100 / this.scaleRatio) + config.styles.x
    y = y * (100 / this.scaleRatio) + config.styles.y

    // check is clicking out of page or not
    if (x < 0 || y < 0 || x > boundaryX || y > boundaryY) {
      return true
    } else {
      return false
    }
  }

  initialLayerScale(pageIndex: number, layerIndex: number) {
    const layer = this.getLayer(pageIndex, layerIndex)
    if (!layer) return
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

  getGroupLayerTypes(): Set<string> {
    const { layers, types } = this.currSelectedInfo
    if (layers.length !== 1 || !types.has('group')) {
      return new Set<string>()
    } else {
      return GroupUtils.calcType((layers[0] as IGroup).layers)
    }
  }
}

const layerUtils = new LayerUtils()

export default layerUtils
