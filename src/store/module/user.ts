import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import * as Sentry from '@sentry/browser'
import userApis from '@/apis/user'
import uploadUtils from '@/utils/uploadUtils'
import { IAssetPhoto, IGroupDesignInputParams, IUserAssetsData, IUserImageContentData } from '@/interfaces/api'
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
  userAssets: {
    design: {
      content: []
    },
    font: {
      content: []
    },
    image: {
      content: []
    },
    video: {
      content: []
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
  getUserAssets(state) {
    return state.userAssets
  },
  getDownloadUrl(state) {
    return state.downloadUrl
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
  [SET_IMAGES](state: IUserModule) {
    const { userAssets, downloadUrl } = state
    const isAdmin = state.role === 0
    const images = userAssets.image.content.map((image: IUserImageContentData) => {
      const aspectRatio = image.width / image.height
      const prevW = image.width > image.height ? image.width : 384 * aspectRatio
      const prevH = image.height > image.width ? image.height : 384 / aspectRatio
      return {
        width: image.width,
        height: image.height,
        id: image.id,
        preview: {
          width: prevW,
          height: prevH
        },
        urls: {
          prev: isAdmin ? downloadUrl.replace('*', `asset/image/${image.id}/prev`) : image.signed_url?.prev ?? '',
          full: isAdmin ? downloadUrl.replace('*', `asset/image/${image.id}/full`) : image.signed_url?.full ?? '',
          larg: isAdmin ? downloadUrl.replace('*', `asset/image/${image.id}/larg`) : image.signed_url?.larg ?? '',
          original: isAdmin ? downloadUrl.replace('*', `asset/image/${image.id}/original`) : image.signed_url?.original ?? ''
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
        original: imageFile.src
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
  [UPDATE_IMAGE_URLS](state: IUserModule, { assetId }) {
    const { images, downloadUrl } = state
    const targetIndex = state.images.findIndex((img: IAssetPhoto) => {
      return img.id === assetId
    })
    const targetUrls = {
      prev: downloadUrl.replace('*', `asset/image/${images[targetIndex].id}/prev`),
      full: downloadUrl.replace('*', `asset/image/${images[targetIndex].id}/full`),
      larg: downloadUrl.replace('*', `asset/image/${images[targetIndex].id}/larg`),
      original: downloadUrl.replace('*', `asset/image/${images[targetIndex].id}/original`)
    }

    images[targetIndex].urls = targetUrls
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
      console.log(data)
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
      modalUtils.setIsModalOpen(true)
      if (flag === 0) {
        modalUtils.setModalInfo('上傳成功', [`Group ID: ${params.group_id}`])
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
      } else if (type === 3) {
        console.group('Update DB and preview')
      }
      const { data } = await userApis.putAssetDesign(state.token, state.teamId || state.userId, assetId, type)
      const { flag } = data
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
      state.isAuthenticated = token.length > 0
      const { data } = await userApis.login(token, account, password)
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
        role: data.data.role
      })
      uploadUtils.setLoginOutput(data.data)
      commit('SET_TOKEN', newToken)
      dispatch('getAssets', { token: newToken })
      uploadUtils.uploadTmpJSON()
    } else {
      console.log('login failed')
      commit('SET_TOKEN', '')
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
