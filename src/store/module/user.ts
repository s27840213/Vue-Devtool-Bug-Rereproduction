/* eslint-disable camelcase */
import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import * as Sentry from '@sentry/browser'
import userApis from '@/apis/user'
import uploadUtils from '@/utils/uploadUtils'
import { IAssetPhoto, IGroupDesignInputParams, IUserAssetsData, IUserFontContentData, IUserImageContentData } from '@/interfaces/api'
import modalUtils from '@/utils/modalUtils'
import Vue from 'vue'
import themeUtils from '@/utils/themeUtils'
import i18n from '@/i18n'
// import apiUtils from '@/utils/apiUtils'
import generalUtils from '@/utils/generalUtils'

const SET_TOKEN = 'SET_TOKEN' as const
const SET_STATE = 'SET_STATE' as const
const SET_ADMIN_MODE = 'SET_ADMIN_MODE' as const

export interface IUserModule {
  token: string,
  uname: string,
  shortName: string,
  userId: string,
  teamId: string,
  role: number,
  roleRaw: number,
  adminMode: boolean,
  isAuthenticated: boolean,
  account: string,
  upassUpdate: string,
  subscribe: number,
  userAssets: IUserAssetsData,
  downloadUrl: string
  verUni: number,
  imgSizeMap: Array<{ [key: string]: string | number }>,
  avatar: {
    prev: string,
    prev_2x: string,
    prev_4x: string
  },
  viewGuide: number
}

const getDefaultState = (): IUserModule => ({
  token: '',
  uname: '',
  shortName: '',
  userId: '',
  teamId: '',
  role: -1,
  roleRaw: -1,
  adminMode: true,
  isAuthenticated: false,
  account: '',
  upassUpdate: '',
  subscribe: 1,
  userAssets: {
    design: {
      content: [],
      title: ''
    },
    font: {
      content: [],
      title: ''
    },
    image: {
      content: [],
      title: ''
    },
    video: {
      content: [],
      title: ''
    }
  },
  downloadUrl: '',
  verUni: 0,
  imgSizeMap: [],
  avatar: {
    prev: '',
    prev_2x: '',
    prev_4x: ''
  },
  viewGuide: +localStorage.guest_view_guide || 0
})

const state = getDefaultState()

const getters: GetterTree<IUserModule, any> = {
  isLogin: state => {
    return state.isAuthenticated
  },
  getUserId: state => {
    return state.userId
  },
  getTeamId: state => {
    return state.teamId ? state.teamId : state.userId
  },
  getToken(state) {
    return state.token
  },
  getAccount(state) {
    return state.account
  },
  getUpassUpdate(state) {
    return state.upassUpdate
  },
  getSubscribe(state) {
    return state.subscribe
  },
  getUserAssets(state) {
    return state.userAssets
  },
  getDownloadUrl(state) {
    return state.downloadUrl
  },
  getAssetDesign(state) {
    return state.userAssets.design.content
  },
  getAssetFonts(state) {
    const { role, teamId, userId, userAssets } = state
    const isAdmin = role === 0

    return userAssets.font.content.map((font: IUserFontContentData) => {
      return {
        original: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/font/${font.id}/original` : font.signed_url?.original ?? '',
        font: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/font/${font.id}/font` : font.signed_url?.font ?? '',
        'prev-name': isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/font/${font.id}/prev-name` : font.signed_url?.['prev-name'] ?? '',
        'prev_2x-name': isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/font/${font.id}/prev_2x-name` : font.signed_url?.['prev_2x-name'] ?? '',
        'prev-sample': isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/font/${font.id}/prev-sample` : font.signed_url?.['prev-sample'] ?? '',
        'prev-2x-sample': isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/font/${font.id}/prev-2x-sample` : font.signed_url?.['prev-2x-sample'] ?? ''
      }
    })
  },
  getVerUni(state) {
    return state.verUni
  },
  isAdmin(state) {
    return state.role === 0
  },
  isOutsourcer(state) {
    return state.role === 0 && state.roleRaw === 3
  },
  getAvatar(state) {
    return state.avatar
  },
  hasAvatar(): boolean {
    return state.avatar.prev_2x !== undefined
  },
  getViewGuide(state): number {
    return state.viewGuide
  },
  getImgSizeMap(state): Array<{ [key: string]: string | number }> {
    return state.imgSizeMap
  }
}

