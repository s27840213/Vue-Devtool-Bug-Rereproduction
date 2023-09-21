
import store from '@/store'
import stepsUtils from './stepsUtils'
class OrderUtils {
  bringToFront() {
    store.commit('UPDATE_layerOrder', {
      type: 'front'
    })
    stepsUtils.record()
  }

  bringForward() {
    store.commit('UPDATE_layerOrder', {
      type: 'forward'
    })
    stepsUtils.record()
  }

  bringBackward() {
    store.commit('UPDATE_layerOrder', {
      type: 'backward'
    })
    stepsUtils.record()
  }

  bringToBack() {
    store.commit('UPDATE_layerOrder', {
      type: 'back'
    })
    stepsUtils.record()
  }
}

const orderUtils = new OrderUtils()
export default orderUtils
