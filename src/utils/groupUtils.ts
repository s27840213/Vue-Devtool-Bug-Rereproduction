import store from '@/store'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import LayerFactary from '@/utils/layerFactary'
import MappingUtils from '@/utils/mappingUtils'
import GeneralUtils from '@/utils/generalUtils'

function calcTmpProps(layers: Array<IShape | IText | IImage | IGroup>): ICalculatedGroupStyle {
  let minX = Number.MAX_SAFE_INTEGER
  let minY = Number.MAX_SAFE_INTEGER
  let maxWidth = Number.MIN_SAFE_INTEGER
  let maxHeight = Number.MIN_SAFE_INTEGER
  layers = JSON.parse(JSON.stringify(layers))

  layers.forEach((layer: IShape | IText | IImage | IGroup) => {
    minX = Math.min(minX, layer.styles.x)
    minY = Math.min(minY, layer.styles.y)
  })

  layers.forEach((layer: IShape | IText | IImage | IGroup) => {
    maxWidth = Math.max(maxWidth, (layer.styles.x + (layer.styles.width as number) - minX))
    maxHeight = Math.max(maxHeight, layer.styles.y + (layer.styles.height as number) - minY)
  })

  return {
    x: minX,
    y: minY,
    width: maxWidth,
    height: maxHeight
  } as ICalculatedGroupStyle
}

class GroupUtils {
  tmpLayers: Array<IShape | IText | IImage | IGroup>
  tmpStyles: ICalculatedGroupStyle
  tmpIndex: number
  constructor() {
    this.tmpLayers = []
    this.tmpStyles = {
      x: -1,
      y: -1,
      width: -1,
      height: -1
    }
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
      this.set(tmpIndex, tmpLayer.styles, tmpLayer.layers)
    }
  }

  select(layerIndexs: Array<number>) {
    // const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex

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
        this.tmpStyles = calcTmpProps(layers)
        this.tmpLayers = this.mapLayersToTmp(layers, this.tmpStyles)
        const topIndex = Math.max(...layerIndexs)
        const newLayersNum = layers.length
        this.tmpIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !layerIndexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, this.tmpStyles, this.tmpLayers)
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
        const layers = MappingUtils.mappingLayers(indexs)
        this.tmpStyles = calcTmpProps(layers)
        this.tmpLayers = this.mapLayersToTmp(layers, this.tmpStyles)
        const topIndex = Math.max(...indexs)
        const newLayersNum = layers.length
        this.tmpIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, this.tmpStyles, this.tmpLayers)
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
        const prevTmpStyles = this.tmpStyles
        this.tmpStyles = calcTmpProps([...this.mapLayersToPage(this.tmpLayers, this.tmpStyles), ...layers])
        this.tmpLayers = this.mapLayersToTmp([...this.mapLayersToPage(this.tmpLayers, prevTmpStyles), ...layers], this.tmpStyles)
        const topIndex = Math.max(this.tmpIndex, ...layerIndexs)
        const newLayersNum = 1 + layerIndexs.length
        const indexs = [this.tmpIndex, ...layerIndexs]
        this.tmpIndex = topIndex - newLayersNum + 1
        const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
          return !indexs.includes(index)
        })
        const tmp = LayerFactary.newTmp(lastSelectedPageIndex, this.tmpStyles, this.tmpLayers)
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
        store.commit('DELETE_layer', {
          pageIndex: lastSelectedPageIndex,
          layerIndex: this.tmpIndex
        })
        store.commit('ADD_layersToPos', {
          pageIndex: lastSelectedPageIndex,
          layers: [...this.mapLayersToPage(this.tmpLayers, this.tmpStyles)],
          pos: this.tmpIndex
        })
      }
      this.reset()
    }
  }

  reset() {
    this.tmpIndex = -1
    this.tmpLayers = []
    this.tmpStyles = {
      x: -1,
      y: -1,
      width: -1,
      height: -1
    }
  }

  set(tmpIndex: number, tmpStyles: ICalculatedGroupStyle, tmpLayers: Array<IShape | IText | IImage | IGroup>) {
    this.tmpIndex = tmpIndex
    this.tmpStyles = tmpStyles
    this.tmpLayers = tmpLayers
  }

  movingTmp(pageIndex: number, styles: any) {
    store.commit('Update_tmpLayerStyles', {
      pageIndex: pageIndex,
      styles
    })

    this.tmpStyles = store.getters.getLayer(pageIndex, this.tmpIndex).styles
  }

  mapLayersToTmp(layers: Array<IShape | IText | IImage | IGroup>, styles: ICalculatedGroupStyle): Array<IShape | IText | IImage | IGroup> {
    layers = JSON.parse(JSON.stringify(layers))

    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      layer.styles.x -= styles.x
      layer.styles.y -= styles.y
    })

    return layers
  }

  mapLayersToPage(layers: Array<IShape | IText | IImage | IGroup>, styles: ICalculatedGroupStyle): Array<IShape | IText | IImage | IGroup> {
    layers = JSON.parse(JSON.stringify(layers))
    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      layer.styles.x += styles.x
      layer.styles.y += styles.y
      layer.shown = false
    })

    return layers
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
