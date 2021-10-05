import store from '@/store'
import LayerUtils from '@/utils/layerUtils'
import ShapeUtils from '@/utils/shapeUtils'
import ControlUtils from '@/utils/controlUtils'

class FlipUtils {
  isGroup(currSelectedInfo: any): boolean {
    return currSelectedInfo.types.has('group') && currSelectedInfo.layers.length === 1
  }

  checkKey(updateStyle: any):
  {horizontalFlip: boolean, verticalFlip: boolean} {
    return {
      horizontalFlip: 'horizontalFlip' in updateStyle,
      verticalFlip: 'verticalFlip' in updateStyle
    }
  }

  applyFlip(currSelectedInfo: any, updateStyle: {[key: string]: boolean}) {
    const layer = currSelectedInfo.layers[0]
    if (layer.type === 'shape' && layer.category === 'D') {
      const { horizontalFlip, verticalFlip } = this.checkKey(updateStyle)
      const point = ShapeUtils.flipLine(layer.point, horizontalFlip, verticalFlip)
      ControlUtils.updateShapeLinePoint(currSelectedInfo.pageIndex, currSelectedInfo.index, point)
    } else {
      LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, updateStyle)
    }
  }

  horizontalFlip() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (!this.isGroup(currSelectedInfo)) {
      if (currSelectedInfo.layers.length === 1) {
        this.applyFlip(currSelectedInfo, {
          horizontalFlip: !currSelectedInfo.layers[0].styles.horizontalFlip
        })
      }
    }
  }

  verticalFlip() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    if (!this.isGroup(currSelectedInfo)) {
      if (currSelectedInfo.layers.length === 1) {
        this.applyFlip(currSelectedInfo, {
          verticalFlip: !currSelectedInfo.layers[0].styles.verticalFlip
        })
      }
    }
  }
}

const flipUtils = new FlipUtils()
export default flipUtils
