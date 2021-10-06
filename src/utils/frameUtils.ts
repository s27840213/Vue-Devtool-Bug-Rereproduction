import LayerUtils from './layerUtils'
import ImageUtils from './imageUtils'
import store from '@/store'
import { SrcObj } from '@/interfaces/gallery'
import { IFrame } from '@/interfaces/layer'
class FrameUtils {
  isImageFrame(config: IFrame): boolean {
    return config.clips.length === 1 && (config.clips[0].isFrameImage as boolean)
  }

  frameClipFormatter(path: string) {
    return "<path d='" + path + "'></path>"
  }

  frameResizeHandler(width: number, height: number, offsetWidth: number, offsetHeight: number) {
    const updateFrameLayer = () => {
      const clipPath = `M0,0h${width}v${height}h${-width}z`
      this.updateFrameLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, 0, { clipPath })
      LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { initWidth: width, initHeight: height })
    }

    ImageUtils.imgResizeHandler(width, height, offsetWidth, offsetHeight,
      (imgX: number, imgY: number) => {
        this.updateFrameLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, 0, { imgX, imgY })
        updateFrameLayer()
      },
      (imgWidth: number, imgHeight: number) => {
        this.updateFrameLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, 0, {
          imgWidth,
          imgHeight,
          width,
          height
        })
        updateFrameLayer()
      }
    )
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
