import { GetterTree, MutationTree } from 'vuex'
import cmWVUtils, { IUserInfo } from '@/utils/cmWVUtils'

export interface ICmWVState {
  userInfo: IUserInfo,
  isStandaloneMode: boolean,
  isDuringCopy: boolean,
}

const getDefaultState = (): ICmWVState => ({
  userInfo: cmWVUtils.getDefaultUserInfo(),
  isStandaloneMode: false,
  isDuringCopy: false,
})

const state = getDefaultState()
const getters: GetterTree<ICmWVState, unknown> = {
  getUserInfo(state: ICmWVState): IUserInfo {
    return state.userInfo
  },
  getIsStandaloneMode(state: ICmWVState): boolean {
    return state.isStandaloneMode
  },
  getIsDuringCopy(state: ICmWVState): boolean {
    return state.isDuringCopy
  }
}

const mutations: MutationTree<ICmWVState> = {
  SET_userInfo(state: ICmWVState, userInfo: IUserInfo) {
    state.userInfo = userInfo
  },
  SET_isStandaloneMode(state: ICmWVState, isStandaloneMode: boolean) {
    state.isStandaloneMode = isStandaloneMode
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
