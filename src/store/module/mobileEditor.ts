import { ActionTree, GetterTree, MutationTree } from 'vuex'

export interface IMobileEditorState {
  closeMobilePanelFlag: boolean,
  mobileAllPageMode: boolean
  inMultiSelectionMode: boolean,
  currCardIndex: number,
  currActivePanel: string,
  currActiveSubPanel: string,
  inBgSettingMode: boolean,
  showMobilePanel: boolean,
  // pageCenterPos: used to indicate the center pos of the page (editor)
  pageCenterPos: { x: number, y: number },
  isPinchingEditor: boolean,
  pinchScale: number
  showMobileSubPanel: boolean
}

const getDefaultState = (): IMobileEditorState => ({
  closeMobilePanelFlag: false,
  mobileAllPageMode: false,
  inMultiSelectionMode: false,
  currCardIndex: 0,
  currActivePanel: 'none',
  currActiveSubPanel: 'none',
  inBgSettingMode: false,
  showMobilePanel: false,
  pageCenterPos: { x: -1, y: -1 },
  isPinchingEditor: false,
  pinchScale: 1,
  showMobileSubPanel: false,
})

const state = getDefaultState()
const getters: GetterTree<IMobileEditorState, unknown> = {
  getInMultiSelectionMode(state: IMobileEditorState) {
    return state.inMultiSelectionMode
  },
  getCurrCardIndex(state: IMobileEditorState): number {
    return state.currCardIndex
  },
  getCurrActivePanel(state: IMobileEditorState): string {
    return state.currActivePanel
  },
  getCurrActiveSubPanel(state: IMobileEditorState): string {
    return state.currActiveSubPanel
  },
  getMobileAllPageMode(state: IMobileEditorState): boolean {
    return state.mobileAllPageMode
  },
  getInBgSettingMode(state: IMobileEditorState): boolean {
    return state.inBgSettingMode
  },
  getShowMobilePanel(state: IMobileEditorState): boolean {
    return state.showMobilePanel
  },
  getIsPinchingEditor(state: IMobileEditorState): boolean {
    return state.isPinchingEditor
  }
}

const mutations: MutationTree<IMobileEditorState> = {
  SET_STATE(state: IMobileEditorState, props: Partial<IMobileEditorState>) {
    const newState = props || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IMobileEditorState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = newState[key]
        }
      })
  },
  SET_closeMobilePanelFlag(state: IMobileEditorState, bool: boolean) {
    state.closeMobilePanelFlag = bool
  },
  SET_mobileAllPageMode(state: IMobileEditorState, bool: boolean) {
    state.mobileAllPageMode = bool
  },
  SET_inMultiSelectionMode(state: IMobileEditorState, bool: boolean) {
    state.inMultiSelectionMode = bool
  },
  SET_currCardIndex(state: IMobileEditorState, number) {
    state.currCardIndex = number
  },
  SET_currActivePanel(state: IMobileEditorState, panel: string) {
    state.currActivePanel = panel
  },
  SET_currActiveSubPanel(state: IMobileEditorState, subPanel: string) {
    state.currActiveSubPanel = subPanel
  },
  SET_showMobilePanel(state: IMobileEditorState, bool: boolean) {
    state.showMobilePanel = bool
  },
  SET_isPinchingEditor(state: IMobileEditorState, bool: boolean) {
    state.isPinchingEditor = bool
  },
  SET_pageCenterPos(state: IMobileEditorState, pos: { x: number, y: number }) {
    state.pageCenterPos.x = pos.x
    state.pageCenterPos.y = pos.y
  },
  UPDATE_pinchScale(state: IMobileEditorState, scale: number) {
    state.pinchScale = scale
  },
  SET_showMobileSubPanel(state: IMobileEditorState, bool: boolean) {
    state.showMobileSubPanel = bool
  },
  INIT_STATE(state: IMobileEditorState) {
    state.closeMobilePanelFlag = false
    state.mobileAllPageMode = false
    state.inMultiSelectionMode = false
    state.currCardIndex = 0
    state.currActivePanel = 'none'
    state.currActiveSubPanel = 'none'
    state.inBgSettingMode = false
    state.showMobilePanel = false
  }
}

const actions: ActionTree<IMobileEditorState, unknown> = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
