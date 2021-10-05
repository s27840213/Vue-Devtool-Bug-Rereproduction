import store from '@/store'
import LayerUtils from '@/utils/layerUtils'

class FlipUtils {
  isGroup(currSelectedInfo: any): boolean {
    return currSelectedInfo.types.has('group') && currSelectedInfo.layers.length === 1
  }

  applyFlip(currSelectedInfo: any, updateStyle: {[key: string]: boolean}) {
    LayerUtils.updateLayerStyles(currSelectedInfo.pageIndex, currSelectedInfo.index, updateStyle)
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
