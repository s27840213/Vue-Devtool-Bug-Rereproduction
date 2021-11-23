import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import * as Sentry from '@sentry/browser'
import userApis from '@/apis/user'
import uploadUtils from '@/utils/uploadUtils'
import { IAssetPhoto, IGroupDesignInputParams, IUserAssetsData, IUserFontContentData, IUserImageContentData } from '@/interfaces/api'
import modalUtils from '@/utils/modalUtils'

const SET_TOKEN = 'SET_TOKEN' as const
const SET_STATE = 'SET_STATE' as const
const SET_IMAGES = 'SET_IMAGES' as const
const ADD_PREVIEW = 'ADD_PREVIEW' as const
const UPDATE_PROGRESS = 'UPDATE_PROGRESS' as const
const UPDATE_IMAGE_URLS = 'UPDATE_IMAGE_URLS' as const
const UPDATE_CHECKED_ASSETS = 'UPDATE_CHECKED_ASSETS' as const
const ADD_CHECKED_ASSETS = 'ADD_CHECKED_ASSETS' as const
const DELETE_CHECKED_ASSETS = 'DELETE_CHECKED_ASSETS' as const
const CLEAR_CHECKED_ASSETS = 'CLEAR_CHECKED_ASSETS' as const
const SET_ADMIN_MODE = 'SET_ADMIN_MODE' as const

export interface IUserModule {
  token: string,
  uname: string,
  shortName: string,
  userId: string,
  teamId: string,
  role: number,
  adminMode: boolean,
  isAuthenticated: boolean,
  account: string,
  locale: string,
  subscribe: number,
  userAssets: IUserAssetsData,
  downloadUrl: string
  pending: boolean,
  images: Array<IAssetPhoto>,
  checkedAssets: Array<string>,
  verUni: number,
  imgSizeMap: Array<{ [key: string]: string | number }>
}

