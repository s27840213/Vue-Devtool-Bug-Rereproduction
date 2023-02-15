import { IPage } from '@/interfaces/page'
import store from '@/store'
import { IMobileEditorState } from '@/store/module/mobileEditor'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'

class EditorUtils {
  private _mobileWidth = 0
  private _mobileHeight = 0

  get mobileWidth() {
    return this._mobileWidth
  }

  get mobileHeight() {
    return this._mobileHeight
  }

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

  setMobileHW(size: { width?: number, height?: number }) {
    console.warn(size.width, size.height)
    if (size.width) {
      this._mobileWidth = size.width
    }
    if (size.height) {
      this._mobileHeight = size.height
    }
  }

  handleContentScaleCalc(page: IPage) {
    const { width, height } = page
    const PAGE_SIZE_W = (this.mobileWidth || Number.MAX_SAFE_INTEGER) * 0.926
    const PAGE_SIZE_H = (this.mobileHeight || Number.MAX_SAFE_INTEGER) * 0.926
    if (width > PAGE_SIZE_W || height > PAGE_SIZE_H) {
      if (width >= height) {
        return PAGE_SIZE_W / width
      } else {
        const scale = PAGE_SIZE_H / height
        if (width * scale > PAGE_SIZE_W) {
          return PAGE_SIZE_W / width
        }
        return scale
      }
    } else {
      return 1
    }
  }

  handleContentScaleRatio(pageIndex: number) {
    if (generalUtils.isTouchDevice()) {
      const page = pageUtils.getPage(pageIndex)
      const contentScaleRatio = this.handleContentScaleCalc(page)
      this.setContentScaleRatio(contentScaleRatio)
      store.commit('SET_contentScaleRatio4Page', { pageIndex, contentScaleRatio })
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
