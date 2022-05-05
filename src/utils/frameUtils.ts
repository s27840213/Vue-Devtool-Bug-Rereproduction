import LayerUtils from './layerUtils'
import ImageUtils from './imageUtils'
import store from '@/store'
import { SrcObj } from '@/interfaces/gallery'
import { IFrame, IImage, IImageStyle } from '@/interfaces/layer'
import layerFactary from './layerFactary'
import generalUtils from './generalUtils'
import { IAdjustJsonProps } from '@/interfaces/adjust'
import zindexUtils from './zindexUtils'
import { ILayerInfo } from '@/store/types'
import stepsUtils from './stepsUtils'
class FrameUtils {
  isImageFrame(config: IFrame): boolean {
    return config.clips.length === 1 && (config.clips[0].isFrameImg as boolean)
  }

  frameClipFormatter(path: string | undefined) {
    return "<path d='" + (path ?? '') + "'></path>"
  }

  updateFrameLayer(width: number, height: number) {
    const clipPath = `M0,0h${width}v${height}h${-width}z`
    this.updateFrameLayerProps(LayerUtils.pageIndex, LayerUtils.layerIndex, 0, { clipPath })
    LayerUtils.updateLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, { initWidth: width, initHeight: height })
  }

  frameResizeHandler(width: number, height: number, offsetWidth: number, offsetHeight: number) {
    ImageUtils.imgResizeHandler(width, height, offsetWidth, offsetHeight,
      (imgX: number, imgY: number) => {
        this.updateFrameLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, 0, { imgX, imgY })
        this.updateFrameLayer(width, height)
      },
      (imgWidth: number, imgHeight: number) => {
        this.updateFrameLayerStyles(LayerUtils.pageIndex, LayerUtils.layerIndex, 0, {
          imgWidth,
          imgHeight,
          width,
          height
        })
        this.updateFrameLayer(width, height)
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
      const clip = generalUtils.deepCopy(currLayer.clips[idx])
      const { imgWidth, imgHeight, width, height, adjust } = clip.styles
      LayerUtils.addLayers(LayerUtils.pageIndex, [layerFactary.newImage({
        srcObj: { ...clip.srcObj },
        styles: {
          x: currLayer.styles.x + (clip.styles.x + width / 4) * currLayer.styles.scale,
          y: currLayer.styles.y + (clip.styles.y + height / 4) * currLayer.styles.scale,
          width: imgWidth * currLayer.styles.scale,
          height: imgHeight * currLayer.styles.scale,
          horizontalFlip: currLayer.styles.horizontalFlip,
          verticalFlip: currLayer.styles.verticalFlip,
          opacity: clip.styles.opacity,
          adjust // inherit adjust to the new layer,
        }
      })])
      this.updateFrameLayerStyles(LayerUtils.pageIndex, layerIndex, idx, {
        imgWidth: clip.styles.initWidth,
        imgHeight: clip.styles.initHeight,
        imgX: 0,
        imgY: 0,
        opacity: 100,
        adjust: {}
      })
      this.updateFrameLayerProps(LayerUtils.pageIndex, layerIndex, idx, {
        srcObj: {
          type: 'frame',
          userId: '',
          assetId: ''
        }
      })

      const clipper = document.getElementById(`nu-clipper-${layerIndex}`) as HTMLElement
      clipper && clipper.classList.remove('layer-flip')
      LayerUtils.updateLayerStyles(LayerUtils.pageIndex, layerIndex, {
        horizontalFlip: currLayer.styles.horizontalFlip,
        verticalFlip: currLayer.styles.verticalFlip
      })
      LayerUtils.updateLayerStyles(LayerUtils.pageIndex, layerIndex, {
        horizontalFlip: false,
        verticalFlip: false
      })
      setTimeout(() => {
        const clipper = document.getElementById(`nu-clipper-${layerIndex}`) as HTMLElement
        clipper && clipper.classList.add('layer-flip')
      }, 0)
    }
    store.commit('SET_popupComponent', { layerIndex: -1 })
  }

  updateImgToFrame() {
    const currLayer = generalUtils.deepCopy(LayerUtils.getCurrLayer) as IImage
    if (currLayer.type === 'image') {
      const { width, height, x, y, rotate } = currLayer.styles
      const { designId } = currLayer
      const layerIndex = LayerUtils.layerIndex
      const pageIndex = LayerUtils.pageIndex
      Object.assign(currLayer.styles, { x: 0, y: 0, zindex: 0, rotate: 0 })

      const newFrame = layerFactary.newFrame({
        designId,
        styles: {
          initWidth: width,
          initHeight: height,
          width,
          height,
          rotate,
          x,
          y
        },
        clips: [{
          ...currLayer,
          isFrameImg: true
        }]
      } as unknown as IFrame)
      LayerUtils.deleteLayer(layerIndex)
      LayerUtils.addLayersToPos(pageIndex, [newFrame], layerIndex)
      zindexUtils.reassignZindex(pageIndex)
      stepsUtils.record()
    }
  }

  updateFrameLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: Partial<IImageStyle>) {
    store.commit('SET_frameLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }

  updateFrameLayerAllClipsStyles(pageIndex: number, primaryLayerIndex: number, styles: { [key: string]: number | IAdjustJsonProps }) {
    store.commit('SET_frameLayerAllClipsStyles', {
      pageIndex,
      primaryLayerIndex,
      styles
    })
  }

  updateFrameLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: { [index: string]: number | string | boolean | SrcObj }) {
    if (targetIndex === -1) return
    store.commit('UPDATE_frameLayerProps', {
      pageIndex,
      layerIndex,
      targetIndex,
      props
    })
  }

  updateSubFrameLayerStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, targetIndex: number, styles: { [key: string]: number | IAdjustJsonProps }) {
    store.commit('SET_subFrameLayerStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      targetIndex,
      styles
    })
  }

  updateSubFrameLayerAllClipsStyles(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, styles: { [key: string]: number | IAdjustJsonProps }) {
    store.commit('SET_subFrameLayerAllClipsStyles', {
      pageIndex,
      primaryLayerIndex,
      subLayerIndex,
      styles
    })
  }

  updateFrameClipSrc(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, srcObj: { [key: string]: string | number }) {
    store.commit('UPDATE_frameClipSrc', {
      pageIndex: pageIndex,
      layerIndex: primaryLayerIndex,
      subLayerIndex: subLayerIndex,
      srcObj: { ...srcObj }
    })
  }

  updateFrameDecorColor(layerInfo: ILayerInfo, payload: { decorationColors?: [], decorationTopColors?: [] }) {
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    store.commit('SET_frameDecorColors', {
      pageIndex,
      layerIndex,
      subLayerIdx,
      payload
    })
  }
}

export default new FrameUtils()
