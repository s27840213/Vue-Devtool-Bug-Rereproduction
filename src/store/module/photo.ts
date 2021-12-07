import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { captureException } from '@sentry/browser'
import i18n from '@/i18n'
import photos from '@/apis/photos'
import { IPhotoItem } from '@/interfaces/api'

const SET_STATE = 'SET_STATE' as const
const REGEX_JAPANESE = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f]/

interface IPhotoState {
  list: Array<IPhotoItem[]>,
  keyword: string,
  locale: string,
  pageIndex: number,
  pending: boolean
}

const getDefaultState = (): IPhotoState => ({
  list: [],
  keyword: '',
  locale: '',
  pageIndex: 1,
  pending: false
})

const actions: ActionTree<IPhotoState, unknown> = {
  async getPhotos({ commit }, params = {}) {
    const browserLocale = i18n.locale.split('-').slice(-1)[0].toLowerCase()
    let { locale = browserLocale, pageIndex = 1, keyword } = params
    // if japanese keyword
    keyword && REGEX_JAPANESE.test(keyword) && (locale = 'ja')
    commit(SET_STATE, { pending: true, locale, list: [] })
    try {
      const { data: { data } } = await photos.getUnsplash({ locale, pageIndex, keyword })
      commit(SET_STATE, {
        list: new Array(pageIndex - 1).fill([]).concat(data.content[0].list),
        pageIndex,
        keyword,
        pending: false
      })
    } catch (error) {
      captureException(error)
    }
  },
  async getMorePhotos({ commit, getters, state }) {
    const { list } = state
    const { locale, pageIndex, keyword } = getters.getNextParams
    commit(SET_STATE, { pending: true })
    try {
      const { data: { data } } = await photos.getUnsplash({ locale, pageIndex, keyword })
      commit(SET_STATE, {
        list: list.concat(data.content[0].list),
        pending: false,
        pageIndex
      })
    } catch (error) {
      captureException(error)
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
          (state[key] as any) = newState[key]
        }
      })
  }
}

const getters: GetterTree<IPhotoState, any> = {
  getCurrentPagePhotos(state) {
    const { pageIndex, list } = state
    return list[pageIndex] || []
  },
  getNextParams(state) {
    const { keyword, pageIndex, locale } = state
    return {
      keyword,
      locale,
      pageIndex: pageIndex + 1
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
