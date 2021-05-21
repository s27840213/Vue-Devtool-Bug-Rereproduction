import store from '@/store'
import { IShape, IText, IImage, IGroup, IStyle, ITextStyle } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import LayerFactary from '@/utils/layerFactary'
import MappingUtils from '@/utils/mappingUtils'
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

function getTmpStyles() {
  return store.getters.getLayer(store.getters.getLastSelectedPageIndex, store.getters.getCurrSelectedIndex).styles
}
class GroupUtils {
  group() {
    if (store.getters.getCurrSelectedLayers.length < 2) {
      console.log('You need to select at least 2 layers!')
      return
    }
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    store.commit('UPDATE_layerProps', {
      pageIndex: lastSelectedPageIndex,
      layerIndex: store.getters.getCurrSelectedIndex,
      props: {
        type: 'group',
        active: false,
        shown: false
      }
    })
    const currSelectedIndex = store.getters.getCurrSelectedIndex
    this.reset()
    this.select([currSelectedIndex])
  }

  ungroup() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const targetLayer = store.getters.getLayer(lastSelectedPageIndex, store.getters.getCurrSelectedIndex)
    if (targetLayer.type === 'group') {
      targetLayer.layers.forEach((layer: IGroup) => {
        layer.styles.zindex = targetLayer.styles.zindex
      })
      const tmpLayer = targetLayer
      store.commit('UPDATE_layerProps', {
        pageIndex: lastSelectedPageIndex,
        layerIndex: store.getters.getCurrSelectedIndex,
        props: {
          type: 'tmp',
          active: true
        }
      })
      store.commit('UPDATE_layerStyles', {
        pageIndex: lastSelectedPageIndex,
        layerIndex: store.getters.getCurrSelectedIndex,
        styles: {
          zindex: -1
        }
      })
      const currSelectedIndex = store.getters.getCurrSelectedIndex
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
        store.commit('UPDATE_layerProps', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: layerIndexs[0],
          props: {
            active: true
          }
        })
        const tmpLayers = [...MappingUtils.mappingLayers(layerIndexs)]
        store.commit('SET_currSelectedInfo', {
          index: layerIndexs[0],
          layers: tmpLayers,
          types: calcType(tmpLayers)
        })
      } else {
        // when we select multiple layer
        const layers = MappingUtils.mappingLayers(layerIndexs)
        const tmpStyles = calcTmpProps(layers)
        const tmpLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...layerIndexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        store.commit('SET_currSelectedInfo', {
          index: currSelectedIndex,
          layers: tmpLayers,
          types: calcType(tmpLayers)
        })
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !layerIndexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, tmpStyles, tmpLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [tmp],
          pos: currSelectedIndex
        })
      }
    } else { // when we already have selected layers
      if (store.getters.getCurrSelectedLayers.length === 1) {
        const indexs = [store.getters.getCurrSelectedIndex, ...layerIndexs]
        this.deselect()
        const layers = MappingUtils.mappingLayers(indexs)
        const tmpStyles = calcTmpProps(layers)
        const tmpLayers = this.mapLayersToTmp(layers, tmpStyles)
        const topIndex = Math.max(...indexs)
        const newLayersNum = layers.length
        const currSelectedIndex = topIndex - newLayersNum + 1
        store.commit('SET_currSelectedInfo', {
          index: currSelectedIndex,
          layers: tmpLayers,
          types: calcType(tmpLayers)
        })
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, tmpStyles, tmpLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [tmp],
          pos: currSelectedIndex
        })
      } else {
        const layers = MappingUtils.mappingLayers(layerIndexs)
        const prevTmpStyles = getTmpStyles()
        const tmpStyles = calcTmpProps([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, getTmpStyles()), ...layers])
        const tmpLayers = this.mapLayersToTmp([...this.mapLayersToPage(store.getters.getCurrSelectedLayers, prevTmpStyles), ...layers], tmpStyles)
        const topIndex = Math.max(store.getters.getCurrSelectedIndex, ...layerIndexs)
        const newLayersNum = 1 + layerIndexs.length
        const indexs = [store.getters.getCurrSelectedIndex, ...layerIndexs]
        const currSelectedIndex = topIndex - newLayersNum + 1
        store.commit('SET_currSelectedInfo', {
          index: currSelectedIndex,
          layers: tmpLayers,
          types: calcType(tmpLayers)
        })
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, tmpStyles, tmpLayers)
        store.commit('SET_layers', {
          pageIndex: lastSelectedPageIndex,
          newLayers
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [tmp],
          pos: currSelectedIndex
        })
      }
    }
  }

  deselect() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (store.getters.getCurrSelectedIndex !== -1) {
      if (store.getters.getCurrSelectedLayers.length === 1) {
        console.log('1')
        store.commit('UPDATE_layerProps', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: store.getters.getCurrSelectedIndex,
          props: {
            active: false
          }
        })
      } else {
        console.log(store.getters.getCurrSelectedLayers.length)
        const tmpStyles = getTmpStyles()
        store.commit('DELETE_layer', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: store.getters.getCurrSelectedIndex
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [...this.mapLayersToPage(store.getters.getCurrSelectedLayers, tmpStyles)],
          pos: store.getters.getCurrSelectedIndex
        })
      }
      this.reset()
      store.commit('UPDATE_layerOrders', {
        pageIndex: lastSelectedPageIndex
      })
      ZindexUtils.reassignZindex(lastSelectedPageIndex)
    }
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

  recalcTmpStyle(layers: Array<IShape | IText | IImage | IGroup>) {
    console.log(layers)
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const prevTmpStyles = getTmpStyles()
    const tmpStyles = calcTmpProps(this.mapLayersToPage(layers, prevTmpStyles))
    const tmpLayers = this.mapLayersToTmp(this.mapLayersToPage(layers, prevTmpStyles), tmpStyles)
    console.log(tmpLayers)

    store.commit('SET_currSelectedInfo', {
      index: currSelectedInfo.index,
      layers: tmpLayers,
      types: calcType(tmpLayers)
    })

    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    store.commit('UPDATE_layerStyles', {
      pageIndex: lastSelectedPageIndex,
      layerIndex: currSelectedInfo.index,
      styles: tmpStyles
    })
    store.commit('UPDATE_layersInTmp', {
      layers: tmpLayers
    })
    this.set(currSelectedInfo.index, tmpLayers)
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
