import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import unsplash from '@/apis/unsplash'
import pexels from '@/apis/pexels'
import { IPhoto } from '@/interfaces/api'

const UNSPLASH_PER_PAGE = 30 as const
const PEXELS_PER_PAGE = 50 as const
const SET_STATE = 'SET_STATE' as const
const SET_TOTAL_PAGES = 'SET_TOTAL_PAGES' as const

interface IPhotoState {
  list: IPhoto[],
  query: string,
  page: number,
  perPage: number,
  totalPages: number,
  pending: boolean
}

const getDefaultState = (): IPhotoState => ({
  list: [],
  query: '',
  page: 0,
  perPage: 0,
  totalPages: 0,
  pending: false
})

const actions: ActionTree<IPhotoState, unknown> = {
  async getPhotosFromUnsplash({ commit }, params = {}) {
    commit(SET_STATE, { pending: true, list: [] })
    if (!params.perPage) {
      params.perPage = UNSPLASH_PER_PAGE
    }
    try {
      const { results } = await (params.query ? unsplash.getPhotos(params) : unsplash.getPopularPhoto(params))
      commit(SET_STATE, {
        list: results,
        page: 1,
        pending: false,
        ...params
      })
    } catch (error) {
      console.log(error)
    }
  },
  async getMorePhotosFromUnsplash({ commit, getters, state }) {
    const { list } = state
    const { getNextParams: params } = getters
    commit(SET_STATE, { pending: true })
    try {
      const {
        results
      } = await (params.query ? unsplash.getPhotos(params) : unsplash.getPopularPhoto(params))
      commit(SET_STATE, {
        list: list.concat(results),
        pending: false,
        ...params
      })
    } catch (error) {
      console.log(error)
    }
  },
  async getPhotosFromPexels({ commit }, params = {}) {
    commit(SET_STATE, { pending: true, list: [] })
    if (!params.perPage) {
      params.perPage = PEXELS_PER_PAGE
    }
    try {
      const { results } = await (params.query ? pexels.getPhotos(params) : pexels.getCuratedPhoto(params))
      commit(SET_STATE, {
        list: results,
        page: 1,
        pending: false,
        ...params
      })
    } catch (error) {
      console.log(error)
    }
  },
  async getMorePhotosFromPexels({ commit, getters, state }) {
    const { list } = state
    const { getNextParams: params } = getters
    commit(SET_STATE, { pending: true })
    try {
      const {
        results
      } = await (params.query ? pexels.getPhotos(params) : pexels.getCuratedPhoto(params))
      commit(SET_STATE, {
        list: list.concat(results),
        pending: false,
        ...params
      })
    } catch (error) {
      console.log(error)
    }
  }
}

const mutations: MutationTree<IPhotoState> = {
  [SET_STATE](state: IPhotoState, data: Partial<IPhotoState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPhotoState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = newState[key]
        }
      })
  },
  [SET_TOTAL_PAGES](state, totalPages) {
    state.totalPages = totalPages
  }
}

const getters: GetterTree<IPhotoState, any> = {
  getPhotos(state) {
    return state.list
  },
  getCurrentPagePhotos(state) {
    const { page, list, perPage } = state
    return list.slice((page - 1) * perPage)
  },
  getNextParams(state) {
    const { query, page, perPage } = state
    return {
      query,
      perPage,
      page: page + 1
    }
  }
}

export default {
  namespaced: true,
  state: getDefaultState,
  getters,
  mutations,
  actions
} as ModuleTree<IPhotoState>
