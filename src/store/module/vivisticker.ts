import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IViviStickerState {
  currActiveTab: string,
  isInEditor: boolean,
  isInCategory: boolean
}

const getDefaultState = (): IViviStickerState => ({
  currActiveTab: 'object',
  isInEditor: false,
  isInCategory: false
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getCurrActiveTab(state: IViviStickerState): string {
    return state.currActiveTab
  },
  getIsInEditor(state: IViviStickerState): boolean {
    return state.isInEditor
  },
  getIsInCategory(state: IViviStickerState): boolean {
    return state.isInCategory
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_currActiveTab(state: IViviStickerState, panel: string) {
    state.currActiveTab = panel
  },
  SET_isInEditor(state: IViviStickerState, bool: boolean) {
    state.isInEditor = bool
  },
  SET_isInCategory(state: IViviStickerState, bool: boolean) {
    state.isInCategory = bool
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
