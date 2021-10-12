import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { IListServiceData } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'
import { captureException } from '@sentry/browser'
import list from '@/apis/list'

const SET_STATE = 'SET_STATE' as const
const SET_CONTENT = 'SET_CONTENT' as const
const SET_CATEGORIES = 'SET_CATEGORIES' as const
const SET_MORE_CONTENT = 'SET_MORE_CONTENT' as const
const SET_MORE_CATEGORY = 'SET_MORE_CATEGORY' as const

const getDefaultState = (): IListModuleState => ({
  content: {},
  categories: [],
  keyword: '',
  page: 0,
  perPage: 0,
  nextPage: 0,
  pending: false,
  host: '',
  data: '',
  preview: '',
  locale: 'tw',
  error: ''
})

const actions: ActionTree<IListModuleState, unknown> = {
  getCategories: async ({ commit, state }) => {
    const { locale } = state
    commit(SET_STATE, { pending: true, categories: [] })
    try {
      const { data } = await list.getFont({ locale, fontList: 1 })
      commit(SET_CATEGORIES, data.data)
    } catch (error) {
      captureException(error)
    }
  },

  getMoreCategory: async ({ commit, getters, state }) => {
    const { nextParams, hasNextPage } = getters
    const { pending } = state
    if (!hasNextPage || pending) { return }
    commit(SET_STATE, { pending: true })
    nextParams.keyword = undefined
    nextParams.listAll = 0
    try {
      const { data } = await list.getFont(nextParams)
      commit(SET_MORE_CATEGORY, data.data)
    } catch (error) {
      captureException(error)
    }
  },

  getContent: async ({ commit, state }, params = {}) => {
    const { locale } = state
    const { keyword } = params
    commit(SET_STATE, { pending: true, keyword, content: {} })
    try {
      const { data } = await list.getFont({ locale, keyword, searchTag: 1, fontList: 1 })
      commit(SET_CONTENT, data.data)
    } catch (error) {
      captureException(error)
    }
  },

  getMoreContent: async ({ commit, getters, state }) => {
    const { nextParams, hasNextPage } = getters
    const { pending } = state
    if (!hasNextPage || pending) { return }
    commit(SET_STATE, { pending: true })
    try {
      const { data } = await list.getFont(nextParams)
      commit(SET_MORE_CONTENT, data.data)
    } catch (error) {
      captureException(error)
    }
  },

  resetContent ({ commit }) {
    commit(SET_STATE, {
      content: {},
      keyword: '',
      page: 0,
      nextPage: 0
    })
  }
}

const mutations: MutationTree<IListModuleState> = {
  [SET_STATE] (state: IListModuleState, data: Partial<IListModuleState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IListModuleState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as any) = newState[key]
        }
      })
  },
  [SET_CATEGORIES] (state: IListModuleState, objects: IListServiceData) {
    state.categories = objects.content
    state.host = objects.host
    state.data = objects.data
    state.preview = objects.preview
    state.preview2 = objects.preview2
    state.pending = false
    state.nextPage = objects.next_page
  },
  [SET_CONTENT] (state: IListModuleState, objects: IListServiceData) {
    state.content = objects.content.find(content => content.list.length) || {}
    // state.content = objects.content[0] || {}
    state.host = objects.host
    state.data = objects.data
    state.preview = objects.preview
    state.preview2 = objects.preview2
    state.pending = false
    state.nextPage = objects.next_page
  },
  [SET_MORE_CONTENT] (state: IListModuleState, objects: IListServiceData) {
    const { list = [] } = state.content
    const { list: newList = [] } = objects.content.find(content => content.list.length) || {}
    state.content = {
      ...state.content,
      list: list.concat(newList)
    }
    state.pending = false
    state.nextPage = objects.next_page
  },
  [SET_MORE_CATEGORY] (state: IListModuleState, objects: IListServiceData) {
    for (let idx = 0; idx < objects.content.length; idx++) {
      state.categories[idx].list = state.categories[idx].list.concat(objects.content[idx].list)
    }
    state.pending = false
    state.nextPage = objects.next_page
  }
}

const getters: GetterTree<IListModuleState, any> = {
  nextParams (state) {
    const { nextPage, keyword, locale } = state
    return {
      locale,
      keyword,
      listAll: 1,
      fontList: 1,
      pageIndex: nextPage
    }
  },
  hasNextPage (state) {
    return state.nextPage && state.nextPage > 0
  }
}

export default {
  namespaced: true,
  state: getDefaultState,
  getters,
  mutations,
  actions
} as ModuleTree<IListModuleState>
