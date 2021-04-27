import store from '@/store'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'
import { ICalculatedGroupStyle } from '@/interfaces/group'
import LayerFactary from '@/utils/layerFactary'

class GroupUtils {
  calcGroupProps() {
    let minX = Number.MAX_SAFE_INTEGER
    let minY = Number.MAX_SAFE_INTEGER
    let maxWidth = Number.MIN_SAFE_INTEGER
    let maxHeight = Number.MIN_SAFE_INTEGER
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const layers = JSON.parse(JSON.stringify(currSelectedInfo.layers))

    if (layers.length < 2) {
      console.warn('There is less than 2 element!')
      return null
    }
    /**
     * Calculate x, y, width, and height of group
     */
    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      minX = Math.min(minX, layer.styles.x)
      minY = Math.min(minY, layer.styles.y)
    })

    layers.forEach((layer: IShape | IText | IImage | IGroup) => {
      maxWidth = Math.max(maxWidth, (layer.styles.x + (layer.styles.width as number) - minX))
      maxHeight = Math.max(maxHeight, layer.styles.y + (layer.styles.height as number) - minY)

      layer.styles.x -= minX
      layer.styles.y -= minY
    })

    return {
      x: minX,
      y: minY,
      width: maxWidth,
      height: maxHeight,
      layers: layers
    } as ICalculatedGroupStyle
  }

  appendGroup() {
    const groupStyles = this.calcGroupProps()
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const lastSelectedPageIndex = store.getters.getLastSelectedPageIndex
    const topIndex = Math.max(...currSelectedInfo.layersIndex)
    const groupNum = currSelectedInfo.layers.length
    const newLayers = store.getters.getLayers(lastSelectedPageIndex).filter((el: IShape | IText | IImage | IGroup, index: number) => {
      return !currSelectedInfo.layersIndex.includes(index)
    })

    if (groupStyles !== null) {
      const layer = LayerFactary.newGroup(groupStyles, lastSelectedPageIndex)
      store.commit('CLEAR_currSelectedInfo')
      store.commit('SET_layers', { pageIndex: lastSelectedPageIndex, newLayers })
      store.commit('ADD_layerToPos', {
        pageIndex: lastSelectedPageIndex,
        layer: layer,
        pos: topIndex - groupNum + 1
      })
      store.commit('ADD_selectedLayer', {
        pageIndex: lastSelectedPageIndex,
        layerIndexs: [(topIndex - groupNum + 1)]
      })
    }
  }
}

const groupUtils = new GroupUtils()
export default groupUtils
