import store from '@/store'
import { IShape, IText, IImage, IGroup, IStyle, ITextStyle } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import LayerFactary from '@/utils/layerFactary'
import MappingUtils from '@/utils/mappingUtils'
import GeneralUtils from '@/utils/generalUtils'
import MathUtils from '@/utils/mathUtils'
import ZindexUtils from './zindexUtils'

function calcTmpProps(layers: Array<IShape | IText | IImage | IGroup>): ICalculatedGroupStyle {
  let minX = Number.MAX_SAFE_INTEGER
  let minY = Number.MAX_SAFE_INTEGER
  let maxWidth = Number.MIN_SAFE_INTEGER
  let maxHeight = Number.MIN_SAFE_INTEGER
  layers = JSON.parse(JSON.stringify(layers))

  layers.forEach((layer: IShape | IText | IImage | IGroup) => {
    if (layer.styles.rotate === 0) {
      minX = Math.min(minX, layer.styles.x)
      minY = Math.min(minY, layer.styles.y)
    } else {
      const layerBouding = MathUtils.getBounding(layer.styles.rotate, MathUtils.getCenter(layer.styles), {
        x: layer.styles.x,
        y: layer.styles.y,
        width: layer.styles.width,
        height: layer.styles.height
      })
      minX = Math.min(minX, layerBouding.x)
      minY = Math.min(minY, layerBouding.y)
    }
  })

  layers.forEach((layer: IShape | IText | IImage | IGroup) => {
    if (layer.styles.rotate === 0) {
      maxWidth = Math.max(maxWidth, layer.styles.x + (layer.styles.width as number) - minX)
      maxHeight = Math.max(maxHeight, layer.styles.y + (layer.styles.height as number) - minY)
    } else {
      const layerBouding = MathUtils.getBounding(layer.styles.rotate, MathUtils.getCenter(layer.styles), {
        x: layer.styles.x,
        y: layer.styles.y,
        width: layer.styles.width,
        height: layer.styles.height
      })
      maxWidth = Math.max(maxWidth, layerBouding.x + (layerBouding.width as number) - minX)
      maxHeight = Math.max(maxHeight, layerBouding.y + (layerBouding.height as number) - minY)
    }
  })

  return {
    x: minX,
    y: minY,
    width: maxWidth,
    height: maxHeight
  } as ICalculatedGroupStyle
}

function calcType(layers: Array<IShape | IText | IImage | IGroup>): Set<string> {
  const typeSet = new Set<string>()
  if (layers.length === 0) {
    return typeSet
  }
  if (layers.length === 1) {
    typeSet.add(layers[0].type)
    return typeSet
  } else {
    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      if (!typeSet.has(layer.type)) {
        typeSet.add(layer.type)
      }
    })
    return typeSet
  }
}

function getTmpStyles(tmpIndex: number) {
  const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
  return store.getters.getLayer(lastSelectedPageIndex, tmpIndex).styles
}
class GroupUtils {
  /**
   * @param {Array<IShape | IText | IImage | IGroup>} tmpLayers - all selected layers
   *
   * @param {number} tmpIndex - selected index of layer,
   *    It isn't an array of index becauce we just have two options now:
   *        1. select tmp layer which contain all selected layers(tmpLayers)
   *        2. only select one layer(image, text, group, shape layer)
   * @param {string} type - selected layer type
   * - if there are several type-different layer, the value will be mix
   * - if tmpLayers is empty, the value will be 'none'
   */

  /**
   * Condition:
   *    1. tmpIndex < 0 -> there isn't any selected layer
   */

  tmpLayers: Array<IShape | IText | IImage | IGroup>
  // tmpStyles: ICalculatedGroupStyle
  tmpIndex: number
  type: Set<string>
  constructor() {
    this.tmpLayers = []
    this.tmpIndex = -1
    this.type = new Set<string>()
  }

  group() {
    if (this.tmpLayers.length < 2) {
      console.log('You need to select at least 2 layers!')
      return
    }
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    store.commit('UPDATE_layerProps', {
      pageIndex: lastSelectedPageIndex,
      layerIndex: this.tmpIndex,
      props: {
        type: 'group',
        active: false,
        shown: false
      }
    })
    const tmpIndex = this.tmpIndex
    this.reset()
    this.select([tmpIndex])
  }

