import store from '@/store'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import LayerFactary from '@/utils/layerFactary'
import MappingUtils from '@/utils/mappingUtils'
import MathUtils from '@/utils/mathUtils'
import ZindexUtils from '@/utils/zindexUtils'
import GeneralUtils from '@/utils/generalUtils'
import LayerUtils from '@/utils/layerUtils'

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
      const layerBouding = MathUtils.getBounding(layer)
      minX = Math.min(minX, layerBouding.x)
      minY = Math.min(minY, layerBouding.y)
    }
  })

  layers.forEach((layer: IShape | IText | IImage | IGroup) => {
    if (layer.styles.rotate === 0) {
      maxWidth = Math.max(maxWidth, layer.styles.x + (layer.styles.width as number) - minX)
      maxHeight = Math.max(maxHeight, layer.styles.y + (layer.styles.height as number) - minY)
    } else {
      const layerBouding = MathUtils.getBounding(layer)
      maxWidth = Math.max(maxWidth, layerBouding.x + (layerBouding.width as number) - minX)
      maxHeight = Math.max(maxHeight, layerBouding.y + (layerBouding.height as number) - minY)
    }
  })

  return {
    x: minX,
    y: minY,
    width: maxWidth,
    height: maxHeight,
    initWidth: maxWidth,
    initHeight: maxHeight
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

function getTmpLayer() {
  return store.getters.getLayer(store.getters.getLastSelectedPageIndex, store.getters.getCurrSelectedIndex)
}
class GroupUtils {
  group() {
    if (store.getters.getCurrSelectedLayers.length < 2) {
      console.log('You need to select at least 2 layers!')
      return
    }
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const currSelectedIndex = store.getters.getCurrSelectedIndex
    LayerUtils.updateLayerProps(lastSelectedPageIndex, currSelectedIndex, {
      type: 'group',
      active: false,
      shown: false
    })
    this.reset()
    this.select([currSelectedIndex])
  }

  ungroup() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const currSelectedIndex = store.getters.getCurrSelectedIndex
    const targetLayer = store.getters.getLayer(lastSelectedPageIndex, store.getters.getCurrSelectedIndex)
    if (targetLayer.type === 'group') {
      console.log(currSelectedIndex)
      targetLayer.layers.forEach((layer: IGroup) => {
        layer.styles.zindex = targetLayer.styles.zindex
      })
      const tmpLayer = GeneralUtils.deepCopy(targetLayer)
      LayerUtils.updateLayerProps(lastSelectedPageIndex, currSelectedIndex, {
        type: 'tmp',
        active: true
      })
      LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedIndex, {
        zindex: -1
      })
      this.reset()
      this.set(currSelectedIndex, tmpLayer.layers)
    }
  }

  select(layerIndexs: Array<number>) {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    // currSelectedIndex is smaller than 0 means there isn't any selected layer
    if (store.getters.getCurrSelectedIndex < 0) {
      // When we only select one layer
      if (layerIndexs.length === 1) {
        LayerUtils.updateLayerProps(lastSelectedPageIndex, layerIndexs[0], {
          active: true
        })
        const currSelectedLayers = [...MappingUtils.mappingLayers(layerIndexs)]
        this.set(layerIndexs[0], currSelectedLayers)
      } else {
        // when we select multiple layer
        const layers = MappingUtils.mappingLayers(layerIndexs)
        const tmpStyles = calcTmpProps(layers)
        const currSelectedLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...layerIndexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        this.set(currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !layerIndexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(lastSelectedPageIndex, [tmp], currSelectedIndex)
      }
    } else { // when we already have selected layers
      if (store.getters.getCurrSelectedLayers.length === 1) {
        const indexs = [store.getters.getCurrSelectedIndex, ...layerIndexs]
        this.deselect()
        const layers = MappingUtils.mappingLayers(indexs)
        const tmpStyles = calcTmpProps(layers)
        const currSelectedLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...indexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        this.set(currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(lastSelectedPageIndex, [tmp], currSelectedIndex)
      } else {
        const layers = MappingUtils.mappingLayers(layerIndexs)
        const tmpLayer = getTmpLayer()
        const tmpStyles = calcTmpProps([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, getTmpLayer()), ...layers])
        const currSelectedLayers = this.mapLayersToTmp([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpLayer), ...layers], tmpStyles)
        const topIndex = Math.max(store.getters.getCurrSelectedIndex, ...layerIndexs)
        const newLayersNum = 1 + layerIndexs.length
        const indexs = [store.getters.getCurrSelectedIndex, ...layerIndexs]
        const currSelectedIndex = topIndex - newLayersNum + 1
        this.set(currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(lastSelectedPageIndex, [tmp], currSelectedIndex)
      }
    }
  }

  deselect() {
    const currSelectedIndex = store.getters.getCurrSelectedIndex
    if (currSelectedIndex !== -1) {
      const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
      if (store.getters.getCurrSelectedLayers.length === 1) {
        LayerUtils.updateLayerProps(lastSelectedPageIndex, currSelectedIndex, {
          active: false
        })
      } else {
        const tmpLayer = getTmpLayer()
        LayerUtils.deleteSelectedLayer()
        LayerUtils.addLayersToPos(lastSelectedPageIndex, [...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpLayer)], store.getters.getCurrSelectedIndex)
        LayerUtils.updateLayersOrder(lastSelectedPageIndex)
      }
      this.reset()
      ZindexUtils.reassignZindex(lastSelectedPageIndex)
    }
  }

  reselect() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const selectedIndexs = currSelectedInfo.layers.map((layer: IShape | IText | IImage | IGroup, index: number) => {
      return layer.styles.zindex - 1
    })
    this.deselect()
    this.select([...selectedIndexs])
  }

  reset() {
    store.commit('SET_currSelectedInfo', {
      index: -1,
      layers: [],
      types: new Set<string>()
    })
  }

  set(currSelectedIndex: number, currSelectedLayers: Array<IShape | IText | IImage | IGroup>) {
    store.commit('SET_currSelectedInfo', {
      index: currSelectedIndex,
      layers: currSelectedLayers,
      types: calcType(currSelectedLayers)
    })
  }

  movingTmp(pageIndex: number, styles: { [index: string]: number }) {
    store.commit('UPDATE_tmpLayerStyles', {
      pageIndex: pageIndex,
      styles
    })
  }

  mapLayersToTmp(layers: Array<IShape | IText | IImage | IGroup>, styles: ICalculatedGroupStyle): Array<IShape | IText | IImage | IGroup> {
    layers = GeneralUtils.deepCopy(layers.sort((a, b) => a.styles.zindex - b.styles.zindex))

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
  mapLayersToPage(layers: Array<IShape | IText | IImage | IGroup>, tmpLayer: ITmp): Array<IShape | IText | IImage | IGroup> {
    layers = JSON.parse(JSON.stringify(layers))
    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      // calculate scale offset
      layer.styles.width = layer.styles.width as number * tmpLayer.styles.scale
      layer.styles.height = layer.styles.height as number * tmpLayer.styles.scale
      layer.styles.scale *= tmpLayer.styles.scale

      // calculate the center shift of scaled image
      if (layer.styles.scale !== 1) {
        const ratio = tmpLayer.styles.width / tmpLayer.styles.initWidth
        const [x1, y1] = [layer.styles.x, layer.styles.y]
        const [shiftX, shiftY] = [x1 * ratio, y1 * ratio]
        layer.styles.x = shiftX
        layer.styles.y = shiftY
      }

      // map to original coordinate system
      layer.styles.x += tmpLayer.styles.x
      layer.styles.y += tmpLayer.styles.y

      // calculate rotation offset
      const centerOffset = MathUtils.getRotatedPoint(tmpLayer.styles.rotate, MathUtils.getCenter(tmpLayer.styles), MathUtils.getCenter(layer.styles))
      layer.styles.x = centerOffset.x - (layer.styles.width as number) / 2
      layer.styles.y = centerOffset.y - (layer.styles.height as number) / 2
      layer.styles.rotate = (layer.styles.rotate + tmpLayer.styles.rotate) % 360
      layer.shown = false
      layer.locked = tmpLayer.locked
    })

    return layers
  }

  // When doing alignment, we need to change the bouding of tmp layers
  recalcTmpStyle(layers: Array<IShape | IText | IImage | IGroup>) {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const tmpLayer = getTmpLayer()
    const tmpStyles = calcTmpProps(this.mapLayersToPage(layers, tmpLayer))
    const currSelectedLayers = this.mapLayersToTmp(this.mapLayersToPage(layers, tmpLayer), tmpStyles)
    const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)

    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    LayerUtils.updateLayerStyles(lastSelectedPageIndex, currSelectedInfo.index, tmp.styles)
    store.commit('UPDATE_layersInTmp', {
      layers: currSelectedLayers
    })
    this.set(currSelectedInfo.index, currSelectedLayers)
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
