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
    console.log('Group!!!')
    if (this.tmpLayers.length < 2) {
      console.log('You need to selecte at least 2 layers!')
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
    if (this.tmpLayers.length !== 1 || this.tmpLayers[0].type !== 'group') {
      return
    }
    const tmpIndex = this.tmpIndex
    this.deselect()
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex

    store.commit('Update_layerProps', {
      pageIndex: lastSelectedPageIndex,
      layerIndex: tmpIndex,
      props: {
        type: 'tmp',
        active: true
      }
    })
    const tmpLayer = GeneralUtils.deepCopy(store.getters.getLayer(lastSelectedPageIndex, tmpIndex))
    console.log(tmpLayer)
    this.set(tmpIndex, tmpLayer.styles, tmpLayer.layers)
  }

  select(layerIndexs: Array<number>) {
    // const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex

    if (this.tmpIndex < 0) {
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

    console.log(`select ${this.tmpIndex}`)
  }

  deselect() {
    if (this.tmpIndex !== -1) {
      const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
      console.log(this.tmpIndex)
      store.commit('DELETE_layer', {
        pageIndex: lastSelectedPageIndex,
        layerIndex: this.tmpIndex
      })
      store.commit('ADD_layersToPos', {
        pageIndex: lastSelectedPageIndex,
        layers: [...this.mapLayersToPage(this.tmpLayers, this.tmpStyles)],
        pos: this.tmpIndex
      })
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
