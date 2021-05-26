import { IGroup, IImage, ILayer, IShape, ITmp } from '@/interfaces/layer'
import store from '@/store'
import LayerUtils from '@/utils/layerUtils'

class ZindexUtils {
  reassignZindex(pageIndex: number) {
    const layers = store.getters.getLayers(pageIndex)
    layers.forEach((layer: ILayer | IImage | ITmp | IGroup | IShape, index: number) => {
      if (layer.type === 'tmp' && (layer as ITmp).layers.length > 1) {
        store.commit('UPDATE_tmpLayersZindex')
        return
      }
      LayerUtils.updateLayersStyles(pageIndex, index, {
        zindex: index + 1
      })
    })
  }
}

const zindexUtils = new ZindexUtils()

export default zindexUtils
