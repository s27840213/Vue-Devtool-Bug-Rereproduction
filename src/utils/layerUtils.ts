import { IShape, IText, IImage, IGroup, ITmp, ILayer, IFrame, IParagraph, IImageStyle } from '@/interfaces/layer'
import store from '@/store'
import ZindexUtils from '@/utils/zindexUtils'
import GroupUtils from '@/utils/groupUtils'
import FocusUtils from './focusUtils'
import { ISpecLayerData, LayerType } from '@/store/types'
import { IPage } from '@/interfaces/page'
import TemplateUtils from './templateUtils'
import TextUtils from './textUtils'
import mouseUtils from './mouseUtils'
import { ICurrSelectedInfo, ICurrSubSelectedInfo } from '@/interfaces/editor'
import stepsUtils from './stepsUtils'
import Vue from 'vue'
import { SrcObj } from '@/interfaces/gallery'
import { ITiptapSelection } from '@/interfaces/text'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import generalUtils from './generalUtils'

class LayerUtils {
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get pageIndex(): number { return pageUtils.currFocusPageIndex }
  get scaleRatio(): number { return store.getters.getPageScaleRatio }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IImage | IText | IShape | IGroup | IFrame { return this.getLayer(this.pageIndex, this.layerIndex) }
  get getPage(): (pageInde: number) => IPage { return store.getters.getPage }
  get getCurrPage(): IPage { return this.getPage(this.pageIndex) }
  get getLayer(): (pageIndex: number, layerIndex: number) => IImage | IText | IShape | IGroup | IFrame {
    return store.getters.getLayer
  }

  get getLayers(): (pageIndex: number) => Array<IImage | IText | IShape | IGroup | IFrame> {
    return store.getters.getLayers
  }

  get subLayerIdx(): number {
    const { type } = this.getCurrLayer
    if (type === 'group') {
      return (this.getCurrLayer as IGroup).layers
        .findIndex(l => l.active)
    }
    if (type === 'frame') {
      return (this.getCurrLayer as IFrame).clips
        .findIndex(img => img.active)
    }
    return -1
  }

  get getCurrConfig(): ILayer {
    return this.subLayerIdx === -1 ? this.getCurrLayer as IText | IImage | IShape : (() => {
      if (this.getCurrLayer.type === 'group') {
        return (this.getCurrLayer as IGroup).layers[this.subLayerIdx]
      }
      return (this.getCurrLayer as IFrame).clips[this.subLayerIdx]
    })()
  }

  updatecCurrTypeLayerProp(prop: { [key: string]: string | boolean | number | Array<IParagraph> }) {
    const { getCurrLayer: currLayer, pageIndex, layerIndex, subLayerIdx } = this
    switch (currLayer.type) {
      case 'group':
        try {
          this.updateSubLayerProps(pageIndex, layerIndex, subLayerIdx, prop)
        } catch (e) {
          console.log(e)
        }
        break
      default:
        if (!['tmp', 'frame'].includes(currLayer.type)) {
          this.updateLayerProps(pageIndex, layerIndex, prop)
        }
    }
  }

  updatecCurrTypeLayerStyles(styles: { [key: string]: string | boolean | number }, layerIndex = this.layerIndex) {
    const { getCurrLayer: currLayer, pageIndex, subLayerIdx } = this
    switch (currLayer.type) {
      case 'group':
        try {
          this.updateSubLayerStyles(pageIndex, layerIndex, subLayerIdx, styles)
        } catch (e) {
          console.log(e)
        }
        break
      default:
        if (!['tmp', 'frame'].includes(currLayer.type)) {
          this.updateLayerStyles(pageIndex, layerIndex, styles)
        }
    }
  }

