import store from '@/store'
import generalUtils from './generalUtils'

class EditorUtils {
  get mobileAllPageMode() {
    return store.getters.mobileAllPageMode
  }

  setCloseMobilePanelFlag(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('SET_closeMobilePanelFlag', bool)
    }
  }

  setMobileAllPageMode(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('SET_mobileAllPageMode', bool)
      if (bool) {
        this.setCloseMobilePanelFlag(true)
      }
    }
  }
}

const editorUtils = new EditorUtils()

export default editorUtils
