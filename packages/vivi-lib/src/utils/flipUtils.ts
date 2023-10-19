/* eslint-disable indent */
import { AllLayerTypes, IFrame, IGroup, IImage } from '@/interfaces/layer'
import store from '@/store'
import controlUtils from '@/utils/controlUtils'
import layerUtils from '@/utils/layerUtils'
import shapeUtils from '@/utils/shapeUtils'
import frameUtils from './frameUtils'

class FlipUtils {
  isGroup(currSelectedInfo: any): boolean {
    return currSelectedInfo.types.has('group') && currSelectedInfo.layers.length === 1
  }

  checkKey(updateStyle: any): { horizontalFlip: boolean, verticalFlip: boolean } {
    return {
      horizontalFlip: 'horizontalFlip' in updateStyle,
      verticalFlip: 'verticalFlip' in updateStyle
    }
  }

  applyFlip(pageIndex: number, layerIndex: number, layer: AllLayerTypes, updateStyle: { [key: string]: boolean }) {
    if (shapeUtils.isLine(layer)) {
      const { horizontalFlip, verticalFlip } = this.checkKey(updateStyle)
      const point = shapeUtils.flipLine(layer.point ?? [], horizontalFlip, verticalFlip)
      controlUtils.updateShapeLinePoint(pageIndex, layerIndex, point)
    } else {
      if (layer.type === 'text') {
        layerUtils.updateLayerProps(pageIndex, layerIndex, { isFlipping: true })
        window.setTimeout(() => {
          layerUtils.updateLayerProps(pageIndex, layerIndex, { isFlipping: false })
        }, 300)
      }
      layerUtils.updateLayerStyles(pageIndex, layerIndex, updateStyle)
    }
  }

  horizontalFlip() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const layer = store.getters.getLayer(currSelectedInfo.pageIndex, currSelectedInfo.index)
    const defaultFlip = () => {
      this.applyFlip(currSelectedInfo.pageIndex, currSelectedInfo.index, layer, {
        horizontalFlip: !layer.styles.horizontalFlip
      })
    }
    switch (layer.type) {
      case 'frame':
        if (layerUtils.subLayerIdx !== -1 || frameUtils.isImageFrame(layerUtils.getCurrLayer as IFrame)) {
          const subIdx = Math.max(layerUtils.subLayerIdx, 0)
          const horizontalFlip = !(layer as IFrame).clips[subIdx].styles.horizontalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IFrame).clips[subIdx], 'h')
          frameUtils.updateFrameLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, subIdx, { horizontalFlip, imgX, imgY })
        } else {
          defaultFlip()
        }
        break
      case 'group':
        if (layerUtils.subLayerIdx !== -1) {
          const horizontalFlip = !(layer as IGroup).layers[layerUtils.subLayerIdx].styles.horizontalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IGroup).layers[layerUtils.subLayerIdx] as IImage, 'h')
          layerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index,
            { horizontalFlip, imgX, imgY }, layerUtils.subLayerIdx)
        }
        break
      case 'image': {
        const horizontalFlip = !(layer as IImage).styles.horizontalFlip
        const { imgX, imgY } = this.imgFlipMapper(layer as IImage, 'h')
        layerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { horizontalFlip, imgX, imgY })
        break
      }
      default:
        defaultFlip()
    }
  }

  imgFlipMapper(layer: IImage, dir: 'h' | 'v') {
    const { styles: { imgHeight, imgWidth, width, height } } = layer
    let { styles: { imgX, imgY } } = layer
    if (dir === 'h') {
      imgX = Math.abs(imgX) + width - imgWidth
    } else {
      imgY = Math.abs(imgY) + height - imgHeight
    }
    return { imgX, imgY }
  }

  verticalFlip() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const layer = store.getters.getLayer(currSelectedInfo.pageIndex, currSelectedInfo.index)
    const defaultFlip = () => {
      this.applyFlip(currSelectedInfo.pageIndex, currSelectedInfo.index, layer, {
        verticalFlip: !layer.styles.verticalFlip
      })
    }
    switch (layer.type) {
      case 'frame':
        if (layerUtils.subLayerIdx !== -1 || frameUtils.isImageFrame(layerUtils.getCurrLayer as IFrame)) {
          const subIdx = Math.max(layerUtils.subLayerIdx, 0)
          const verticalFlip = !(layer as IFrame).clips[subIdx].styles.verticalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IFrame).clips[subIdx], 'v')
          frameUtils.updateFrameLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, subIdx, { verticalFlip, imgX, imgY })
        } else {
          defaultFlip()
        }
        break
      case 'group':
        if (layerUtils.subLayerIdx !== -1) {
          const verticalFlip = !(layer as IGroup).layers[layerUtils.subLayerIdx].styles.verticalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IGroup).layers[layerUtils.subLayerIdx] as IImage, 'v')
          layerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index,
            { verticalFlip, imgX, imgY }, layerUtils.subLayerIdx)
        }
        break
      case 'image': {
        const verticalFlip = !(layer as IImage).styles.verticalFlip
        const { imgX, imgY } = this.imgFlipMapper(layer as IImage, 'v')
        layerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { verticalFlip, imgX, imgY })
        break
      }
      default:
        defaultFlip()
    }
  }
}

const flipUtils = new FlipUtils()
export default flipUtils
