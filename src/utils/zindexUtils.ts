import { IGroup, IImage, ILayer, IShape, ITmp } from '@/interfaces/layer'
import store from '@/store'

class ZindexUtils {
  reassignZindex(pageIndex: number) {
    const layers = store.getters.getLayers(pageIndex)
    layers.forEach((layer: ILayer | IImage | ITmp | IGroup | IShape, index: number) => {
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
