import { IGroup, IImage, ILayer, IShape, ITmp } from '@/interfaces/layer'
import store from '@/store'

class ZindexUtils {
  reassignZindex(pageIndex: number) {
    const layers = store.getters.getLayers(pageIndex)
    console.log('reassign z-index')
    layers.forEach((layer: ILayer | IImage | ITmp | IGroup | IShape, index: number) => {
      if (layer.type === 'tmp' && (layer as ITmp).layers.length > 1) {
        store.commit('UPDATE_tmpLayersZindex')
        return
      }
      store.commit('UPDATE_layerStyles', {
        pageIndex: pageIndex,
        layerIndex: index,
        styles: {
          zindex: index + 1
        }
      })
    })
  }
}

const zindexUtils = new ZindexUtils()

export default zindexUtils
