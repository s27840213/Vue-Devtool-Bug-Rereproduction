
import store from '@/store'
class OrderUtils {
  bringToFront() {
    store.commit('UPDATE_layerOrder', {
      type: 'front'
    })
  }

  bringForward() {
    store.commit('UPDATE_layerOrder', {
      type: 'forward'
    })
  }

  bringBackward() {
    store.commit('UPDATE_layerOrder', {
      type: 'backward'
    })
  }

  bringToBack() {
    store.commit('UPDATE_layerOrder', {
      type: 'back'
    })
  }
}

const orderUtils = new OrderUtils()
export default orderUtils
