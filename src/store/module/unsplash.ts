import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { captureException } from '@sentry/browser'
import i18n from '@/i18n'
import photos from '@/apis/photos'
import { IPhotoItem, IPhotoServiceData } from '@/interfaces/api'

const SET_STATE = 'SET_STATE' as const
const REGEX_JAPANESE = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f]/

interface IPhotoState {
  content: IPhotoItem[]
  searchResult: IPhotoItem[]
  keyword: string
  locale: string
  nextPage: number
  nextSearch: number
  pending: boolean
}

const getDefaultState = (): IPhotoState => ({
  content: [],
  searchResult: [],
  keyword: '',
  locale: '',
  nextPage: 1,
  nextSearch: 1,
  pending: false
})

const actions: ActionTree<IPhotoState, unknown> = {
  async getPhotos({ commit }, params = {}) {
    const browserLocale = i18n.locale.split('-').slice(-1)[0].toLowerCase()
    let { locale = browserLocale, pageIndex = 1, keyword } = params
    // if japanese keyword
    keyword && REGEX_JAPANESE.test(keyword) && (locale = 'ja')
    commit(SET_STATE, { pending: true, locale })
    if (keyword)commit('SET_STATE', { keyword })
    try {
      const { data: { data } } = await photos.getUnsplash({ locale, pageIndex, keyword })
      commit('SET_CONTENT', { data, isSearch: !!keyword })
    } catch (error) {
      console.error(error)
      captureException(error)
    }
  },
  async getMorePhotos({ commit, getters }) {
    const { locale, pageIndex, keyword } = getters.getNextParams

    commit(SET_STATE, { pending: true })
    try {
      const { data: { data } } = await photos.getUnsplash({ locale, pageIndex, keyword })
      commit('SET_CONTENT', { data, isSearch: !!keyword })
    } catch (error) {
      console.error(error)
      captureException(error)
    }
  },
  async resetSearch({ commit }) {
    commit('SET_STATE', {
      keyword: '',
      searchResult: []
    })
  }
}

const mutations: MutationTree<IPhotoState> = {
  [SET_STATE](state: IPhotoState, data: Partial<IPhotoState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IPhotoState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  SET_CONTENT(state: IPhotoState, { data, isSearch }: {data: IPhotoServiceData, isSearch: boolean}) {
    const { searchResult, content } = state
    const { next_page } = data

    const result = (isSearch ? searchResult : content).concat(data.content[0].list)
    if (isSearch) {
      state.searchResult = result
      state.nextSearch = next_page
    } else {
      state.content = result
      state.nextPage = next_page
    }
    state.pending = false
  }
}

const getters: GetterTree<IPhotoState, any> = {
  getCurrentPagePhotos(state) {
    const { nextPage, content } = state
    return content[nextPage] || []
  },
  getNextParams(state) {
    const { keyword, nextPage, nextSearch, locale } = state
    return {
      keyword,
      locale,
      pageIndex: keyword ? nextSearch : nextPage
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
