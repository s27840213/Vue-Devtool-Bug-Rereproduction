import { GetterTree, MutationTree } from 'vuex'
import { floor } from 'lodash'
import pageUtils from '@/utils/pageUtils'
import generalUtils from '@/utils/generalUtils'
import groupUtils from '@/utils/groupUtils'

interface IPageState {
  isShowPagePreview: boolean,
  pagesPerRow: number,
  showPagePanel: boolean,
  isDragged: boolean,
  topBound: number
  bottomBound: number
}

const getDefaultState = (): IPageState => ({
  isShowPagePreview: false,
  pagesPerRow: floor((document.body.clientWidth - 130) / 180),
  showPagePanel: false,
  isDragged: false,
  topBound: -1,
  bottomBound: Number.MAX_SAFE_INTEGER
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
  },
  getTopBound(state: IPageState) {
    return state.topBound
  },
  getBottomBound(state: IPageState) {
    return state.bottomBound
  }
}

const mutations: MutationTree<IPageState> = {
  SET_STATE(state: IPageState, data: Partial<IPageState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPageState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = newState[key]
        }
      })
  },
  SET_isShowPagePreview(state: IPageState, isShowPagePreview: boolean) {
    state.isShowPagePreview = isShowPagePreview

    if (isShowPagePreview) {
      groupUtils.deselect()
    } else {
      // bcz when switch to page preview, editor-view box size is different
      // we need to wait it restore to the non-page-preview size then triggering fitPage
      pageUtils.fitPage()
      setTimeout(() => {
        pageUtils.scrollIntoPage(pageUtils.currActivePageIndex, 'auto')
        generalUtils.scrollToCenter(undefined, false, true)
      }, 0)
    }
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
