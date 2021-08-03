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
  return store.getters.getLayer(store.getters.getCurrSelectedPageIndex, store.getters.getCurrSelectedIndex)
}
class GroupUtils {
  group() {
    const currSelectedInfo = GeneralUtils.deepCopy(store.getters.getCurrSelectedInfo)
    if (currSelectedInfo.layers.length < 2) {
      console.log('You need to select at least 2 layers!')
      return
    }
    const tmpPageIndex = currSelectedInfo.pageIndex
    const tmpIndex = currSelectedInfo.index
    LayerUtils.updateLayerProps(tmpPageIndex, tmpIndex, {
      type: 'group',
      active: false,
      shown: false
    })

    this.reset()
    this.select(tmpPageIndex, [tmpIndex])
    ZindexUtils.reassignZindex(tmpPageIndex)
  }

  ungroup() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(currSelectedInfo.pageIndex, currSelectedInfo.index)
    if (targetLayer.type === 'group') {
      targetLayer.layers.forEach((layer: IGroup, index: number) => {
        layer.styles.zindex = targetLayer.styles.zindex + index
      })
      const tmpLayer = GeneralUtils.deepCopy(targetLayer)
      LayerUtils.updateLayerProps(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        type: 'tmp',
        active: true
      })
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, {
        zindex: -1
      })
      const tmpPageIndex = currSelectedInfo.pageIndex
      const tmpIndex = currSelectedInfo.index
      this.reset()
      this.set(tmpPageIndex, tmpIndex, tmpLayer.layers)
    }
  }

  select(pageIndex: number, layerIndexs: Array<number>) {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    // currSelectedIndex is smaller than 0 means there isn't any selected layer
    if (currSelectedInfo.index < 0) {
      // When we only select one layer
      if (layerIndexs.length === 1) {
        LayerUtils.updateLayerProps(pageIndex, layerIndexs[0], {
          active: true
        })
        const currSelectedLayers = [...MappingUtils.mappingLayers(pageIndex, layerIndexs)]
        this.set(pageIndex, layerIndexs[0], currSelectedLayers)
      } else {
        // when we select multiple layer
        const layers = MappingUtils.mappingLayers(pageIndex, layerIndexs)
        const tmpStyles = calcTmpProps(layers)
        const currSelectedLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...layerIndexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        this.set(pageIndex, currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(pageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !layerIndexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: pageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(pageIndex, [tmp], currSelectedIndex)
      }
    } else { // when we already have selected layers
      if (store.getters.getCurrSelectedLayers.length === 1) {
        const indexs = [currSelectedInfo.index, ...layerIndexs]
        this.deselect()
        const layers = MappingUtils.mappingLayers(pageIndex, indexs)
        const tmpStyles = calcTmpProps(layers)
        const currSelectedLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...indexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        this.set(pageIndex, currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(pageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: pageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(pageIndex, [tmp], currSelectedIndex)
      } else {
        const layers = MappingUtils.mappingLayers(pageIndex, layerIndexs)
        const tmpLayer = getTmpLayer()
        const tmpStyles = calcTmpProps([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, getTmpLayer()), ...layers])
        const currSelectedLayers = this.mapLayersToTmp([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpLayer), ...layers], tmpStyles)
        const topIndex = Math.max(currSelectedInfo.index, ...layerIndexs)
        const newLayersNum = 1 + layerIndexs.length
        const indexs = [currSelectedInfo.index, ...layerIndexs]
        const currSelectedIndex = topIndex - newLayersNum + 1
        this.set(pageIndex, currSelectedIndex, currSelectedLayers)
        const newLayers = store.getters.getLayers(pageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(tmpStyles, currSelectedLayers)
        store.commit('SET_layers', {
          pageIndex: pageIndex,
          newLayers
        })
        LayerUtils.addLayersToPos(pageIndex, [tmp], currSelectedIndex)
      }
    }
  }

  selectAll() {
    this.deselect()
    this.select(store.getters.getLastSelectedPageIndex, [...Array(store.getters.getLayersNum(store.getters.getLastSelectedPageIndex)).keys()])
  }

  deselect() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const tmpPageIndex = currSelectedInfo.pageIndex
    if (currSelectedInfo.index !== -1) {
      if (store.getters.getCurrSelectedLayers.length === 1) {
        LayerUtils.updateLayerProps(currSelectedInfo.pageIndex, currSelectedInfo.index, {
          active: false
        })
      } else {
        const tmpLayer = getTmpLayer()
        LayerUtils.deleteSelectedLayer()
        LayerUtils.addLayersToPos(currSelectedInfo.pageIndex, [...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpLayer)], store.getters.getCurrSelectedIndex)
        LayerUtils.updateLayersOrder(currSelectedInfo.pageIndex)
      }
      this.reset()
      ZindexUtils.reassignZindex(tmpPageIndex)
    }
  }

  reselect() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const selectedIndexs = currSelectedInfo.layers.map((layer: IShape | IText | IImage | IGroup, index: number) => {
      return layer.styles.zindex - 1
    })
    const tmpPageIndex = currSelectedInfo.pageIndex
    this.deselect()
    this.select(tmpPageIndex, [...selectedIndexs])
  }

  reset() {
    store.commit('SET_currSelectedInfo', {
      pageIndex: -1,
      index: -1,
      layers: [],
      types: new Set<string>()
    })
  }

  set(currSelectedPageIndex: number, currSelectedIndex: number, currSelectedLayers: Array<IShape | IText | IImage | IGroup>) {
    store.commit('SET_currSelectedInfo', {
      pageIndex: currSelectedPageIndex,
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
      layer.moved = tmpLayer.moved
    })

    return layers
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
