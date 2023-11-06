import { ICallbackRecord, IUserInfo } from '@/interfaces/webView'
import picWVUtils from '@/utils/picWVUtils'
import { GetterTree, MutationTree } from 'vuex'

export interface IWebViewState {
  appLoadedTimeout: number
  userInfo: IUserInfo
  controllerHidden: boolean
  inBrowserMode: boolean
  inReviewMode: boolean
  inDevMode: boolean
  callbackRecords: ICallbackRecord[]
}

const getDefaultState = (): IWebViewState => ({
  appLoadedTimeout: -1,
  userInfo: picWVUtils.getDefaultUserInfo(),
  controllerHidden: false,
  inBrowserMode: true,
  inReviewMode: false,
  inDevMode: false,
  callbackRecords: [],
})

const state = getDefaultState()
const getters: GetterTree<IWebViewState, unknown> = {
  getAppLoadedTimeout(state: IWebViewState): number {
    return state.appLoadedTimeout
  },
  getUserInfo(state: IWebViewState): IUserInfo {
    return state.userInfo
  },
  getControllerHidden(state: IWebViewState): boolean {
    return state.controllerHidden
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
  SET_appLoadedTimeout(state: IWebViewState, appLoadedTimeout: number) {
    state.appLoadedTimeout = appLoadedTimeout
  },
  SET_userInfo(state: IWebViewState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_controllerHidden(state: IWebViewState, controllerHidden: boolean) {
    state.controllerHidden = controllerHidden
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
