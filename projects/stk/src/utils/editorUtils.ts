import { IBgRemoveInfo } from '@nu/vivi-lib/interfaces/image'
import { IPage } from '@nu/vivi-lib/interfaces/page'
import store from '@/store'
import { IMobileEditorState } from '@nu/vivi-lib/store/module/mobileEditor'
import generalUtils from './generalUtils'
import pageUtils from './pageUtils'

class EditorUtils {
  private _mobileSize = { width: 0, height: 0 }
  private _mobileCenterPos = { x: 0, y: 0 }
  private _mobileTopLeftPos = { x: 0, y: 0 }

  get mobileSize() {
    return this._mobileSize
  }

  get mobileCenterPos() {
    return this._mobileCenterPos
  }

  get mobileTopLeftPos() {
    return this._mobileTopLeftPos
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

  setMobilePhysicalData(data: { size?: { width: number, height: number }, centerPos?: { x: number, y: number }, pos?: { x: number, y: number } }) {
    const { size, centerPos, pos } = data
    if (size) {
      this._mobileSize.width = size.width
      this._mobileSize.height = size.height
    }
    if (centerPos) {
      this._mobileCenterPos.x = centerPos.x
      this._mobileCenterPos.y = centerPos.y
    }
    if (pos) {
      this._mobileTopLeftPos.x = pos.x
      this._mobileTopLeftPos.y = pos.y
    }
  }

  setMobileCenterPos(pos: { x?: number, y?: number }) {
    if (pos.x) {
      this._mobileCenterPos.x = pos.x
    }
    if (pos.y) {
      this._mobileCenterPos.y = pos.y
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

    const mobilePanelHeight = document.getElementsByClassName('mobile-panel')[0]?.clientHeight

    if (!this.mobileSize.height || !this.mobileSize.width) {
      const mobileEditor = document.getElementById('mobile-editor__content')
      if (mobileEditor) {
        this.setMobilePhysicalData({
          size: {
            width: mobileEditor.clientWidth,
            height: mobileEditor.clientHeight - mobilePanelHeight - (pageUtils.inBgRemoveMode ? 60 : 0)
          }
        })
      }
    }
    const PAGE_SIZE_W = (this.mobileSize.width || Number.MAX_SAFE_INTEGER) * 0.926
    const PAGE_SIZE_H = (this.mobileSize.height || Number.MAX_SAFE_INTEGER) * 0.926

    if (width > PAGE_SIZE_W || height > PAGE_SIZE_H) {
      return Math.max(Math.min(PAGE_SIZE_W / width, PAGE_SIZE_H / height), 0.1)
    } else {
      return 1
    }
  }

  handleContentScaleRatio(pageIndex: number) {
    if (generalUtils.isTouchDevice()) {
      const page = pageUtils.getPage(pageIndex)
      const contentScaleRatio = this.handleContentScaleCalc(pageUtils.inBgRemoveMode ? store.getters['bgRemove/getAutoRemoveResult'] : page)
      console.warn('contentScaleRatio', contentScaleRatio)
      store.commit('SET_contentScaleRatio4Page', { pageIndex, contentScaleRatio })
      const pos = {
        x: (editorUtils.mobileSize.width - page.width * this.contentScaleRatio) * 0.5,
        y: (editorUtils.mobileSize.height - page.height * this.contentScaleRatio) * 0.5
      }
      pageUtils.updatePagePos(pageIndex, pos)
      pageUtils.updatePageInitPos(pageIndex, pos)
      return contentScaleRatio
    }
    return 1
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
    if (panel === 'none') this.setShowMobileSubPanel(false)
    else this.setShowMobileSubPanel(true)
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

  setShowMobileSubPanel(bool: boolean): void {
    if (generalUtils.isTouchDevice()) {
      store.commit('mobileEditor/SET_showMobileSubPanel', bool)
    }
  }
}

const editorUtils = new EditorUtils()

export default editorUtils
