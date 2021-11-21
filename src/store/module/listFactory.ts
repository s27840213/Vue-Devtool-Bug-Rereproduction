import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { IListServiceData } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'
import { captureException } from '@sentry/browser'

export const SET_STATE = 'SET_STATE' as const
export const SET_CONTENT = 'SET_CONTENT' as const
export const SET_CATEGORIES = 'SET_CATEGORIES' as const
export const SET_MORE_CONTENT = 'SET_MORE_CONTENT' as const

export default function (this: any) {
  const getDefaultState = (): IListModuleState => ({
    content: {},
    categories: [],
    keyword: '',
    theme: '',
    page: 0,
    perPage: 0,
    nextPage: 0,
    pending: false,
    host: '',
    data: '',
    preview: '',
    preview2: '',
    locale: 'tw',
    error: ''
  })

  const actions: ActionTree<IListModuleState, unknown> = {
    getCategories: async ({ commit, state }) => {
      const { locale, theme } = state
      commit(SET_STATE, { pending: true, categories: [] })
      try {
        const { data } = await this.api({ locale, theme, listAll: 0 })
        commit(SET_CATEGORIES, data.data)
      } catch (error) {
        captureException(error)
      }
    },

    getContent: async ({ commit, state }, params = {}) => {
      const { locale, theme } = state
      const { keyword } = params
      commit(SET_STATE, { pending: true, keyword, content: {} })
      try {
        const { data } = await this.api({ locale, keyword, theme, listAll: 1 })
        commit(SET_CONTENT, data.data)
        console.log(data.data)
      } catch (error) {
        captureException(error)
      }
    },

    getThemeContent: async ({ commit, state }, params = {}) => {
      const { locale } = state
      const { keyword, theme } = params
      commit(SET_STATE, { pending: true, keyword, theme, content: {} })
      try {
        const { data } = await this.api({ locale, keyword, theme, listAll: 1 })
        commit(SET_CONTENT, data.data)
        console.log(data.data)
      } catch (error) {
        captureException(error)
      }
    },

    getTagContent: async ({ commit, state }, params = {}) => {
      const { locale, theme } = state
      const { keyword } = params
      commit(SET_STATE, { pending: true, keyword, content: {} })
      try {
        const { data } = await this.api({
          locale,
          theme,
          keyword: keyword.includes('::') ? keyword : `tag::${keyword}`,
          listAll: 1
        })
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
        const { data } = await this.api(nextParams)
        commit(SET_MORE_CONTENT, data.data)
        console.log(data.data)
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
      state.host = objects.host.endsWith('/') ? objects.host.slice(0, -1) : objects.host
      state.data = objects.data
      state.preview = objects.preview
      state.preview2 = objects.preview2
      state.pending = false
      state.nextPage = objects.next_page
    },
    [SET_CONTENT] (state: IListModuleState, objects: IListServiceData) {
      state.content = objects.content.find(content => content.list.length) || {}
      // state.content = objects.content[0] || {}
      state.host = objects.host.endsWith('/') ? objects.host.slice(0, -1) : objects.host
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
    }
  }

  const getters: GetterTree<IListModuleState, any> = {
    nextParams (state) {
      const { nextPage, keyword, theme, locale } = state
      return {
        locale,
        keyword,
        theme,
        listAll: 1,
        pageIndex: nextPage
      }
    },
    hasNextPage (state) {
      return state.nextPage && state.nextPage > 0
    }
  }

  return {
    namespaced: true,
    state: getDefaultState,
    getters,
    mutations,
    actions
  } as ModuleTree<IListModuleState>
}
