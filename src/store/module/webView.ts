import { IUserInfo } from '@/interfaces/webView'
import picWVUtils from '@/utils/picWVUtils'
import { GetterTree, MutationTree } from 'vuex'

interface IWebViewState {
  userInfo: IUserInfo
  inBrowserMode: boolean
  inReviewMode: boolean
}

const getDefaultState = (): IWebViewState => ({
  userInfo: picWVUtils.getDefaultUserInfo(),
  inBrowserMode: false,
  inReviewMode: false,
})

const state = getDefaultState()
const getters: GetterTree<IWebViewState, unknown> = {
  getUserInfo(state: IWebViewState): IUserInfo {
    return state.userInfo
  },
  getInBrowserMode(state: IWebViewState): boolean {
    return state.inBrowserMode
  },
  getInReviewMode(state: IWebViewState): boolean {
    return state.inReviewMode
  }
}

const mutations: MutationTree<IWebViewState> = {
  SET_userInfo(state: IWebViewState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_inBrowserMode(state: IWebViewState, inBrowserMode: boolean) {
    state.inBrowserMode = inBrowserMode
  },
  SET_inReviewMode(state: IWebViewState, reviewVer: string) {
    state.inReviewMode = reviewVer === state.userInfo.appVer
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
