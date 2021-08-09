import { ISelection } from '@/interfaces/text'
import { ModuleTree, MutationTree } from 'vuex'

export interface ITextState {
  sel: { start: ISelection, end: ISelection },
  props: {
    [key: string]: string | boolean | number,
    textAlign: string,
    fontSize: string,
    fontSpacing: string,
    lineHeight: string,
    font: string,
    color: string,
    opacity: number,
    weight: string,
    style: string,
    decoration: string,
    isVertical: boolean
  }
}

const getDefaultState = (): ITextState => ({
  sel: {
    start: {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    },
    end: {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    }
  },
  props: {
    textAlign: 'center',
    fontSize: '--',
    fontSpacing: '--',
    lineHeight: '--',
    font: 'multi-fonts',
    color: '#000000',
    opacity: 100,
    weight: 'normal',
    style: 'normal',
    decoration: 'none',
    isVertical: false
  }
})
const state = getDefaultState()
const mutations: MutationTree<ITextState> = {
  UPDATE_selection (state: ITextState, data: { start: ISelection, end: ISelection }) {
    Object.assign(state.sel.start, data.start)
    Object.assign(state.sel.end, data.end)
  },
  UPDATE_Props (state: ITextState, data: { [key: string]: string | boolean | number }) {
    Object.entries(data).forEach(([k, v]) => {
      state.props[k] = v
    })
  },
  SET_default (state: ITextState) {
    const defaultState = getDefaultState()
    Object.entries(defaultState.props).forEach(([k, v]) => {
      state.props[k] = v
    })
    const nan = {
      pIndex: NaN,
      sIndex: NaN,
      offset: NaN
    }
    Object.assign(state.sel.start, nan)
    Object.assign(state.sel.end, nan)
  }
}

export default {
  namespaced: true,
  state,
  mutations
} as ModuleTree<ITextState>
