import cmWVUtils, { IUserInfo } from '@/utils/cmWVUtils'
import { GetterTree, MutationTree } from 'vuex'

export interface ICmWVState {
  appLoadedTimeout: number,
  userInfo: IUserInfo,
  debugMode: boolean,
  inBrowserMode: boolean,
  isDuringCopy: boolean,
  isNoBg: boolean,
  loadedFonts: { [key: string]: true },
  modalInfo: { [key: string]: any },
}

const getDefaultState = (): ICmWVState => ({
  appLoadedTimeout: -1,
  userInfo: cmWVUtils.getDefaultUserInfo(),
  debugMode: false,
  inBrowserMode: false,
  isDuringCopy: false,
  isNoBg: false,
  loadedFonts: {},
  modalInfo: {},
})

const state = getDefaultState()
const getters: GetterTree<ICmWVState, unknown> = {
  getAppLoadedTimeout(state: ICmWVState): number {
    return state.appLoadedTimeout
  },
  getUserInfo(state: ICmWVState): IUserInfo {
    return state.userInfo
  },
  getDebugMode(state: ICmWVState): boolean {
    return state.debugMode
  },
  getInBrowserMode(state: ICmWVState): boolean {
    return state.inBrowserMode
  },
  getIsDuringCopy(state: ICmWVState): boolean {
    return state.isDuringCopy
  },
  getIsNoBg(state: ICmWVState): boolean {
    return state.isNoBg
  },
  getLoadedFonts(state: ICmWVState): { [key: string]: true } {
    return state.loadedFonts
  },
  getModalInfo(state: ICmWVState): { [key: string]: string } {
    return state.modalInfo
  },
}

const mutations: MutationTree<ICmWVState> = {
  SET_appLoadedTimeout(state: ICmWVState, appLoadedTimeout: number) {
    state.appLoadedTimeout = appLoadedTimeout
  },
  SET_userInfo(state: ICmWVState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  UPDATE_userInfo(state: ICmWVState, userInfo: Partial<IUserInfo>) {
    Object.assign(state.userInfo, userInfo)
  },
  SET_debugMode(state: ICmWVState, debugMode: boolean) {
    state.debugMode = debugMode
  },
  SET_inBrowserMode(state: ICmWVState, inBrowserMode: boolean) {
    state.inBrowserMode = inBrowserMode
  },
  SET_isDuringCopy(state: ICmWVState, isDuringCopy: boolean) {  
    state.isDuringCopy = isDuringCopy
  },
  SET_isNoBg(state: ICmWVState, isNoBg: boolean) {
    state.isNoBg = isNoBg
  },
  SET_loadedFonts(state: ICmWVState, loadedFonts: { [key: string]: true }) {
    state.loadedFonts = loadedFonts
  },
  UPDATE_addLoadedFont(state: ICmWVState, font: string) {
    state.loadedFonts[font] = true
  },
  SET_modalInfo(state: ICmWVState, modalInfo: { [key: string]: any }) {
    state.modalInfo = modalInfo
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
