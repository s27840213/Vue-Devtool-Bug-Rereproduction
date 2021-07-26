import { ISelection } from '@/interfaces/text'
import { ModuleTree, MutationTree, GetterTree } from 'vuex'

interface ITextState {
  sel: { start: ISelection, end: ISelection }
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
  }
})

const mutations: MutationTree<ITextState> = {
  UPDATE_selection (state: ITextState, data: { start: ISelection, end: ISelection }) {
    Object.assign(state.sel.start, data.start)
    Object.assign(state.sel.end, data.end)
  }
}

export default {
  namespaced: true,
  state: getDefaultState,
  mutations
} as ModuleTree<ITextState>
