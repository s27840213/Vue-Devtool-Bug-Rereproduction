/* eslint-disable indent */
import store from '@/store'
import LayerUtils from '@/utils/layerUtils'
import ShapeUtils from '@/utils/shapeUtils'
import ControlUtils from '@/utils/controlUtils'
import { IFrame, IGroup } from '@/interfaces/layer'
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
          frameUtils.updateFrameLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index
            , subIdx, {
            horizontalFlip: !(layer as IFrame).clips[subIdx].styles.horizontalFlip
          })
        } else {
          defaultFlip()
        }
        break
      case 'group':
        LayerUtils.subLayerIdx !== -1 && (() => {
          LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index
            , {
              horizontalFlip: !(layer as IGroup).layers[LayerUtils.subLayerIdx].styles.horizontalFlip
            }, LayerUtils.subLayerIdx)
        })()
        break
      default:
        defaultFlip()
    }
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
          frameUtils.updateFrameLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index
            , subIdx, {
            verticalFlip: !(layer as IFrame).clips[subIdx].styles.verticalFlip
          })
        } else {
          defaultFlip()
        }
        break
      case 'group':
        LayerUtils.subLayerIdx !== -1 && (() => {
          LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index
            , {
              verticalFlip: !(layer as IGroup).layers[LayerUtils.subLayerIdx].styles.verticalFlip
            }, LayerUtils.subLayerIdx)
        })()
        break
      default:
        defaultFlip()
    }
  }
}

const flipUtils = new FlipUtils()
export default flipUtils
