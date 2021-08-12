import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { IUser } from '@/interfaces/user'
import userApis from '@/apis/user'
import store from '..'
import uploadUtils from '@/utils/uploadUtils'

const getDefaultState = (): IUser => ({
  token: '',
  userAssets: {},
  downloadUrl: ''
})

const state = getDefaultState()

const getters: GetterTree<IUser, any> = {
  getToken(state) {
    return state.token
  },
  getUserAssets(state) {
    return state.userAssets
  },
  getDownloadUrl(state) {
    return state.downloadUrl
  }
}

const actions: ActionTree<IUser, unknown> = {
  async getAssets({ commit }, { token }) {
    try {
      const { data } = await userApis.getAssets(token)
      console.log(data.data)
      commit('SET_userAssets', data.data)
    } catch (error) {
      console.log(error)
    }
  },
  async login({ commit }, { token, account, password }) {
    try {
      const { data } = await userApis.login(token, account, password)
      commit('SET_downloadUrl', data.data.download_url)
      uploadUtils.setLoginOutput(data.data)
    } catch (error) {
      console.log(error)
    }
  },
  async register({ commit }, { type = '0', uname, account, upass }) {
    try {
      const meta = { type: type, uname: uname, account: account, upass: upass }
      console.log(JSON.stringify(meta))
      const { data } = await userApis.register('token', JSON.stringify(meta))
      console.log('register', data)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async verifyVcode({ commit }, { type = '2', account, vcode }) {
    try {
      const meta = { type: type, account: account, vcode: vcode }
      console.log(JSON.stringify(meta))
      const { data } = await userApis.register('token', JSON.stringify(meta))
      console.log('verify vcode', data)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  }
}

const mutations: MutationTree<IUser> = {
  SET_token(state: IUser, token: string) {
    state.token = token
  },
  SET_userAssets(state: IUser, data: any) {
    state.userAssets = data
  },
  SET_downloadUrl(state: IUser, downloadUrl: string) {
    state.downloadUrl = downloadUrl
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IUser>
