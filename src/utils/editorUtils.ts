import store from '@/store'
import generalUtils from './generalUtils'

interface IMobileEditorState {
  closeMobilePanelFlag: boolean,
  mobileAllPageMode: boolean
  inMultiSelectionMode: boolean,
  currCardIndex: number,
  currActivePanel: string,
  inBgSettingMode: boolean
}
class EditorUtils {
  get mobileAllPageMode() {
    return store.getters['mobileEditor/mobileAllPageMode']
  }

  get currActivePanel() {
    return store.getters['mobileEditor/getCurrActivePanel']
  }

  get currActiveSubPanel() {
    return store.getters['mobileEditor/getCurrActiveSubPanel']
  }

  get showMobilePanel() {
    return store.getters['mobileEditor/getShowMobilePanel']
  }

  get enalbleComponentLog() {
    return store.getters.getEnalbleComponentLog
  }

  get contentScaleRatio(): number {
    return store.getters.getContentScaleRatio
  }

  private setState(props: Partial<IMobileEditorState>) {
    store.commit('mobileEditor/SET_STATE', props)
  }

  setCloseMobilePanelFlag(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_closeMobilePanelFlag', bool)
    }
  }

  setMobileAllPageMode(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_mobileAllPageMode', bool)
      if (bool) {
        this.setCloseMobilePanelFlag(true)
      }
    }
  }

  setInMultiSelectionMode(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_inMultiSelectionMode', bool)
    }
  }

  setCurrActivePanel(panel: string): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_currActivePanel', panel)
    }
  }

  setCurrActiveSubPanel(panel: string): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_currActiveSubPanel', panel)
    }
  }

  setCurrCardIndex(index: number): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_currCardIndex', index)
    }
  }

  setInBgSettingMode(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      this.setState({ inBgSettingMode: bool })
    }
  }

  setShowMobilePanel(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_showMobilePanel', bool)
    }
  }
}

const editorUtils = new EditorUtils()

export default editorUtils