const getDefaultState = (): IUserModule => ({
  token: '',
  uname: '',
  shortName: '',
  userId: '',
  teamId: '',
  role: -1,
  adminMode: true,
  isAuthenticated: false,
  account: '',
  locale: '',
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
  pending: false,
  images: [],
  checkedAssets: [],
  verUni: 0,
  imgSizeMap: []
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
    return state.teamId
  },
  getToken(state) {
    return state.token
  },
  getAccount(state) {
    return state.account
  },
  getLocale(state) {
    return state.locale
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
  getImages(state) {
    return state.images
  },
  getIsPending(state) {
    return state.pending
  },
  getCheckedAssets(state) {
    return state.checkedAssets
  },
  getVerUni(state) {
    return state.verUni
  },
  isAdmin(state) {
    return state.role === 0
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
  // This function is out of date, may be modified in the future
  [SET_IMAGES](state: IUserModule) {
    const { userAssets, teamId, userId } = state
    const isAdmin = state.role === 0
    const images = userAssets.image.content.map((image: IUserImageContentData) => {
      const aspectRatio = image.width / image.height
      const prevW = image.width > image.height ? image.width : 384 * aspectRatio
      const prevH = image.height > image.width ? image.height : 384 / aspectRatio
      return {
        width: image.width,
        height: image.height,
        id: image.id,
        assetIndex: image.asset_index,
        preview: {
          width: prevW,
          height: prevH
        },
        urls: {
          prev: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/prev` : image.signed_url?.prev ?? '',
          full: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/full` : image.signed_url?.full ?? '',
          larg: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/larg` : image.signed_url?.larg ?? '',
          original: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/original` : image.signed_url?.original ?? '',
          midd: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/midd` : image.signed_url?.midd ?? '',
          smal: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/smal` : image.signed_url?.smal ?? '',
          tiny: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${image.id}/tiny` : image.signed_url?.tiny ?? ''
        }
      }
    })

    state.images = [...images]
    state.pending = false
  },
  [ADD_PREVIEW](state: IUserModule, { imageFile, assetId }) {
    const previewImage = {
      width: imageFile.width,
      height: imageFile.height,
      id: assetId,
      progress: 0,
      preview: {
        width: imageFile.width,
        height: imageFile.height
      },
      urls: {
        prev: imageFile.src,
        full: imageFile.src,
        larg: imageFile.src,
        original: imageFile.src,
        midd: imageFile.src,
        smal: imageFile.src,
        tiny: imageFile.src
      }
    }
    state.images.unshift(previewImage)
  },
  [UPDATE_PROGRESS](state: IUserModule, { assetId, progress }) {
    const targetIndex = state.images.findIndex((img: IAssetPhoto) => {
      return img.id === assetId
    })
    state.images[targetIndex].progress = progress
  },
  [UPDATE_IMAGE_URLS](state: IUserModule, { assetId, urls }) {
    const { images, teamId, userId } = state
    const isAdmin = state.role === 0
    const targetIndex = state.images.findIndex((img: IAssetPhoto) => {
      return isAdmin ? img.id === assetId : img.assetIndex === assetId
    })

    const targetUrls = {
      prev: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/prev` : urls.prev || '',
      full: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/full` : urls.full || '',
      larg: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/larg` : urls.larg || '',
      original: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/original` : urls.origin || '',
      midd: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/midd` : urls.midd || '',
      smal: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/smal` : urls.smal || '',
      tiny: isAdmin ? `https://template.vivipic.com/admin/${teamId || userId}/asset/image/${images[targetIndex].id}/tiny` : urls.tiny || ''
    }
    if (targetIndex === -1) {
      images.push({
        width: 500,
        height: 400,
        id: 'this is a test',
        assetIndex: assetId,
        preview: {
          width: 100,
          height: 200
        },
        urls
      })
    } else {
      images[targetIndex].urls = targetUrls
    }
  },
  [UPDATE_CHECKED_ASSETS](state: IUserModule, val) {
    state.checkedAssets = [...val]
  },
  [ADD_CHECKED_ASSETS](state: IUserModule, id) {
    state.checkedAssets.push(id)
  },
  [DELETE_CHECKED_ASSETS](state: IUserModule, id: string) {
    const targetIndex = state.checkedAssets.findIndex((assetId) => {
      return assetId === id
    })
    state.checkedAssets.splice(targetIndex, 1)
  },
  [CLEAR_CHECKED_ASSETS](state: IUserModule) {
    state.checkedAssets = []
  },
  [SET_ADMIN_MODE](state: IUserModule, mode: boolean) {
    state.adminMode = mode
  }
}

const actions: ActionTree<IUserModule, unknown> = {
  async getAssets({ commit }, { token }) {
    try {
      const { data } = await userApis.getAssets(token)
      // console.warn(data)
      commit(SET_STATE, {
        pending: true,
        contents: [],
        userAssets: data.data
      })

      commit(SET_IMAGES)
    } catch (error) {
      console.log(error)
    }
  },
  async deleteAssets({ commit, dispatch }) {
    try {
      const keyList = state.checkedAssets.join(',')
      const { data } = await userApis.deleteAssets(state.token, keyList)
      dispatch('getAssets', { token: state.token })
      commit('CLEAR_CHECKED_ASSETS')
    } catch (error) {
      console.log(error)
    }
  },
  async groupDesign({ commit }, params: IGroupDesignInputParams) {
    try {
      const { data } = await userApis.groupDesign(params)
      const { flag, msg } = data
      const isDelete = params.list?.length === 0 && params.update === 1
      modalUtils.setIsModalOpen(true)
      if (flag === 0) {
        if (!isDelete) {
          modalUtils.setModalInfo('上傳成功', [`Group ID: ${params.group_id}`])
        } else {
          modalUtils.setModalInfo('刪除成功', [])
        }
        console.log(`Success: ${params.group_id}}`)
      } else if (flag === 1) {
        modalUtils.setModalInfo('上傳失敗', [`Error msg: ${msg}`])
        console.log(`Failed: ${msg}`)
      } else if (flag === 2) {
        modalUtils.setModalInfo('上傳失敗', [`Error msg: ${msg}`])
        console.log(`Invalid token: ${msg}`)
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
        dispatch('getAssets', { token: state.token })
      }
      if (flag === 1) {
        console.log('Put asset failed')
      } else if (flag === 2) {
        console.log('Token invalid!')
      }
    } catch (error) {
      console.log(error)
    }
  },
  async login({ commit, dispatch }, { token, account, password }) {
    try {
      const { data } = await userApis.login(token, account, password)
      state.isAuthenticated = token.length > 0
      console.log(data)
      await dispatch('loginSetup', { data: data })
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async register({ commit }, { uname, account, upass }) {
    try {
      const meta = { uname: uname, account: account, upass: upass }
      const { data } = await userApis.register('token', JSON.stringify(meta))
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async loginSetup({ commit, dispatch }, { data }) {
    if (data.flag === 0) {
      const newToken = data.data.token as string // token may be refreshed
      const uname = data.data.user_name
      const shortName = uname.substring(0, 1).toUpperCase()
      Sentry.setTag('user_name', uname)
      Sentry.setTag('user_id', data.data.user_id)
      commit('SET_STATE', {
        downloadUrl: data.data.download_url,
        uname: uname,
        shortName: shortName,
        userId: data.data.user_id,
        role: data.data.role,
        account: data.data.account,
        locale: data.data.locale,
        subscribe: data.data.subscribe
      })
      uploadUtils.setLoginOutput(data.data)
      commit('SET_TOKEN', newToken)
      dispatch('getAssets', { token: newToken })
    } else {
      console.log('login failed')
      commit('SET_TOKEN', '')
    }
  },
  /* eslint-disable camelcase */
  async sendVcode({ commit }, { uname, account, upass, register, vcode_only, type, token }) {
    try {
      const { data } = await userApis.sendVcode(uname, account, upass, register, vcode_only, type, token)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  /* eslint-disable camelcase */
  async verifyVcode({ commit }, { account, vcode, token }) {
    try {
      const { data } = await userApis.verifyVcode(account, vcode, token)
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
  // as private images expire, redraw these images
  async updateImages({ state, commit }, { assetSet }) {
    const { token } = state
    const { data } = await userApis.getAssets(token, {
      asset_list: assetSet,
      team_id: state.teamId || state.userId
    })
    const urlSet = data.url_map as { [assetId: string]: { [urls: string]: string } }
    if (urlSet) {
      for (const [assetId, urls] of Object.entries(urlSet)) {
        commit(UPDATE_IMAGE_URLS, { assetId: +assetId, urls })
      }
    } else {
      throw new Error('fail to fetch private image urls')
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
