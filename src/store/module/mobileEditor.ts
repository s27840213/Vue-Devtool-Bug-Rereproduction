import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IMobileEditorState {
  closeMobilePanelFlag: boolean,
  mobileAllPageMode: boolean
  inMultiSelectionMode: boolean,
  currCardIndex: number,
  currActivePanel: string,
  currActiveSubPanel: string,
  inBgSettingMode: boolean
}

const getDefaultState = (): IMobileEditorState => ({
  closeMobilePanelFlag: false,
  mobileAllPageMode: false,
  inMultiSelectionMode: false,
  currCardIndex: 0,
  currActivePanel: 'none',
  currActiveSubPanel: 'none',
  inBgSettingMode: false
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
  }
}

const mutations: MutationTree<IMobileEditorState> = {
  SET_STATE(state: IMobileEditorState, props: Partial<IMobileEditorState>) {
    const newState = props || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IMobileEditorState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
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
