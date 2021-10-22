import { GetterTree, MutationTree } from 'vuex'
import { floor } from 'lodash'

interface IPageState {
    isShowPagePreview: boolean,
    pagesPerRow: number,
    focusPageIndex: number
}

const getDefaultState = (): IPageState => ({
  isShowPagePreview: false,
  pagesPerRow: floor((window.screen.width - 130) / 180),
  focusPageIndex: 0
})

const state = getDefaultState()
const getters: GetterTree<IPageState, unknown> = {
  getIsShowPagePreview(state: IPageState) {
    return state.isShowPagePreview
  },
  getPagesPerRow(state: IPageState) {
    return state.pagesPerRow
  }
}

const mutations: MutationTree<IPageState> = {
  SET_isShowPagePreview(state: IPageState, isShowPagePreview: boolean) {
    state.isShowPagePreview = isShowPagePreview
  },
  SET_PagesPerRow(state: IPageState, pagesPerRow: number) {
    state.pagesPerRow = pagesPerRow
  },
  SET_focusPage(state: IPageState, index: number) {
    state.focusPageIndex = index
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
