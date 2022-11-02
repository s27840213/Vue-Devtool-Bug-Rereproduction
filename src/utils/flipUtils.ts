/* eslint-disable indent */
import store from '@/store'
import LayerUtils from '@/utils/layerUtils'
import ShapeUtils from '@/utils/shapeUtils'
import ControlUtils from '@/utils/controlUtils'
import { IFrame, IGroup, IImage } from '@/interfaces/layer'
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

  applyFlip(pageIndex: number, layerIndex: number, layer: any, updateStyle: { [key: string]: boolean }) {
    if (layer.type === 'shape' && layer.category === 'D') {
      const { horizontalFlip, verticalFlip } = this.checkKey(updateStyle)
      const point = ShapeUtils.flipLine(layer.point, horizontalFlip, verticalFlip)
      ControlUtils.updateShapeLinePoint(pageIndex, layerIndex, point)
    } else {
      LayerUtils.updateLayerStyles(pageIndex, layerIndex, updateStyle)
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
        if (LayerUtils.subLayerIdx !== -1 || frameUtils.isImageFrame(LayerUtils.getCurrLayer as IFrame)) {
          const subIdx = Math.max(LayerUtils.subLayerIdx, 0)
          const horizontalFlip = !(layer as IFrame).clips[subIdx].styles.horizontalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IFrame).clips[subIdx], 'h')
          frameUtils.updateFrameLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, subIdx, { horizontalFlip, imgX, imgY })
        } else {
          defaultFlip()
        }
        break
      case 'group':
        if (LayerUtils.subLayerIdx !== -1) {
          const horizontalFlip = !(layer as IGroup).layers[LayerUtils.subLayerIdx].styles.horizontalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IGroup).layers[LayerUtils.subLayerIdx] as IImage, 'h')
          LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index,
            { horizontalFlip, imgX, imgY }, LayerUtils.subLayerIdx)
        }
        break
      case 'image': {
        const horizontalFlip = !(layer as IImage).styles.horizontalFlip
        const { imgX, imgY } = this.imgFlipMapper(layer as IImage, 'h')
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { horizontalFlip, imgX, imgY })
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
        if (LayerUtils.subLayerIdx !== -1 || frameUtils.isImageFrame(LayerUtils.getCurrLayer as IFrame)) {
          const subIdx = Math.max(LayerUtils.subLayerIdx, 0)
          const verticalFlip = !(layer as IFrame).clips[subIdx].styles.verticalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IFrame).clips[subIdx], 'v')
          frameUtils.updateFrameLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, subIdx, { verticalFlip, imgX, imgY })
        } else {
          defaultFlip()
        }
        break
      case 'group':
        if (LayerUtils.subLayerIdx !== -1) {
          const verticalFlip = !(layer as IGroup).layers[LayerUtils.subLayerIdx].styles.verticalFlip
          const { imgX, imgY } = this.imgFlipMapper((layer as IGroup).layers[LayerUtils.subLayerIdx] as IImage, 'v')
          LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index,
            { verticalFlip, imgX, imgY }, LayerUtils.subLayerIdx)
          }
        break
      case 'image': {
        const verticalFlip = !(layer as IImage).styles.verticalFlip
        const { imgX, imgY } = this.imgFlipMapper(layer as IImage, 'v')
        LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, { verticalFlip, imgX, imgY })
        break
      }
      default:
        defaultFlip()
    }
  }
}

const flipUtils = new FlipUtils()
export default flipUtils
