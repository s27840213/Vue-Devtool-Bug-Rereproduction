/**
 * This ts utility file is used to calculate the actually distance after page was scaled
 * All the related function may put here in the future
 * What's more, I have no idea about the file name so I casually named it as PropsTransformer
 * If anyone got the idea of the file name, please feel free to rename it.
 */
import store from '@/store'

class PropsTransformer {
  getActualMoveOffset(x: number, y: number) {
    const scaleRatio = store.getters.getPageScaleRatio
    console.log(x, y, x * (100 / scaleRatio), y * (100 / scaleRatio), scaleRatio)
    return {
      offsetX: x * (100 / scaleRatio),
      offsetY: y * (100 / scaleRatio)
    }
  }
}

export default new PropsTransformer()
