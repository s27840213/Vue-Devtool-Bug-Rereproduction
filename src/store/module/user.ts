import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import userApis from '@/apis/user'
import store from '..'
import uploadUtils from '@/utils/uploadUtils'
import { IAssetPhoto, IUserAssetsData, IUserImageContentData } from '@/interfaces/api'

const SET_STATE = 'SET_STATE' as const
const SET_IMAGES = 'SET_IMAGES' as const
const ADD_PREVIEW = 'ADD_PREVIEW' as const
const UPDATE_PROGRESS = 'UPDATE_PROGRESS' as const
const UPDATE_IMAGE_URLS = 'UPDATE_IMAGE_URLS' as const
const UPDATE_CHECKED_ASSETS = 'UPDATE_CHECKED_ASSETS' as const
const ADD_CHECKED_ASSETS = 'ADD_CHECKED_ASSETS' as const
const DELETE_CHECKED_ASSETS = 'DELETE_CHECKED_ASSETS' as const
const CLEAR_CHECKED_ASSETS = 'CLEAR_CHECKED_ASSETS' as const

export interface IUserModule {
  token: string,
  userAssets: IUserAssetsData,
  downloadUrl: string
  pending: boolean,
  images: Array<IAssetPhoto>,
  checkedAssets: Array<string>
}

const getDefaultState = (): IUserModule => ({
  token: '',
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
  checkedAssets: []
})

const state = getDefaultState()

const getters: GetterTree<IUserModule, any> = {
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
  }
}

const actions: ActionTree<IUserModule, unknown> = {
  async getAssets({ commit }, { token }) {
    try {
      const { data } = await userApis.getAssets(token)
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
  async login({ commit }, { token, account, password }) {
    try {
      const { data } = await userApis.login(token, account, password)
      if (data.flag === 0) {
        commit('SET_STATE', {
          downloadUrl: data.data.download_url
        })
        uploadUtils.setLoginOutput(data.data)
      }
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
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
  async verifyVcode({ commit }, { type = '2', account, vcode, getUserId }) {
    try {
      const meta = { type: type, account: account, vcode: vcode, getUserId: getUserId }
      console.log(JSON.stringify(meta))
      const { data } = await userApis.register('token', JSON.stringify(meta))
      console.log('verify vcode', data)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  },
  async resetPassword({ commit }, { type = '3', account, upass }) {
    try {
      const meta = { type: type, account: account, upass: upass }
      console.log(JSON.stringify(meta))
      const { data } = await userApis.register('token', JSON.stringify(meta))
      console.log('Reset Password', data)
      return Promise.resolve(data)
    } catch (error) {
      console.log(error)
      return Promise.reject(error)
    }
  }
}

const mutations: MutationTree<IUserModule> = {
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
          prev: downloadUrl.replace('*', `asset/image/${image.id}/prev`),
          full: downloadUrl.replace('*', `asset/image/${image.id}/full`),
          larg: downloadUrl.replace('*', `asset/image/${image.id}/larg`),
          original: downloadUrl.replace('*', `asset/image/${image.id}/original`)
        }
      }
    })

    state.images = [...images]
    state.pending = false
  },
  [ADD_PREVIEW](state: IUserModule, { imageFile, assetId }) {
    console.log(assetId)
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
} as ModuleTree<IUserModule>
