import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IMobileEditorState {
  closeMobilePanelFlag: boolean,
  mobileAllPageMode: boolean
  inMultiSelectionMode: boolean,
  currCardIndex: number,
  currActivePanel: string
}

const getDefaultState = (): IMobileEditorState => ({
  closeMobilePanelFlag: false,
  mobileAllPageMode: false,
  inMultiSelectionMode: false,
  currCardIndex: 0,
  currActivePanel: 'none'
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
  getMobileAllPageMode(state: IMobileEditorState): boolean {
    return state.mobileAllPageMode
  }
}

const mutations: MutationTree<IMobileEditorState> = {
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
