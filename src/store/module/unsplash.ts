import photos from '@/apis/photos'
import i18n from '@/i18n'
import { IPhotoItem, IPhotoServiceData } from '@/interfaces/api'
import logUtils from '@/utils/logUtils'
import { captureException } from '@sentry/browser'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

const SET_STATE = 'SET_STATE' as const
const REGEX_JAPANESE = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f]/

export interface IUnaplashState {
  content: IPhotoItem[]
  searchResult: IPhotoItem[]
  keyword: string
  locale: string
  nextPage: number
  nextSearch: number
  pending: boolean
}

const getDefaultState = (): IUnaplashState => ({
  content: [],
  searchResult: [],
  keyword: '',
  locale: '',
  nextPage: 1,
  nextSearch: 1,
  pending: false
})

const actions: ActionTree<IUnaplashState, unknown> = {
  init({ dispatch, state }) {
    if (state.content.length !== 0) return
    dispatch('getPhotos', { keyword: '' })
  },
  async getPhotos({ commit }, params = {}) {
    const browserLocale = i18n.global.locale.split('-').slice(-1)[0].toLowerCase()
    let { locale = browserLocale, pageIndex = 1, keyword } = params
    // if japanese keyword
    keyword && REGEX_JAPANESE.test(keyword) && (locale = 'ja')
    commit(SET_STATE, { pending: true, locale })
    if (keyword) commit('SET_STATE', { keyword })
    try {
      const { data: { data } } = await photos.getUnsplash({ locale, pageIndex, keyword })
      commit('SET_CONTENT', { data, isSearch: !!keyword })
    } catch (error) {
      logUtils.setLogForError(error as Error)
      captureException(error)
    }
  },
  async getMorePhotos({ commit, getters }) {
    const { locale, pageIndex, keyword } = getters.getNextParams
    if (pageIndex === undefined || pageIndex < 0) return

    commit(SET_STATE, { pending: true })
    try {
      const { data: { data } } = await photos.getUnsplash({ locale, pageIndex, keyword })
      commit('SET_CONTENT', { data, isSearch: !!keyword })
    } catch (error) {
      logUtils.setLogForError(error as Error)
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

const mutations: MutationTree<IUnaplashState> = {
  [SET_STATE](state: IUnaplashState, data: Partial<IUnaplashState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IUnaplashState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = newState[key]
        }
      })
  },
  SET_CONTENT(state: IUnaplashState, { data, isSearch }: { data: IPhotoServiceData, isSearch: boolean }) {
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

const getters: GetterTree<IUnaplashState, any> = {
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
}
