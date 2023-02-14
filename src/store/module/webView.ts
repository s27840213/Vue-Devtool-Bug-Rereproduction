import { IUserInfo } from '@/interfaces/webView'
import webViewUtils from '@/utils/webViewUtils'
import { GetterTree, MutationTree } from 'vuex'

interface IViviStickerState {
  userInfo: IUserInfo,
  isBrowserMode: boolean,
}

const getDefaultState = (): IViviStickerState => ({
  userInfo: webViewUtils.getDefaultUserInfo(),
  isBrowserMode: true
})

const state = getDefaultState()
const getters: GetterTree<IViviStickerState, unknown> = {
  getUserInfo(state: IViviStickerState): IUserInfo {
    return state.userInfo
  },
  getIsBrowserMode(state: IViviStickerState): boolean {
    return state.isBrowserMode
  }
}

const mutations: MutationTree<IViviStickerState> = {
  SET_userInfo(state: IViviStickerState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_isBrowserMode(state: IViviStickerState, isBrowserMode: boolean) {
    state.isBrowserMode = isBrowserMode
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
