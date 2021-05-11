import store from '@/store'
import { IShape, IText, IImage, IGroup, IStyle, ITextStyle, IGroupStyle, ITmpStyle } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import LayerFactary from '@/utils/layerFactary'
import MappingUtils from '@/utils/mappingUtils'
import GeneralUtils from '@/utils/generalUtils'
import MathUtils from '@/utils/mathUtils'

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
      console.log(layerBouding)
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
      console.log(layerBouding)
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

function getTmpStyles(tmpIndex: number) {
  const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
  return store.getters.getLayer(lastSelectedPageIndex, tmpIndex).styles
}
class GroupUtils {
  /**
   * @param {Array<IShape | IText | IImage | IGroup>} tmpLayers - all selected layers
   *    In the current way, if we only select one layer, we won't push the layer into tmpLayers to create Nu-tmp component.
   *    The reason is that if we push the layer into tmpLayers and render Nu-tmp, we can't trigger the function binding on other components like Nu-image, Nu-tmp, Nu-group
   *    Thus, we just update the tmpIndex and then tmpLayers remains empty, and select the layer with that index instead of creating an Nu-tmp and select it.
   *    I think this approach is not good enough. Probably I will refactor this structure in the future.
   *

   * @param {number} tmpIndex - selected index of layer,
   *    It isn't an array of index becauce we just have two options now:
   *        1. select tmp layer which contain all selected layers(tmpLayers)
   *        2. only select one layer(image, text, group, shape layer)
   */

  /**
   * Condition:
   *    1. tmpIndex < 0 -> there isn't any selected layer
   *    2. tmpIndex >= 0  && tmpLayers.length === 0 -> only select one layer
   *    3. tmpIndex >=0 && tmpLayers.length > 0 -> select more than one layer
   */

  tmpLayers: Array<IShape | IText | IImage | IGroup>
  // tmpStyles: ICalculatedGroupStyle
  tmpIndex: number
  constructor() {
    this.tmpLayers = []
    this.tmpIndex = -1
  }

  group() {
    if (this.tmpLayers.length < 2) {
      console.log('You need to select at least 2 layers!')
      return
    }
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    store.commit('Update_layerProps', {
      pageIndex: lastSelectedPageIndex,
      layerIndex: this.tmpIndex,
      props: {
        type: 'group',
        active: false
      }
    })
    const tmpIndex = this.tmpIndex
    this.reset()
    this.select([tmpIndex])
  }

  ungroup() {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    if (store.getters.getLayer(lastSelectedPageIndex, this.tmpIndex).type === 'group') {
      const tmpIndex = this.tmpIndex
      this.deselect()

      const tmpLayer = GeneralUtils.deepCopy(store.getters.getLayer(lastSelectedPageIndex, tmpIndex))
      this.set(tmpIndex, tmpLayer.layers)
    }
  }

  select(layerIndexs: Array<number>) {
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    // tmpIndex is smaller than 0 means there isn't any selected layer
    if (this.tmpIndex < 0) {
      if (layerIndexs.length === 1) {
        this.tmpIndex = layerIndexs[0]
        store.commit('Update_layerProps', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: this.tmpIndex,
          props: {
            active: true
          }
        })
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
      if (this.tmpLayers.length === 0) {
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
  }

  deselect() {
    if (this.tmpIndex !== -1) {
      const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
      if (this.tmpLayers.length === 0) {
        store.commit('Update_layerProps', {
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
    }
  }

  reset() {
    this.tmpIndex = -1
    this.tmpLayers = []
  }

  set(tmpIndex: number, tmpLayers: Array<IShape | IText | IImage | IGroup>) {
    this.tmpIndex = tmpIndex
    this.tmpLayers = tmpLayers
  }

  movingTmp(pageIndex: number, styles: any) {
    store.commit('Update_tmpLayerStyles', {
      pageIndex: pageIndex,
      styles
    })
  }

  mapLayersToTmp(layers: Array<IShape | IText | IImage | IGroup>, styles: ICalculatedGroupStyle): Array<IShape | IText | IImage | IGroup> {
    layers = JSON.parse(JSON.stringify(layers))

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
  mapLayersToPage(layers: Array<IShape | IText | IImage | IGroup>, styles: IGroupStyle | ITmpStyle): Array<IShape | IText | IImage | IGroup> {
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