  ungroup() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const targetLayer = store.getters.getLayer(lastSelectedPageIndex, this.tmpIndex)
    if (targetLayer.type === 'group') {
      targetLayer.layers.forEach((layer: IGroup) => {
        layer.styles.zindex = targetLayer.styles.zindex
      })
      const tmpLayer = targetLayer
      store.commit('UPDATE_layerProps', {
        pageIndex: lastSelectedPageIndex,
        layerIndex: this.tmpIndex,
        props: {
          type: 'tmp',
          active: true
        }
      })
      store.commit('UPDATE_layerStyles', {
        pageIndex: lastSelectedPageIndex,
        layerIndex: this.tmpIndex,
        styles: {
          zindex: -1
        }
      })
      const tmpIndex = this.tmpIndex
      this.reset()
      this.set(tmpIndex, tmpLayer.layers)
    }
  }

  select(layerIndexs: Array<number>) {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    // tmpIndex is smaller than 0 means there isn't any selected layer
    if (this.tmpIndex < 0) {
      if (layerIndexs.length === 1) {
        this.tmpIndex = layerIndexs[0]
        store.commit('UPDATE_layerProps', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: this.tmpIndex,
          props: {
            active: true
          }
        })
        this.tmpLayers = [...MappingUtils.mappingLayers(layerIndexs)]
      } else {
        const layers = MappingUtils.mappingLayers(layerIndexs)
        const tmpStyles = calcTmpProps(layers)
        this.tmpLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...layerIndexs)
        const newLayersNum = layers.length
        this.tmpIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !layerIndexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, tmpStyles, this.tmpLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [tmp],
          pos: this.tmpIndex
        })
      }
    } else {
      if (this.tmpLayers.length === 1) {
        const indexs = [this.tmpIndex, ...layerIndexs]
        this.deselect()
        const layers = MappingUtils.mappingLayers(indexs)
        const tmpStyles = calcTmpProps(layers)
        this.tmpLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...indexs)
        const newLayersNum = layers.length
        this.tmpIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, tmpStyles, this.tmpLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [tmp],
          pos: this.tmpIndex
        })
      } else {
        const layers = MappingUtils.mappingLayers(layerIndexs)
        const prevTmpStyles = getTmpStyles(this.tmpIndex)
        const tmpStyles = calcTmpProps([...this.mapLayersToPage(this.tmpLayers, getTmpStyles(this.tmpIndex)), ...layers])
        this.tmpLayers = this.mapLayersToTmp([...this.mapLayersToPage(this.tmpLayers, prevTmpStyles), ...layers], tmpStyles)
        const topIndex = Math.max(this.tmpIndex, ...layerIndexs)
        const newLayersNum = 1 + layerIndexs.length
        const indexs = [this.tmpIndex, ...layerIndexs]
        this.tmpIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, tmpStyles, this.tmpLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [tmp],
          pos: this.tmpIndex
        })
      }
    }
    this.type = calcType(this.tmpLayers)
    console.log(this.type)
  }

  deselect() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (this.tmpIndex !== -1) {
      if (this.tmpLayers.length === 1) {
        store.commit('UPDATE_layerProps', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: this.tmpIndex,
          props: {
            active: false
          }
        })
      } else {
        const tmpStyles = getTmpStyles(this.tmpIndex)
        store.commit('DELETE_layer', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: this.tmpIndex
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [...this.mapLayersToPage(this.tmpLayers, tmpStyles)],
          pos: this.tmpIndex
        })
      }
      this.reset()
      store.commit('UPDATE_layerOrders', {
        pageIndex: lastSelectedPageIndex
      })
      ZindexUtils.reassignZindex(lastSelectedPageIndex)
    }
    store.commit('SET_currFunctionPanelType', 0)
  }

  reset() {
    this.tmpIndex = -1
    this.tmpLayers = []
    this.type.clear()
  }

  set(tmpIndex: number, tmpLayers: Array<IShape | IText | IImage | IGroup>) {
    this.tmpIndex = tmpIndex
    this.tmpLayers = tmpLayers
    this.type = calcType(tmpLayers)
  }

  movingTmp(pageIndex: number, styles: any) {
    store.commit('UPDATE_tmpLayerStyles', {
      pageIndex: pageIndex,
      styles
    })
  }

  mapLayersToTmp(layers: Array<IShape | IText | IImage | IGroup>, styles: ICalculatedGroupStyle): Array<IShape | IText | IImage | IGroup> {
    layers = JSON.parse(JSON.stringify(layers.sort((a, b) => a.styles.zindex - b.styles.zindex)))

    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      layer.styles.x -= styles.x
      layer.styles.y -= styles.y
    })

    return layers
  }

  /**
   * @param layers - all selected layers in tmp layer
   * @param styles - the styles of tmp layer
   * @returns calculated layers in tmp layer
   */
  mapLayersToPage(layers: Array<IShape | IText | IImage | IGroup>, styles: IStyle): Array<IShape | IText | IImage | IGroup> {
    layers = JSON.parse(JSON.stringify(layers))
    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      // calculate scale offset
      layer.styles.width = layer.styles.width as number * styles.scale
      layer.styles.height = layer.styles.height as number * styles.scale
      layer.styles.scale *= styles.scale

      // calculate the center shift of scaled image
      if (layer.styles.scale !== 1) {
        const ratio = styles.width / styles.initWidth
        const [x1, y1] = [layer.styles.x, layer.styles.y]
        const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
        layer.styles.x = shiftX
        layer.styles.y = shiftY
      }

      // map to original coordinate system
      layer.styles.x += styles.x
      layer.styles.y += styles.y

      // calculate rotation offset
      const centerOffset = MathUtils.getRotatedPoint(styles.rotate, MathUtils.getCenter(styles), MathUtils.getCenter(layer.styles))
      layer.styles.x = centerOffset.x - (layer.styles.width as number) / 2
      layer.styles.y = centerOffset.y - (layer.styles.height as number) / 2
      layer.styles.rotate = (layer.styles.rotate + styles.rotate) % 360
      layer.shown = false
    })

    return layers
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
