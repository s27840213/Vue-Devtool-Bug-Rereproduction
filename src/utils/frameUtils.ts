import LayerUtils from './layerUtils'
import ImageUtils from './imageUtils'
import store from '@/store'
import { SrcObj } from '@/interfaces/gallery'
import { IFrame } from '@/interfaces/layer'
import layerFactary from './layerFactary'
import generalUtils from './generalUtils'
class FrameUtils {
  isImageFrame(config: IFrame): boolean {
    return config.clips.length === 1 && (config.clips[0].isFrameImg as boolean)
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

  detachImage(layerIndex: number) {
    const currLayer = LayerUtils.getLayer(LayerUtils.pageIndex, layerIndex) as IFrame
    let idx = currLayer.clips.length === 1 && currLayer.clips[0].srcObj.type !== 'frame' ? 0 : -1
    if (idx === -1) {
      if (layerIndex !== LayerUtils.layerIndex) {
        return
      } else {
        idx = currLayer.clips.findIndex(img => img.active && img.srcObj.type !== 'frame')
      }
    }
    if (idx !== -1) {
      const clips = generalUtils.deepCopy(currLayer.clips)
      const srcObj = {
        ...clips[idx].srcObj
      }
      clips[idx].srcObj = {
        type: 'frame',
        userId: '',
        assetId: ''
      }
      const { imgWidth, imgHeight, width, height } = clips[idx].styles
      LayerUtils.addLayers(LayerUtils.pageIndex, [layerFactary.newImage({
        srcObj,
        styles: {
          x: currLayer.styles.x + (clips[idx].styles.x + width / 4) * currLayer.styles.scale,
          y: currLayer.styles.y + (clips[idx].styles.y + height / 4) * currLayer.styles.scale,
          width: imgWidth * currLayer.styles.scale,
          height: imgHeight * currLayer.styles.scale
        }
      })])
      Object.assign(clips[idx].styles, {
        imgWidth: currLayer.styles.initWidth,
        imgHeight: currLayer.styles.initHeight,
        imgX: 0,
        imgY: 0
      })
      LayerUtils.updateLayerProps(LayerUtils.pageIndex, layerIndex, { clips })
    }
    store.commit('SET_popupComponent', { layerIndex: -1 })
  }

  updateFrameLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: { [key: string]: number }) {
    store.commit('SET_frameLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }

  updateFrameLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: { [index: string]: number | string | boolean | SrcObj }) {
    store.commit('UPDATE_frameLayerProps', {
      pageIndex,
      layerIndex,
      targetIndex,
      props
    })
  }

  updateSubFrameLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: { [key: string]: number }) {
    store.commit('SET_subFrameLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }
}

export default new FrameUtils()
