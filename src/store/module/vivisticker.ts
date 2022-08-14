import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IViviStickerState {
  currActiveTab: string,
  isInEditor: boolean
}

const getDefaultState = (): IViviStickerState => ({
  currActiveTab: 'object',
  isInEditor: false
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getCurrActiveTab(state: IViviStickerState): string {
    return state.currActiveTab
  },
  getIsInEditor(state: IViviStickerState): boolean {
    return state.isInEditor
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_currActiveTab(state: IViviStickerState, panel: string) {
    state.currActiveTab = panel
  },
  SET_isInEditor(state: IViviStickerState, bool: boolean) {
    state.isInEditor = bool
  }
}

const actions: ActionTree<IViviStickerState, unknown> = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
