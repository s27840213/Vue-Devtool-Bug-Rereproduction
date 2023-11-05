import cmWVUtils, { IUserInfo } from '@/utils/cmWVUtils'
import { GetterTree, MutationTree } from 'vuex'

export interface ICmWVState {
  userInfo: IUserInfo,
  inBrowserMode: boolean,
  isDuringCopy: boolean,
}

const getDefaultState = (): ICmWVState => ({
  userInfo: cmWVUtils.getDefaultUserInfo(),
  inBrowserMode: false,
  isDuringCopy: false,
})

const state = getDefaultState()
const getters: GetterTree<ICmWVState, unknown> = {
  getUserInfo(state: ICmWVState): IUserInfo {
    return state.userInfo
  },
  getInBrowserMode(state: ICmWVState): boolean {
    return state.inBrowserMode
  },
  getIsDuringCopy(state: ICmWVState): boolean {
    return state.isDuringCopy
  }
}

const mutations: MutationTree<ICmWVState> = {
  SET_userInfo(state: ICmWVState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_inBrowserMode(state: ICmWVState, inBrowserMode: boolean) {
    state.inBrowserMode = inBrowserMode
  },
  SET_isDuringCopy(state: ICmWVState, isDuringCopy: boolean) {  
    state.isDuringCopy = isDuringCopy
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations
}
