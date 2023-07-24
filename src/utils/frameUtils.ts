import i18n from '@/i18n'
import { IAdjustJsonProps } from '@/interfaces/adjust'
import { SrcObj } from '@/interfaces/gallery'
import { IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { IFrame, IImage, IImageStyle } from '@/interfaces/layer'
import store from '@/store'
import { ILayerInfo, LayerType } from '@/store/types'
import { notify } from '@kyvg/vue3-notification'
import generalUtils from './generalUtils'
import ImageUtils from './imageUtils'
import layerFactary from './layerFactary'
import LayerUtils from './layerUtils'
import stepsUtils from './stepsUtils'
import zindexUtils from './zindexUtils'

class FrameUtils {
  isImageFrame(config: IFrame): boolean {
    return config.type === LayerType.frame && config.clips.length === 1 && (config.clips[0].isFrameImg as boolean)
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
        imgWidth: clip.styles.width,
        imgHeight: clip.styles.height,
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
      let shadow
      const _shadow = currLayer.styles.shadow
      if (_shadow && _shadow.currentEffect !== ShadowEffectType.none) {
        if (['', 'upload'].includes(_shadow.srcObj.type)) {
          notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
          return
        } else {
          shadow = generalUtils.deepCopy(_shadow) as IShadowProps
          shadow.styles.imgHeight *= currLayer.styles.scale
          shadow.styles.imgWidth *= currLayer.styles.scale
          shadow.styles.imgX *= currLayer.styles.scale
          shadow.styles.imgY *= currLayer.styles.scale
        }
      }

      const { width, height, x, y, rotate } = currLayer.styles
      const { designId } = currLayer
      const layerIndex = LayerUtils.layerIndex
      const pageIndex = LayerUtils.pageIndex
      Object.assign(currLayer.styles, {
        x: 0,
        y: 0,
        zindex: 0,
        rotate: 0,
        shadow: layerFactary.newImage({ styles: {} }).styles.shadow
      })

      const newFrame = layerFactary.newFrame({
        designId,
        styles: {
          initWidth: width,
          initHeight: height,
          width,
          height,
          rotate,
          x,
          y,
          shadow
        },
        clips: [{
          ...currLayer,
          isFrameImg: true
        }]
      } as unknown as IFrame)
      LayerUtils.deleteLayer(pageIndex, layerIndex)
      LayerUtils.addLayersToPos(pageIndex, [newFrame], layerIndex)
      LayerUtils.updateLayerProps(pageIndex, layerIndex, { active: true })
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

  updateFrameLayerAllClipsStyles(pageIndex: number, primaryLayerIndex: number, styles: { [key: string]: number | IAdjustJsonProps }, subLayerIndex = -1) {
    if (subLayerIndex === -1 || typeof subLayerIndex === 'undefined') {
      store.commit('SET_frameLayerAllClipsStyles', {
        pageIndex,
        primaryLayerIndex,
        styles
      })
    } else {
      this.updateSubFrameLayerAllClipsStyles(pageIndex, primaryLayerIndex, subLayerIndex, styles)
    }
  }

  updateFrameLayerProps(pageIndex: number, layerIndex: number, targetIndex: number, props: { [index: string]: number | string | boolean | SrcObj }, preprimaryLayerIndex = -1) {
    if (targetIndex === -1) return
    store.commit('UPDATE_frameLayerProps', {
      pageIndex,
      layerIndex,
      targetIndex,
      preprimaryLayerIndex,
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

  updateFrameClipSrc(pageIndex: number, primaryLayerIndex: number, subLayerIndex: number, srcObj: SrcObj) {
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

  checkIsRect(clipPath: string) {
    if (clipPath.length > 200) return false
    for (const s of clipPath) {
      if (Number.isNaN(+s) && ![',', '-', '.'].includes(s)) {
        if (!['M', 'h', 'v', 'z'].includes(s)) return false
      }
    }
    return true
  }
}

export default new FrameUtils()
