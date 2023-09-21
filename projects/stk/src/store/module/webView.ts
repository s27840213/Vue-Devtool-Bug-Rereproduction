import { ICallbackRecord, IUserInfo } from '@/interfaces/webView'
import picWVUtils from '@/utils/picWVUtils'
import { GetterTree, MutationTree } from 'vuex'

export interface IWebViewState {
  userInfo: IUserInfo
  inBrowserMode: boolean
  inReviewMode: boolean
  inDevMode: boolean
  callbackRecords: ICallbackRecord[]
}

const getDefaultState = (): IWebViewState => ({
  userInfo: picWVUtils.getDefaultUserInfo(),
  inBrowserMode: true,
  inReviewMode: false,
  inDevMode: false,
  callbackRecords: [],
})

const state = getDefaultState()
const getters: GetterTree<IWebViewState, unknown> = {
  getUserInfo(state: IWebViewState): IUserInfo {
    return state.userInfo
  },
  getInDevMode(state: IWebViewState): boolean {
    return state.inDevMode
  },
  getInBrowserMode(state: IWebViewState): boolean {
    return state.inBrowserMode
  },
  getInReviewMode(state: IWebViewState): boolean {
    return state.inReviewMode
  },
  getCallbackRecords(state: IWebViewState): ICallbackRecord[] {
    return state.callbackRecords
  },
}

const mutations: MutationTree<IWebViewState> = {
  SET_userInfo(state: IWebViewState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  UPDATE_userInfo(state: IWebViewState, userInfo: Partial<IUserInfo>) {
    Object.assign(state.userInfo, userInfo)
  },
  UPDATE_detectIfInReviewMode(state: IWebViewState, reviewVer: string) {
    state.inReviewMode = reviewVer === state.userInfo.appVer
  },
  SET_inBrowserMode(state: IWebViewState, inBrowserMode: boolean) {
    state.inBrowserMode = inBrowserMode
  },
  SET_inReviewMode(state: IWebViewState, inReviewMode: boolean) {
    state.inReviewMode = inReviewMode
  },
  UPDATE_addCallbackRecord(state: IWebViewState, callbackRecord: ICallbackRecord) {
    state.callbackRecords.push(callbackRecord)
  },
  UPDATE_clearCallbackRecords(state: IWebViewState) {
    state.callbackRecords = []
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
