import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IViviStickerState {
  currActiveTab: string,
  isInEditor: boolean,
  isInCategoryDict: {[key: string]: boolean}
}

const getDefaultState = (): IViviStickerState => ({
  currActiveTab: 'object',
  isInEditor: false,
  isInCategoryDict: {
    object: false,
    background: false
  }
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getCurrActiveTab(state: IViviStickerState): string {
    return state.currActiveTab
  },
  getIsInEditor(state: IViviStickerState): boolean {
    return state.isInEditor
  },
  getIsInCategory(state: IViviStickerState): (tab: string) => boolean {
    return (tab: string): boolean => state.isInCategoryDict[tab] ?? false
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_currActiveTab(state: IViviStickerState, panel: string) {
    state.currActiveTab = panel
  },
  SET_isInEditor(state: IViviStickerState, bool: boolean) {
    state.isInEditor = bool
  },
  SET_isInCategory(state: IViviStickerState, updateInfo: { tab: string, bool: boolean }) {
    state.isInCategoryDict[updateInfo.tab] = updateInfo.bool
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
