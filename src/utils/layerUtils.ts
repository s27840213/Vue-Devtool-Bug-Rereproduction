import { ICurrSelectedInfo } from '@/interfaces/editor'
import { SrcObj } from '@/interfaces/gallery'
import { IFrame, IGroup, IImage, IImageStyle, ILayer, IParagraph, IShape, IStyle, IText, ITmp } from '@/interfaces/layer'
import { IPage } from '@/interfaces/page'
import { ITiptapSelection } from '@/interfaces/text'
import store from '@/store'
import { IEditorState, ILayerInfo, ISpecLayerData, LayerType } from '@/store/types'
import groupUtils from '@/utils/groupUtils'
import ZindexUtils from '@/utils/zindexUtils'
import { round } from 'lodash'
import { nextTick } from 'vue'
import controlUtils from './controlUtils'
import frameUtils from './frameUtils'
import mathUtils from './mathUtils'
import mouseUtils from './mouseUtils'
import pageUtils from './pageUtils'
import shapeUtils from './shapeUtils'
import stepsUtils from './stepsUtils'
import TemplateUtils from './templateUtils'
import TextUtils from './textUtils'
import uploadUtils from './uploadUtils'

class LayerUtils {
  get currSelectedInfo(): ICurrSelectedInfo { return store.getters.getCurrSelectedInfo }
  get pageIndex(): number { return pageUtils.currFocusPageIndex }
  get scaleRatio(): number { return store.getters.getPageScaleRatio }
  get layerIndex(): number { return store.getters.getCurrSelectedIndex }
  get getCurrLayer(): IImage | IText | IShape | IGroup | IFrame | ITmp { return this.getLayer(this.pageIndex, this.layerIndex) }
  get getPage(): (pageInde: number) => IPage { return store.getters.getPage }
  get getCurrPage(): IPage { return this.getPage(this.pageIndex) }
  get getLayer(): (pageIndex: number, layerIndex: number) => IImage | IText | IShape | IGroup | IFrame | ITmp {
    return store.getters.getLayer
  }

  get getLayers(): (pageIndex: number) => Array<IImage | IText | IShape | IGroup | IFrame> {
    return store.getters.getLayers
  }

  get hasSelectedLayer(): boolean {
    return this.currSelectedInfo.layers.length > 0
  }

