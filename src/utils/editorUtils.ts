import store from '@/store'
import generalUtils from './generalUtils'

class EditorUtils {
  setCloseMobilePanelFlag(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('SET_closeMobilePanelFlag', bool)
    }
  }
}

const editorUtils = new EditorUtils()

export default editorUtils
