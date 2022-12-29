import list from '@/apis/list'
import _ from 'lodash'
import { GetterTree, MutationTree, ActionTree } from 'vuex'
import store from '..'
import { IEditorState } from '../types'

interface IColorState {
  defaultColors: Array<string>,
  brandColors: Array<string>,
  defaultBgColors: Array<string>,
  documentColors: Array<string>,
  recentlyColors: Array<string>
}

const getDefaultState = (): IColorState => ({
  defaultColors: [
    '#FFFFFF',
    '#E4E8EB',
    '#C9D0D8',
    '#646C77',
    '#505760',
    '#31363c',
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
    '#EB5757',
    '#F76C83',
    '#FFA89E',
    '#F2994A',
    '#F0AE53',
    '#FECD56',
    '#FFD79A',
    '#B23871',
    '#782B76',
    '#363F78',
    '#007ABE',
    '#006977',
    '#00C6C5',
    '#C0E1D8',
    '#FFFFFF',
    '#E4E8EB',
    '#C9D0D8',
    '#646C77',
    '#505760',
    '#000000'
  ],
  brandColors: [],
  documentColors: [
    '#2D9CDB',
    '#56CCF2',
    '#9B51E0',
    '#BB6BD9',
    '#4F4F4F',
    '#828282',
    '#F2F2F2'],
  recentlyColors: []
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
    const pageColors = rootState.pages[store.getters.getCurrFocusPageIndex].config.documentColors
    if (!pageColors.length) {
      return state.documentColors
    }
    return rootState.pages[store.getters.getCurrFocusPageIndex].config.documentColors
  },
  getRecentlyColors(state): Array<string> {
    return state.recentlyColors
  }
}

const mutations: MutationTree<IColorState> = {
  SET_defaultColor(state, updateInfo: { index: number, color: string }) {
    state.defaultColors[updateInfo.index] = updateInfo.color
  },
  SET_recentlyColors(state, colors) {
    state.recentlyColors = colors
  }
}

const actions: ActionTree<IColorState, unknown> = {
  async initRecentlyColors({ commit }) {
    if (state.recentlyColors.length) return

    let recently = (await list.getRecentlyUsedColor()).data.data.content as unknown as string[]
    recently = recently.map((color: string) => `#${color}`)
    commit('SET_recentlyColors', recently)
  },
  addRecentlyColors({ commit }, color: string) {
    list.addRecentlyUsedColor(color.replace('#', ''))

    let recently = state.recentlyColors
    recently = _.without(recently, color)
    recently = [color].concat(recently)
    commit('SET_recentlyColors', recently)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