const mutations: MutationTree<IUserModule> = {
  [SET_TOKEN](state: IUserModule, token: string) {
    state.isAuthenticated = token.length > 0
    state.token = token
    localStorage.setItem('token', token)
  },
  [SET_STATE](state: IUserModule, data: Partial<IUserModule>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IUserModule>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  [SET_ADMIN_MODE](state: IUserModule, mode: boolean) {
    state.adminMode = mode
  }
}

const actions: ActionTree<IUserModule, unknown> = {
  async getAllAssets({ commit, dispatch }, { token }) {
    try {
      const { data } = await userApis.getAllAssets(token)
      // console.warn(data)
      commit(SET_STATE, {
        pending: true,
        contents: [],
        userAssets: data.data
      })

      dispatch('file/initImages', {
        imgs: data.data.image.content
      }, {
        root: true
      })
    } catch (error) {
      console.log(error)
    }
  },
  async groupDesign({ commit, dispatch }, params: IGroupDesignInputParams) {
    try {
      const { data } = await userApis.groupDesign(params)
      const { flag, group_id: groupId, msg } = data
      console.log(data)
      const isDelete = params.list?.length === 0 && params.update === 1
      modalUtils.setIsModalOpen(true)
      if (flag === 0) {
        commit('SET_groupId', groupId, { root: true })
        if (!isDelete) {
          modalUtils.setModalInfo('上傳成功', [`Group ID: ${groupId}`], '')
          commit('SET_groupType', params.ecomm, { root: true })
        } else {
          modalUtils.setModalInfo('刪除成功', [], '')
          commit('SET_groupId', '', { root: true })
          commit('SET_groupType', 0, { root: true })
        }
        themeUtils.fetchTemplateContent()
        console.log(`Success: ${groupId}}`)
      } else if (flag === 1) {
        modalUtils.setModalInfo('上傳失敗', [`Error msg: ${msg}`], '')
        commit('SET_groupId', '', { root: true })
        console.log(`Failed: ${msg}`)
      } else if (flag === 2) {
        modalUtils.setModalInfo('上傳失敗', [`Error msg: ${msg}`], '')
        commit('SET_groupId', '', { root: true })
      }
    } catch (error) {
      console.log(error)
    }
  },
  async putAssetDesign({ commit, dispatch }, { assetId, type }) {
    try {
      if (type === 0) {
        console.log('Update DB')
      } else if (type === 1) {
        console.log('Update preview')
      } else if (type === 2) {
        console.log('Update DB and preview')
      }
      const { data } = await userApis.putAssetDesign(state.token, state.teamId || state.userId, assetId, type)
      const { flag } = data
      if (flag === 0) {
        console.log('Put asset success')
        dispatch('getAllAssets', { token: state.token })
        Vue.notify({ group: 'copy', text: `${i18n.t('NN0357')}` })
      }
      if (flag === 1) {
        console.log('Put asset failed')
        Vue.notify({ group: 'error', text: `${i18n.t('NN0360')}` })
      } else if (flag === 2) {
        console.log('Token invalid!')
        Vue.notify({ group: 'error', text: `${i18n.t('NN0360')}` })
      }
    } catch (error) {
      console.log(error)
    }
  },
  async login({ commit, dispatch }, { token, account, password }) {
    try {
      const { data } = await userApis.login(token, account, password)
      state.isAuthenticated = token.length > 0
      await dispatch('loginSetup', { data: data })
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async register({ commit }, { uname, account, upass, locale }) {
    try {
      const meta = { uname: uname, account: account, upass: upass, locale: locale }
      const { data } = await userApis.register('token', JSON.stringify(meta))
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async loginSetup({ commit, dispatch }, { data }) {
    if (data.flag === 0) {
      generalUtils.fbq('track', 'StartTrial')
      const newToken = data.data.token as string // token may be refreshed
      const uname = data.data.user_name
      const shortName = uname.substring(0, 1).toUpperCase()
      const guestViewGuide = localStorage.guest_view_guide
      let userViewGuide = data.data.view_guide
      Sentry.setTag('user_name', uname)
      Sentry.setTag('user_id', data.data.user_id)

      if (['1', '2'].includes(guestViewGuide) && userViewGuide === 0) {
        // 如果先看完導覽(2)/略過(1)再登入, 且原使用者狀態為沒看過(0), 則更新狀態
        userViewGuide = +guestViewGuide
        localStorage.removeItem('guest_view_guide')
        userApis.updateUserViewGuide(newToken, userViewGuide)
      }

      commit('SET_STATE', {
        downloadUrl: data.data.download_url,
        uname: uname,
        shortName: shortName,
        userId: data.data.user_id,
        role: data.data.role,
        roleRaw: data.data.roleRaw,
        account: data.data.account,
        upassUpdate: data.data.upass_update,
        subscribe: data.data.subscribe,
        avatar: data.data.avatar,
        viewGuide: userViewGuide
      })
      commit('payment/SET_state', {
        isPro: data.data.plan_subscribe === 1,
        isCancelingPro: data.data.plan_stop_subscribe === 1,
        myPaidDate: data.data.plan_due_time
      }, { root: true })

      // locale settings
      process.env.NODE_ENV === 'development' && console.log(data.data)
      const locale = localStorage.getItem('locale') as string
      if (locale !== data.data.locale) {
        i18n.locale = data.data.locale
        localStorage.setItem('locale', data.data.locale)
      }
      uploadUtils.setLoginOutput(data.data)
      commit('SET_TOKEN', newToken)
      dispatch('getAllAssets', { token: newToken })
    } else {
      console.log('login failed')
      commit('SET_TOKEN', '')
    }
  },

  async sendVcode({ commit }, { uname, account, upass, register, vcode_only, type, token, locale }) {
    try {
      const { data } = await userApis.sendVcode(uname, account, upass, register, vcode_only, type, token, locale)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },

  async verifyVcode({ commit }, { account, vcode, token, type }) {
    try {
      const { data } = await userApis.verifyVcode(account, vcode, token, type)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async updateUser({ commit }, { token, account, upass, uname, locale, subscribe }) {
    try {
      const { data } = await userApis.updateUser(token, account, upass, uname, locale, subscribe)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async removeBg({ state }, { srcObj, aspect }) {
    try {
      srcObj = JSON.stringify(srcObj)
      const { data } = await userApis.removeBg(srcObj, aspect)
      return data
    } catch (error) {
      console.log(error)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IUserModule>