  addLayers(pageIndex: number, layers: Array<IShape | IText | IImage | IGroup | ITmp | IFrame>) {
    store.commit('ADD_newLayers', {
      pageIndex: pageIndex,
      layers: [...layers]
    })
    ZindexUtils.reassignZindex(pageIndex)
    GroupUtils.deselect()
    store.commit('SET_currActivePageIndex', pageIndex)
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

  deleteSelectedLayer(record = true) {
    store.commit('DELETE_selectedLayer')
    ZindexUtils.reassignZindex(this.currSelectedInfo.pageIndex)
    TemplateUtils.updateTextInfoTarget()

    /**
     * Some kind of situation we don't want to record the step when delete layer
     * ex: when we drag layer from one page to another, we will delete layer and then add this layer to page
     * The action of adding layer will trigger record function; so if we also record delete step, we will record two steps at once.
     */
    if (record) {
      stepsUtils.record()
    }
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

  updateLayerStyles(pageIndex: number, layerIndex: number, styles: Partial<IImageStyle> | { [index: string]: number | string | boolean }, subLayerIdx = -1) {
    if (subLayerIdx === -1 || typeof subLayerIdx === 'undefined') {
      store.commit('UPDATE_layerStyles', {
        pageIndex,
        layerIndex,
        styles
      })
    } else {
      this.updateSubLayerStyles(pageIndex, layerIndex, subLayerIdx, styles)
    }
  }

  updateLayerProps(pageIndex: number, layerIndex: number, props: Partial<IImage | IText | IGroup | IShape> | { [key: string]: string | number | ITiptapSelection }, subLayerIdx = -1) {
    if (subLayerIdx === -1 || typeof subLayerIdx === 'undefined') {
      store.commit('UPDATE_layerProps', {
        pageIndex,
        layerIndex,
        props
      })
    } else {
      this.updateSubLayerProps(pageIndex, layerIndex, subLayerIdx, props)
    }
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

  updateSubLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: Partial<IImageStyle> | { [key: string]: number | boolean | string }) {
    store.commit('SET_subLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }

  updateSubLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: Partial<IImage | IText | IGroup | IShape> | { [index: string]: number | string | boolean | number[] | IParagraph[] | SrcObj }) {
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

  isOutOfBoundary(): boolean {
    const pageInfo = store.getters.getPage(this.currSelectedInfo.pageIndex) as IPage
    const targetLayer = this.getTmpLayer()

    if (targetLayer.styles.x > pageInfo.width || targetLayer.styles.y > pageInfo.height ||
      (targetLayer.styles.x + targetLayer.styles.width) < 0 || (targetLayer.styles.y + targetLayer.styles.height) < 0) {
      return true
    }

    return false
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

  updateImageLayerUrls(id: string, flag: 0 | 1) {
    store.commit('UPDATE_imageLayerUrl', { id, flag })
  }

  getUpmostNonTextLayerIndex(layers: ILayer[]) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]
      if (layer.type === 'text') continue
      if (layer.type === 'group') {
        const groupLayer = layer as IGroup
        const types = groupLayer.layers.map(l => l.type)
        if (types.includes('text')) continue
      }
      return i
    }
    return -1
  }

  getLayerIndexById(pageIndex: number, id: string) {
    return this.getLayers(pageIndex).findIndex((layer: ILayer) => {
      return layer.id === id
    })
  }

  getSubLayerIndexById(pageIndex: number, layerIndex: number, id: string) {
    const primaryLayer = this.getLayer(pageIndex, layerIndex)
    if (primaryLayer.type === LayerType.group) {
      return (primaryLayer as IGroup).layers
        .findIndex(l => l.id === id)
    }
    if (primaryLayer.type === LayerType.frame) {
      return (primaryLayer as IFrame).clips
        .findIndex(img => img.id === id)
    }
    return -1
  }

  getLayerInfoById(pageId: string, layerId: string, subLayerId = '') {
    const pageIndex = pageUtils.getPageIndexById(pageId)
    const layerIndex = this.getLayerIndexById(pageIndex, layerId)
    const subLayerIdx = this.getSubLayerIndexById(pageIndex, layerIndex, subLayerId)
    return {
      pageIndex,
      layerIndex,
      subLayerIdx
    }
  }

  getObjectInsertionLayerIndex(layers: ILayer[], objectLayer: any) {
    const startIndex = this.getUpmostNonTextLayerIndex(layers)
    let upmostOverlapTextIndex = startIndex
    for (let i = startIndex + 1; i < layers.length; i++) {
      const layer = layers[i]
      if (layer.type === 'group') {
        const groupLayer = layer as IGroup
        const types = groupLayer.layers.map(l => l.type)
        if (!types.includes('text')) continue
      } else if (layer.type !== 'text') continue
      const intersectAreaRatio = this.calculateIntersectAreaRatio(objectLayer, layer)
      // console.log('intersect ratio:', intersectAreaRatio)
      if (intersectAreaRatio > 0.8 && i > upmostOverlapTextIndex) {
        upmostOverlapTextIndex = i
      }
    }
    return upmostOverlapTextIndex
  }

  calculateIntersectAreaRatio(objectLayer: any, textLayer: ILayer) {
    const polygon1 = mathUtils.generatePolygon(objectLayer.styles)
    const polygon2 = mathUtils.generatePolygon(textLayer.styles)
    const objectArea = polygon1.area()
    const intersectArea = mathUtils.getIntersectArea(polygon1, polygon2)
    return intersectArea / objectArea
  }
}

const layerUtils = new LayerUtils()

export default layerUtils
