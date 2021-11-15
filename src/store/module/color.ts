import { GetterTree, MutationTree, ActionTree } from 'vuex'
import { IEditorState } from '../types'

interface IColorState {
  defaultColors: Array<string>,
  brandColors: Array<string>,
  defaultBgColors: Array<string>,
  documentColors: Array<string>
}

const getDefaultState = (): IColorState => ({
  defaultColors: [
    '#FFFFFF',
    '#E4E8EB',
    '#C9D0D8',
    '#646C77',
    '#505760',
    '#000000',
    '#EB5757',
    '#F76C83',
    '#FE7565',
    '#F2994A',
    '#FCAC3B',
    '#FECD56',
    '#FFD79A',
    '#B23871',
    '#782B76',
    '#363F78',
    '#007ABE',
    '#006977',
    '#00C6C5',
    '#C0E1D8'
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
const getters: GetterTree<IColorState, IEditorState> = {
  getDefaultColors(state): Array<string> {
    return state.defaultColors
  },
  getDefaultBgColors(state): Array<string> {
    return state.defaultBgColors
  },
  getBrandColors(state): Array<string> {
    return state.brandColors
  },
  getDocumentColors(state, getters, rootState): Array<string> {
    const pageColors = rootState.pages[rootState.lastSelectedPageIndex].documentColors
    if (!pageColors.length) {
      return state.documentColors
    }
    return rootState.pages[rootState.lastSelectedPageIndex].documentColors
      .map(colorData => colorData.color).reverse()
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
