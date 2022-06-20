import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { IListServiceData } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'
import { captureException } from '@sentry/browser'
import localeUtils from '@/utils/localeUtils'
import store from '@/store'

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
    nextCategory: 0,
    nextPage: 0,
    pending: false,
    host: '',
    data: '',
    preview: '',
    preview2: '',
    locale: '',
    error: '',
    sum: 0
  })

  const actions: ActionTree<IListModuleState, unknown> = {
    // For panel template, object, bg, text, only get recently used.
    // For others, get recently used and categoryies.
    getRecently: async ({ commit, state }) => {
      const { theme } = state
      const locale = localeUtils.currLocale()
      commit(SET_STATE, { pending: true, categories: [], locale }) // Reset categories
      try {
        const { data } = await this.api({
          token: store.getters['user/getToken'],
          locale,
          theme,
          listAll: 0,
          listCategory: 0
        })
        commit('SET_RECENTLY', data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // For mutiple categories.
    getCategories: async ({ commit, state }) => {
      const { theme } = state
      const locale = localeUtils.currLocale()
      commit(SET_STATE, { pending: true, locale })
      try {
        const { data } = await this.api({
          token: '1',
          locale,
          theme,
          listAll: 0,
          listCategory: 1,
          pageIndex: state.nextCategory,
          cache: true
        })
        commit('SET_CATEGORIES', data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // For panel initial, get recently and categories at the same time.
    getRecAndCate: async ({ dispatch }) => {
      await Promise.all([
        dispatch('getRecently'),
        dispatch('getCategories')
      ])
    },

    // For all item or single category search result.
    getContent: async ({ commit, state }, params = {}) => {
      const { theme } = state
      const { keyword } = params
      const locale = localeUtils.currLocale()
      commit(SET_STATE, { pending: true, keyword, locale, content: {} })
      try {
        const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
        const { data } = await this.api({
          token: needCache ? '1' : store.getters['user/getToken'],
          locale,
          keyword,
          theme,
          listAll: 1,
          cache: needCache
        })
        commit(SET_CONTENT, data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // Only for template center.
    getThemeContent: async ({ commit, state }, params = {}) => {
      const { keyword, theme } = params
      const locale = localeUtils.currLocale()
      commit(SET_STATE, { pending: true, keyword, theme, locale, content: {} })
      try {
        const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
        const { data } = await this.api({
          token: needCache ? '1' : store.getters['user/getToken'],
          locale,
          keyword,
          theme,
          listAll: 1,
          cache: needCache
        })
        commit(SET_CONTENT, data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // For search result.
    getTagContent: async ({ commit, state }, params = {}) => {
      const { theme } = state
      let { keyword } = params
      const locale = localeUtils.currLocale()
      keyword = keyword.includes('::') ? keyword : `tag::${keyword}`
      commit(SET_STATE, { pending: true, keyword, locale, content: {} })
      try {
        const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
        const { data } = await this.api({
          token: needCache ? '1' : store.getters['user/getToken'],
          locale,
          theme,
          // TODO: Fix issue that tag search getMoreContent will not load second page.
          keyword: keyword.includes('::') ? keyword : `tag::${keyword}`,
          listAll: 1,
          cache: needCache
        })
        commit(SET_CONTENT, data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // For all and search/category result, it is also used by TemplateCenter.
    getMoreContent: async ({ commit, getters, dispatch, state }) => {
      const { nextParams, hasNextPage } = getters
      const { pending } = state
      if (!hasNextPage || pending) { return }
      if (state.categories.length && state.nextCategory !== -1) {
        // Get more categories
        dispatch('getCategories')
        return
      } else if (state.nextPage === 0) {
        // Get first all or search/category result
        dispatch('getContent')
        return
      }

      commit(SET_STATE, { pending: true })
      try {
        const { data } = await this.api(nextParams)
        commit(SET_MORE_CONTENT, data.data)
      } catch (error) {
        captureException(error)
      }
    },
    resetContent ({ commit }) {
      commit(SET_STATE, {
        content: {},
        categories: [],
        keyword: '',
        page: 0,
        nextCategory: 0,
        nextPage: 0
      })
    },

    getSum: async ({ commit, state }, params = {}) => {
      const { theme } = state
      const { keyword } = params
      const locale = localeUtils.currLocale()
      commit(SET_STATE, { pending: true, locale, content: {} })
      try {
        const { data } = await this.api({
          token: store.getters['user/getToken'],
          locale,
          theme,
          keyword: (keyword.includes('::') ? keyword : `tag::${keyword}`).concat(';;sum::1'),
          listAll: 1
        })
        commit(SET_STATE, { sum: data.data.sum })
      } catch (error) {
        captureException(error)
      }
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
    SET_RECENTLY (state: IListModuleState, objects: IListServiceData) {
      state.categories = objects.content.concat(state.categories) || []
      if (objects.next_page)state.nextPage = objects.next_page as number
      state.pending = false
    },
    SET_CATEGORIES (state: IListModuleState, objects: IListServiceData) {
      state.categories = state.categories.concat(objects.content) || []
      state.host = objects.host?.endsWith('/') ? objects.host.slice(0, -1) : (objects.host || '')
      state.data = objects.data
      state.preview = objects.preview
      state.preview2 = objects.preview2
      state.nextCategory = objects.next_page as number
      state.pending = false
    },
    [SET_CONTENT] (state: IListModuleState, objects: IListServiceData) {
      const {
        content = [],
        host = '',
        data = '',
        preview = '',
        preview2 = '',
        next_page: nextPage = 0
      } = objects || {}
      const assetContent = content.filter(content => content.title === 'asset')
      const publicContent = content.filter(content => content.title !== 'asset')
      state.content = {
        title: content[0]?.title ?? '',
        list: assetContent.flatMap(content => content.list).concat(
          publicContent.flatMap(content => content.list)
        )
      }
      state.host = host.endsWith('/') ? host.slice(0, -1) : host
      state.data = data
      state.preview = preview
      state.preview2 = preview2
      state.nextPage = nextPage
      state.pending = false
    },
    [SET_MORE_CONTENT] (state: IListModuleState, objects: IListServiceData) {
      const { list = [] } = state.content
      const newList = objects.content.flatMap(content => content.list)
      state.content = {
        ...state.content,
        list: list.concat(newList)
      }
      state.nextPage = objects.next_page
      state.pending = false
    }
  }

  const getters: GetterTree<IListModuleState, any> = {
    nextParams (state) {
      const { nextPage, keyword, theme, locale } = state
      const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
      return {
        token: needCache ? '1' : store.getters['user/getToken'],
        locale,
        keyword,
        theme,
        listAll: 1,
        pageIndex: nextPage,
        cache: needCache
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
