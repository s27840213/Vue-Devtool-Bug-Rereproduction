import { GetterTree, MutationTree, ActionTree } from 'vuex'

interface IColorState {
  defaultColors: Array<string>,
  brandColors: Array<string>,
  documentColors: Array<string>,
  defaultBgColors: Array<string>
}

const getDefaultState = (): IColorState => ({
  defaultColors: [
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
  defaultBgColors: [
    '#F2994A',
    '#F2C94C',
    '#219653',
    '#9B51E0',
    '#BB6BD9',
    '#EB5757',
    '#2F80ED',
    '#2D9CDB',
    '#56CCF2',
    '#FFFFFF'
  ],
  brandColors: [],
  documentColors: [
    '#2D9CDB',
    '#56CCF2',
    '#9B51E0',
    '#BB6BD9',
    '#4F4F4F',
    '#828282',
    '#F2F2F2']
})

const state = getDefaultState()
const getters: GetterTree<IColorState, unknown> = {
  getDefaultColors(state): Array<string> {
    return state.defaultColors
  },
  getDefaultBgColors(state): Array<string> {
    return state.defaultBgColors
  },
  getBrandColors(state): Array<string> {
    return state.brandColors
  },
  getDocumentColors(state): Array<string> {
    return state.documentColors
  }
}

const mutations: MutationTree<IColorState> = {
  SET_defaultColor(state, updateInfo: { index: number, color: string }) {
    state.defaultColors[updateInfo.index] = updateInfo.color
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
