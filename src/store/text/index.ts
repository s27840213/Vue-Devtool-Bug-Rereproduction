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
    isBold: boolean,
    isItalic: boolean,
    isUnderline: boolean,
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
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isVertical: false
  }
})
const state = getDefaultState()
const mutations: MutationTree<ITextState> = {
  UPDATE_selection (state: ITextState, data: { start: ISelection, end: ISelection }) {
    console.log(data.start)
    Object.assign(state.sel.start, data.start)
    console.log(state.sel.start)
    Object.assign(state.sel.end, data.end)
  },
  UPDATE_Props (state: ITextState, data: { [key: string]: string | boolean | number }) {
    Object.entries(data).forEach(([k, v]) => {
      state.props[k] = v
    })
  },
  SET_default (state: ITextState) {
    const defaultState = getDefaultState()
    console.log('xcxczxc')
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
