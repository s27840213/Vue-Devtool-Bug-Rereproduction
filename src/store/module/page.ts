import { GetterTree, MutationTree } from 'vuex'
import { floor } from 'lodash'
import pageUtils from '@/utils/pageUtils'
import generalUtils from '@/utils/generalUtils'

interface IPageState {
  isShowPagePreview: boolean,
  pagesPerRow: number,
  showPagePanel: boolean,
  isDragged: boolean
}

const getDefaultState = (): IPageState => ({
  isShowPagePreview: false,
  pagesPerRow: floor((document.body.clientWidth - 130) / 180),
  showPagePanel: false,
  isDragged: false
})

const state = getDefaultState()
const getters: GetterTree<IPageState, unknown> = {
  getIsShowPagePreview(state: IPageState) {
    return state.isShowPagePreview
  },
  getPagesPerRow(state: IPageState) {
    return state.pagesPerRow
  },
  getShowPagePanel(state: IPageState) {
    return state.showPagePanel
  },
  getIsDragged(state: IPageState) {
    return state.isDragged
  }
}

const mutations: MutationTree<IPageState> = {
  SET_isShowPagePreview(state: IPageState, isShowPagePreview: boolean) {
    state.isShowPagePreview = isShowPagePreview

    pageUtils.fitPage()
    generalUtils.scrollToCenter(undefined, false, true)
  },
  SET_PagesPerRow(state: IPageState, pagesPerRow: number) {
    state.pagesPerRow = pagesPerRow
  },
  SET_showPagePanel(state: IPageState, bool: boolean) {
    state.showPagePanel = bool
  },
  SET_IsDragged(state: IPageState, bool: boolean) {
    state.isDragged = bool
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
