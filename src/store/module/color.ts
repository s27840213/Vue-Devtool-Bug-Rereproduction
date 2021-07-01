import Vue from 'vue'
import Vuex, { GetterTree, MutationTree, ActionTree } from 'vuex'

Vue.use(Vuex)
interface IColorState {
  defaultColor: Array<string>,
  brandColor: Array<string>,
  documentColor: Array<string>
}

const getDefaultState = (): IColorState => ({
  defaultColor: [
    '#EB5757',
    '#F2994A',
    '#F2C94C',
    '#219653',
    '#27AE60',
    '#6FCF97',
    '#2F80ED',
    '#2D9CDB',
    '#56CCF2',
    '#9B51E0',
    '#BB6BD9',
    '#4F4F4F',
    '#828282',
    '#F2F2F2',
    '#FFFFFF'
  ],
  brandColor: [],
  documentColor: []
})

const state = getDefaultState()

const getters: GetterTree<IColorState, unknown> = {
  getDefaultColor(state): Array<string> {
    return state.defaultColor
  },
  getBrandColor(state): Array<string> {
    return state.brandColor
  },
  getDocumentColor(state): Array<string> {
    return state.documentColor
  }
}

const mutations: MutationTree<IColorState> = {
  SET_defaultColor(state, updateInfo: { index: number, color: string }) {
    state.defaultColor[updateInfo.index] = updateInfo.color
  }
}

const actions: ActionTree<IColorState, unknown> = {
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
