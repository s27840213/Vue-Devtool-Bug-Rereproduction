import LayerUtils from '@/utils/layerUtils'
import store from '@/store'
import { SrcObj } from '@/interfaces/gallery'

class FrameUtils {
  frameClipFormatter(path: string) {
    return "<path d='" + path + "'></path>"
  }

  updateFrameLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: { [key: string]: number }) {
    store.commit('SET_frameLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }

  updateFrameLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: { [index: string]: number | string | boolean } | SrcObj) {
    store.commit('UPDATE_frameLayerProps', {
      pageIndex,
      layerIndex,
      targetIndex,
      props
    })
  }
}

export default new FrameUtils()
