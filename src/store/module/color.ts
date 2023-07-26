import list from '@/apis/list'
import _ from 'lodash'
import { ActionTree, GetterTree, MutationTree } from 'vuex'
import store from '..'
import { IEditorState } from '../types'

export interface IColorState {
  defaultColors: Array<string>
  brandColors: Array<string>
  defaultBgColors: Array<string>
  defaultViviStickerBgColors: Array<string>
  documentColors: Array<string>
  recentlyColors: Array<string>
  // ColorUtils variable
  currEvent: string
  currColor: string
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
  defaultViviStickerBgColors: [
    '#EB5757',
    '#F76C83',
    '#FFA89E',
    '#F2994A',
    '#F0AF53',
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
    '#8D97A4',
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
    '#F2F2F2'
  ],
  recentlyColors: [],
  // ColorUtils variable
  currEvent: '',
  currColor: '#ffffff'
})

const state = getDefaultState()
const getters: GetterTree<IColorState, IEditorState> = {
  getDefaultColors(state): Array<string> {
    return state.defaultColors
  },
  getDefaultBgColors(state): Array<string> {
    return state.defaultBgColors
  },
  getDefaultViviStickerBgColors(state): Array<string> {
    return state.defaultViviStickerBgColors
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
  },
  currEvent(state): string {
    return state.currEvent
  },
  currColor(state): string {
    return state.currColor
  }
}

const mutations: MutationTree<IColorState> = {
  SET_STATE(state: IColorState, data: Partial<IColorState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IColorState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = newState[key]
        }
      })
  },
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
    await list.getRecentlyUsedColor()
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
