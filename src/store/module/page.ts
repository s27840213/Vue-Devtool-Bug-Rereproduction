import { GetterTree, MutationTree } from 'vuex'
import { floor } from 'lodash'

interface IPageState {
  isShowPagePreview: boolean,
  pagesPerRow: number,
  detailPageMode: boolean
}

const getDefaultState = (): IPageState => ({
  isShowPagePreview: false,
  pagesPerRow: floor((document.body.clientWidth - 130) / 180),
  detailPageMode: false
})

const state = getDefaultState()
const getters: GetterTree<IPageState, unknown> = {
  getIsShowPagePreview(state: IPageState) {
    return state.isShowPagePreview
  },
  getPagesPerRow(state: IPageState) {
    return state.pagesPerRow
  },
  getDeatilPageMode(state: IPageState) {
    return state.detailPageMode
  }
}

const mutations: MutationTree<IPageState> = {
  SET_isShowPagePreview(state: IPageState, isShowPagePreview: boolean) {
    state.isShowPagePreview = isShowPagePreview
  },
  SET_PagesPerRow(state: IPageState, pagesPerRow: number) {
    state.pagesPerRow = pagesPerRow
  },
  SET_detailPageMode(state: IPageState, bool: boolean) {
    state.detailPageMode = bool
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
