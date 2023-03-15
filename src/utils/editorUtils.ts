import { IBgRemoveInfo } from '@/interfaces/image'
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
    if (size.width) {
      this._mobileWidth = size.width
    }
    if (size.height) {
      this._mobileHeight = size.height
    }
  }

  handleContentScaleCalc(page: IPage | IBgRemoveInfo) {
    const { hasBleed } = pageUtils
    let { width, height } = hasBleed && !pageUtils.inBgRemoveMode ? pageUtils.getPageSizeWithBleeds(page as IPage) : page
    const aspectRatio = width / height

    if (pageUtils.inBgRemoveMode) {
      width = 1600
      height = width / aspectRatio
    }

    if (!this.mobileHeight || this.mobileWidth) {
      const mobileEditor = document.getElementById('mobile-editor__content')
      if (mobileEditor) {
        this.setMobileHW({
          width: mobileEditor.clientWidth,
          height: mobileEditor.clientHeight - (pageUtils.inBgRemoveMode ? 60 : 0)
        })
      }
    }
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
      const contentScaleRatio = this.handleContentScaleCalc(pageUtils.inBgRemoveMode ? store.getters['bgRemove/getAutoRemoveResult'] : page)
      this.setContentScaleRatio(contentScaleRatio)
      store.commit('SET_contentScaleRatio4Page', { pageIndex, contentScaleRatio })
      return contentScaleRatio
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
      store.commit('mobileEditor/SET_currActivePanel', panel === 'bg' ? panel.replace('bg', 'background') : panel)
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
