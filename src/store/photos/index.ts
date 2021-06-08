import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import apis from '@/apis/unsplash'
import { IPhoto } from '@/interfaces/api'

const SET_STATE = 'SET_STATE' as const
const SET_TOTAL_PAGES = 'SET_TOTAL_PAGES' as const

interface IPhotoState {
  list: IPhoto[],
  query: string,
  page: number,
  totalPages: number,
  pending: boolean
}

const getDefaultState = (): IPhotoState => ({
  list: [],
  query: '',
  page: 0,
  totalPages: 0,
  pending: false
})

const actions: ActionTree<IPhotoState, unknown> = {
  async getPhotosByUnsplash ({ commit }, params = {}) {
    commit(SET_STATE, { pending: true, list: [] })
    try {
      const {
        results,
        total_pages: totalPages
      } = await apis.getPhotos(params)
      commit(SET_STATE, {
        list: results,
        totalPages,
        page: 1,
        pending: false,
        ...params
      })
    } catch (error) {
      console.log(error)
    }
  },
  async getMorePhotos ({ commit, getters, state }) {
    const { list } = state
    const { getNextParams } = getters
    commit(SET_STATE, { pending: true })
    try {
      const { results } = await apis.getPhotos(getNextParams)
      commit(SET_STATE, {
        list: list.concat(results),
        pending: false,
        ...getNextParams
      })
    } catch (error) {
      console.log(error)
    }
  }
}

const mutations: MutationTree<IPhotoState> = {
  [SET_STATE] (state: IPhotoState, data: Partial<IPhotoState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPhotoState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  [SET_TOTAL_PAGES] (state, totalPages) {
    state.totalPages = totalPages
  }
}

const getters: GetterTree<IPhotoState, any> = {
  getPhotos (state) {
    return state.list
  },
  getCurrentPagePhotos (state) {
    const { page, list } = state
    return list.slice((page - 1) * 10)
  },
  getNextParams (state) {
    const { query, page } = state
    return {
      query,
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
