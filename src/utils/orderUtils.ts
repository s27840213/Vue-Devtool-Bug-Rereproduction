
import store from '@/store'

function updateLayerStyles(pageIndex: number, layerIndex: number, styles: { [key: string]: number }) {
  store.commit('UPDATE_layerStyles', {
    pageIndex,
    layerIndex,
    styles
  })
}

function getTmpStyles() {
  return store.getters.getLayer(store.getters.getLastSelectedPageIndex, store.getters.getCurrSelectedIndex).styles
}
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
