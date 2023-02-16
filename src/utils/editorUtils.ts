import { IPage } from '@/interfaces/page'
import store from '@/store'
import { IMobileEditorState } from '@/store/module/mobileEditor'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'

class EditorUtils {
  get mobileAllPageMode() {
    return store.getters['mobileEditor/getMobileAllPageMode']
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

  get showColorSlips(): boolean {
    return store.state.showColorSlips
  }

  handleContentScaleCalc(page: IPage) {
    const { hasBleed } = pageUtils
    console.log(hasBleed)
    const { width, height } = hasBleed ? pageUtils.getPageSizeWithBleeds(page) : page
    const PAGE_SIZE_W = 324
    const PAGE_SIZE_H = 400
    if (width > PAGE_SIZE_W || height > PAGE_SIZE_H) {
      return width >= height ? PAGE_SIZE_W / width : PAGE_SIZE_H / height
    } else {
      return 1
    }
  }

  handleContentScaleRatio(pageIndex: number) {
    if (generalUtils.isTouchDevice()) {
      const page = pageUtils.getPage(pageIndex)
      const contentScaleRatio = this.handleContentScaleCalc(page)
      this.setContentScaleRatio(contentScaleRatio)
    }
  }

  toggleColorSlips(bool: boolean) {
    store.commit('SET_STATE', { showColorSlips: bool })
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
      store.commit('mobileEditor/SET_currActivePanel', panel.replace('bg', 'background'))
      if (panel === 'none') this.setShowMobilePanel(false)
      else this.setShowMobilePanel(true)
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

  setContentScaleRatio(ratio: number): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('SET_contentScaleRatio', ratio)
    }
  }
}

const editorUtils = new EditorUtils()

export default editorUtils