  get getCurrOpacity(): number {
    const currLayer = this.getCurrLayer

    const { subLayerIdx } = this

    if (this.currSelectedInfo.pageIndex === -1) return 1
    if (currLayer.type) {
      switch (currLayer.type) {
        case 'tmp':
          return Math.max(...(this.getCurrLayer as IGroup | ITmp).layers.map((layer: ILayer) => layer.styles.opacity))
        case 'group':
          return subLayerIdx !== -1 ? (currLayer as IGroup).layers[subLayerIdx].styles.opacity : currLayer.styles.opacity
        case 'frame':
          return subLayerIdx !== -1 ? (currLayer as IFrame).clips[subLayerIdx].styles.opacity : currLayer.styles.opacity
        default:
          return this.currSelectedInfo.layers[0].styles.opacity
      }
    } else {
      return 0
    }
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
    groupUtils.deselect()
    store.commit('SET_currActivePageIndex', pageIndex)
    groupUtils.select(pageIndex, [store.getters.getLayers(pageIndex).length - 1])

    /**
     * For some existing layers, those active layers might have some props need to be initialized after deactive
     * e.g. text-layer: the editing props need to be set to false after deactive
     * Hence, this kind of initilization should be done before conducting a step-record.
     */
    nextTick(() => {
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
      groupUtils.reset()
      stepsUtils.record()
    }
  }

  deleteLayer(pageIndex: number, layerIndex: number) {
    store.commit('DELETE_layer', {
      pageIndex,
      layerIndex
    })
  }

  deleteLayerByAssetId(assetId: string) {
    const pages = store.getters.getPages
    pages.forEach((page: IPage, pageIndex: number) => {
      for (let i = page.layers.length - 1; i >= 0; i--) {
        const layer = page.layers[i]
        if (layer.srcObj && (layer as IImage).srcObj.assetId === assetId) {
          store.commit('DELETE_layer', {
            pageIndex,
            layerIndex: i
          })
        }
      }
    })
    uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
  }

  deleteSubLayer(pageIndex: number, primaryIndex: number, subIndex: number) {
    store.commit('DELETE_subLayer', {
      pageIndex,
      primaryIndex,
      subIndex
    })
  }

  addSubLayer(pageIndex: number, layerIndex: number, subLayerIdx: number, config: IImage | IShape | IText) {
    store.commit('ADD_subLayer', {
      layerInfo: { pageIndex, layerIndex, subLayerIdx },
      config
    })
  }

  replaceLayer(pageIndex: number, layerIndex: number, layer: IImage | IText | IShape | IGroup | IFrame) {
    store.commit('REPLACE_layer', {
      pageIndex,
      layerIndex,
      layer
    })
  }

  getSelectedLayer(): IShape | IText | IImage | IGroup | IFrame | ITmp {
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

  updateLayerProps(pageIndex: number, layerIndex: number, props: Partial<IImage | IText | IGroup | IShape | ITmp> | { [key: string]: string | number | ITiptapSelection }, subLayerIdx = -1) {
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

  updateSubLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: Partial<IImage | IText | IGroup | IShape | ITmp> | { [index: string]: number | string | boolean | number[] | IParagraph[] | SrcObj }) {
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

  getLayerPageIntersectRatio(pageIndex: number, layer: IShape | IText | IImage | IGroup | IFrame | ITmp) {
    const pageInfo = store.getters.getPage(pageIndex) as IPage

    const pageRectInfo = { x: 0, y: 0, width: pageInfo.width, height: pageInfo.height, scale: 0, rotate: 0 }

    const polygon1 = mathUtils.generatePolygon(pageRectInfo)
    const polygon2 = mathUtils.generatePolygon(layer.styles)

    const intersectArea = mathUtils.getIntersectArea(polygon1, polygon2)
    return intersectArea / polygon2.area()
  }

  resizeLayerConfig(pageIndex: number, layer: IShape | IText | IImage | IGroup | IFrame | ITmp, toPageCenter = false, resizeRatio = 0.8): (IText | IShape | IImage | IGroup | ITmp | IFrame) {
    const { width: initBoundingWidth, height: initBoundingHeight } = mathUtils.getBounding({ styles: layer.styles as IStyle })
    const boundingboxAspectRatio = initBoundingWidth / initBoundingHeight
    const pageSize = store.getters.getPageSize(pageIndex)
    const pageAspectRatio = pageSize.width / pageSize.height

    const boundingWidth = boundingboxAspectRatio > pageAspectRatio ? pageSize.width * resizeRatio : (pageSize.height * resizeRatio) * boundingboxAspectRatio
    const boundingHeight = boundingboxAspectRatio > pageAspectRatio ? (pageSize.width * resizeRatio) / boundingboxAspectRatio : pageSize.height * resizeRatio

    const scaleRatio = boundingWidth / initBoundingWidth

    const _width = layer.styles.width * scaleRatio
    const _height = layer.styles.height * scaleRatio
    const _scale = layer.styles.scale * scaleRatio

    const defaultStyles = {
      width: _width,
      height: _height,
      scale: _scale
    }

    if (toPageCenter) {
      const posX = (pageSize.width / 2) - (boundingWidth / 2)
      const posY = (pageSize.height / 2) - (boundingHeight / 2)

      Object.assign(defaultStyles, mathUtils.getRotatedPoint(-layer.styles.rotate, {
        x: pageSize.width / 2,
        y: pageSize.height / 2
      }, {
        x: posX,
        y: posY
      }))
    }

    switch (layer.type) {
      case 'image': {
        const { width, height, imgWidth, imgHeight, imgX, imgY } = layer.styles as IImageStyle
        Object.assign(layer.styles, defaultStyles, {
          initWidth: width * scaleRatio,
          initHeight: height * scaleRatio,
          imgWidth: imgWidth * scaleRatio,
          imgHeight: imgHeight * scaleRatio,
          imgX: imgX * scaleRatio,
          imgY: imgY * scaleRatio
        })

        break
      }
      case 'text': {
        if ((layer as IText).widthLimit !== -1) {
          layer.widthLimit = layer.styles.writingMode.includes('vertical') ? _height : _width
        }
        Object.assign(layer.styles, defaultStyles)
        break
      }
      case 'frame': {
        if (frameUtils.isImageFrame(layer)) {
          let { imgWidth, imgHeight, imgX, imgY } = layer.clips[0].styles
          const width = layer.styles.width * scaleRatio
          const height = layer.styles.height * scaleRatio
          imgWidth *= scaleRatio
          imgHeight *= scaleRatio
          imgY *= scaleRatio
          imgX *= scaleRatio

          Object.assign(layer.styles, defaultStyles, {
            initWidth: width,
            initHeight: height
          })

          Object.assign(layer.clips[0].styles, {
            width: width,
            height: height,
            imgWidth,
            imgHeight,
            imgX,
            imgY
          })
        } else {
          Object.assign(layer.styles, defaultStyles)
        }

        break
      }
      case undefined:
      case 'shape': {
        if (layer.category === 'D') {
          const quadrant = shapeUtils.getLineQuadrant(layer.point ?? [])
          const { width: lineWidth, height: lineHeight } = shapeUtils.lineDimension(layer.point ?? [])
          const { size } = layer
          if (!size) break
          const strokeWidth = size[0]
          const newStrokeWidth = round(strokeWidth * scaleRatio, 2)
          const { point, realWidth, realHeight } = shapeUtils.computePointForDimensions(quadrant, newStrokeWidth, lineWidth * scaleRatio, lineHeight * scaleRatio)
          layer.point = point
          // controlUtils.updateShapeLinePoint(pageIndex, layerIndex, point)
          defaultStyles.width = realWidth
          defaultStyles.height = realHeight
          defaultStyles.scale = layer.styles.scale
          Object.assign(layer.styles, {
            initWidth: defaultStyles.width,
            initHeight: defaultStyles.height
          })

          layer.size = [newStrokeWidth]
        }
        if (layer.category === 'E') {
          const { size } = layer
          if (!size) break
          const strokeWidth = size[0]
          const newStrokeWidth = round(strokeWidth * scaleRatio, 2)
          defaultStyles.scale = layer.styles.scale
          const corRad = controlUtils.getCorRadValue([_width, _height], controlUtils.getCorRadPercentage(layer.vSize, size, layer.shapeType ?? ''), layer.shapeType ?? '')

          layer.vSize = [_width, _height]
          layer.size = [newStrokeWidth, corRad]
        }
        Object.assign(layer.styles, defaultStyles)
        break
      }
      default: {
        Object.assign(layer.styles, defaultStyles)
      }
    }

    if (toPageCenter) {
      const { x, y } = mathUtils.getCenter(layer.styles)

      if (x !== pageSize.width / 2 && y !== pageSize.height / 2) {
        layer.styles.x += pageSize.width / 2 - x
        layer.styles.y += pageSize.height / 2 - y
      }
    }

    return layer
  }

  isOutOfBoundary(pageIndex?: number, layer?: IShape | IText | IImage | IGroup | IFrame | ITmp): boolean {
    const pageInfo = store.getters.getPage(pageIndex ?? this.currSelectedInfo.pageIndex) as IPage
    const targetLayer = layer ?? this.getSelectedLayer()

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
            const [newLayer] = groupUtils.mapLayersToPage([applyLayers[idx] as IText], layer as ITmp)
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
      return groupUtils.calcType((layers[0] as IGroup).layers)
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
    const pageIndex = pageId ? pageUtils.getPageIndexById(pageId) : this.pageIndex
    let layerIndex
    let subLayerIdx
    if (subLayerId) {
      // If the layer was in a group, search for it as primaryLayer first,
      // since it may be ungrouped and becomes primaryLayer.
      layerIndex = this.getLayerIndexById(pageIndex, subLayerId)
      if (layerIndex === -1) {
        // If no primaryLayer has the subLayerId, it may be still in the same group.
        layerIndex = this.getLayerIndexById(pageIndex, layerId)
      }
    } else {
      layerIndex = this.getLayerIndexById(pageIndex, layerId)
    }
    /**  If the layerIndex === -1 means the layer is grouped or deleted */
    if (layerIndex === -1) {
      layerIndex = pageUtils.getPage(pageIndex).layers
        .findIndex(l => l.type === LayerType.group && (l as IGroup).layers.find(subLayer => subLayer.id === layerId))
      subLayerIdx = this.getSubLayerIndexById(pageIndex, layerIndex, layerId)
    } else {
      subLayerIdx = this.getSubLayerIndexById(pageIndex, layerIndex, subLayerId)
    }
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

  updateLayerOpacity(value: number) {
    if (value > 100) {
      value = 100
    }
    const { getCurrLayer: currLayer, subLayerIdx, layerIndex } = this
    if (subLayerIdx === -1) {
      if (this.currSelectedInfo.layers.length === 1) {
        this.updateLayerStyles(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, {
          opacity: value
        }
        )
      } else {
        store.commit('UPDATE_selectedLayersStyles', {
          styles: {
            opacity: value
          }
        })
      }
    } else {
      if (subLayerIdx !== -1) {
        currLayer.type === 'group' && this.updateSubLayerStyles(this.pageIndex, layerIndex, subLayerIdx, {
          opacity: value
        })
        currLayer.type === 'frame' && frameUtils.updateFrameLayerStyles(this.pageIndex, layerIndex, subLayerIdx, {
          opacity: value
        })
      } else {
        this.updateLayerStyles(this.currSelectedInfo.pageIndex, this.currSelectedInfo.index, {
          opacity: value
        })
      }
    }
  }
}

const layerUtils = new LayerUtils()

export default layerUtils

export const DELETE_subLayer = function (state: IEditorState, layerInfo: ILayerInfo) {
  const { pageIndex, layerIndex, subLayerIdx } = layerInfo
  const primaryL = state.pages[pageIndex].config.layers[layerIndex] as IGroup
  if (primaryL.type !== LayerType.group || typeof subLayerIdx === 'undefined' || subLayerIdx === -1) {
    return
  }
  primaryL.layers.splice(subLayerIdx, 1)
}

export const ADD_subLayer = function (state: IEditorState, payload: { layerInfo: ILayerInfo, config: IImage | IShape | IText }) {
  const { layerInfo, config } = payload
  const { pageIndex, layerIndex, subLayerIdx } = layerInfo
  const primaryL = state.pages[pageIndex].config.layers[layerIndex] as IGroup
  if (primaryL.type !== LayerType.group || typeof subLayerIdx === 'undefined' || subLayerIdx === -1) {
    return
  }
  primaryL.layers.splice(subLayerIdx, 0, config)
}
