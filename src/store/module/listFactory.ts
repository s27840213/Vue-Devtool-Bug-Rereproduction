import { ModuleTree, ActionTree, MutationTree, GetterTree } from 'vuex'
import { IListServiceContentData, IListServiceData } from '@/interfaces/api'
import { IListModuleState } from '@/interfaces/module'
import { captureException } from '@sentry/browser'
import localeUtils from '@/utils/localeUtils'
import store from '@/store'
import i18n from '@/i18n'
import vivistickerUtils from '@/utils/vivistickerUtils'

export default function (this: any) {
  const getDefaultState = (): IListModuleState => ({
    content: {},
    categories: [],
    searchResult: {},
    keyword: '',
    theme: '',
    page: 0,
    perPage: 0,
    nextCategory: 0,
    nextPage: 0,
    nextSearch: 0,
    pending: false,
    // host: '',
    // data: '',
    // preview: '',
    // preview2: '',
    locale: '',
    error: '',
    sum: 0
  })

  const actions: ActionTree<IListModuleState, unknown> = {
    // For panel template, object, bg, text, only get recently used.
    // For others, get recently used and categoryies.
    getRecently: async ({ commit, state }, { writeBack = true, key, keyword }) => {
      const { theme } = state
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { pending: true, categories: [], locale }) // Reset categories
      try {
        const { data } = await this.api({
          token: store.getters['user/getToken'],
          locale,
          theme,
          listAll: 0,
          listCategory: 0
        })
        if (data.data.content.length === 0) {
          data.data.content = [{
            title: i18n.t('NN0024'),
            list: [],
            is_recent: 1
          } as IListServiceContentData]
        }
        if (writeBack) {
          commit('SET_RECENTLY', data.data)
          if (key) {
            if (keyword) {
              commit('SET_STATE', { keyword })
            }
            vivistickerUtils.listAsset(key)
          }
        } else return data.data
      } catch (error) {
        captureException(error)
      }
    },

    // For mutiple categories.
    getCategories: async ({ commit, dispatch, state }, writeBack = true) => {
      const { theme } = state
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { pending: true, locale })
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
        if (writeBack) commit('SET_CATEGORIES', data.data)
        else return data.data
        // If content empty, auto load more category
        if (data.data.content.length === 0) {
          dispatch('getMoreContent')
        }
      } catch (error) {
        captureException(error)
      }
    },

    // For panel initial, get recently and categories at the same time.
    getRecAndCate: async ({ dispatch, commit }, key?: string) => {
      await Promise.all([
        dispatch('getRecently', { writeBack: false }),
        dispatch('getCategories', false)
      ]).then(([recently, category]) => {
        category.content = recently.content.concat(category.content)
        commit('SET_CATEGORIES', category)
        if (key) {
          vivistickerUtils.listAsset(key)
        }
        if (category.content.length === 0) {
          dispatch('getMoreContent')
        }
      })
    },

    // For all item or single category search result.
    getContent: async ({ commit, state }, params = {}) => {
      const { theme } = state
      const { keyword } = params
      const locale = params.locale || localeUtils.currLocale()
      commit('SET_STATE', { pending: true, locale })
      if (keyword)commit('SET_STATE', { keyword })
      try {
        const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
        const { data } = await this.api({
          token: needCache ? '1' : store.getters['user/getToken'],
          locale,
          keyword,
          theme,
          listAll: 1,
          listCategory: 0,
          cache: needCache
        })
        commit('SET_CONTENT', data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // Only for template center.
    getThemeContent: async ({ commit, state }, params = {}) => {
      const { keyword, theme } = params
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { pending: true, keyword, theme, locale, content: {} })
      try {
        const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
        const { data } = await this.api({
          token: needCache ? '1' : store.getters['user/getToken'],
          locale,
          keyword,
          theme,
          listAll: 1,
          listCategory: 0,
          cache: needCache
        })
        commit('SET_CONTENT', data.data)
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
      commit('SET_STATE', { pending: true, keyword, locale })
      try {
        const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
        const { data } = await this.api({
          token: needCache ? '1' : store.getters['user/getToken'],
          locale,
          theme,
          keyword,
          listAll: 1,
          listCategory: 0,
          cache: needCache
        })
        commit('SET_CONTENT', data.data)
      } catch (error) {
        captureException(error)
      }
    },

    // For all and search/category result, it is also used by TemplateCenter.
    getMoreContent: async ({ commit, getters, dispatch, state }) => {
      const { nextParams, hasNextPage } = getters
      const { pending, keyword } = state
      if (!hasNextPage || pending) { return }
      if (!keyword && state.categories.length > 0 && state.nextCategory !== -1) {
        // Get more categories
        dispatch('getCategories')
        return
      } else if (!keyword && state.nextPage === 0) {
        // Get first all or search/category result
        dispatch('getContent')
        return
      }

      commit('SET_STATE', { pending: true })
      try {
        const { data } = await this.api(nextParams)
        commit('SET_MORE_CONTENT', data.data)
      } catch (error) {
        captureException(error)
      }
    },

    resetContent({ commit }) {
      commit('SET_STATE', {
        content: {},
        categories: [],
        keyword: '',
        page: 0,
        nextCategory: 0,
        nextPage: 0
      })
    },

    // Clear search keyword and result.
    resetSearch: async({ commit }) => {
      commit('SET_STATE', {
        searchResult: {},
        nextSearch: 0,
        keyword: ''
      })
    },

    getSum: async ({ commit, state }, params = {}) => {
      const { theme } = state
      const { keyword } = params
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { pending: true, locale })
      try {
        const { data } = await this.api({
          token: store.getters['user/getToken'],
          locale,
          theme,
          keyword: (keyword.includes('::') ? keyword : `tag::${keyword}`).concat(';;sum::1'),
          listAll: 1,
          listCategory: 0
        })
        commit('SET_STATE', { sum: data.data.sum })
      } catch (error) {
        captureException(error)
      }
    }
  }

  const mutations: MutationTree<IListModuleState> = {
    SET_STATE(state: IListModuleState, data: Partial<IListModuleState>) {
      const newState = data || getDefaultState()
      const keys = Object.keys(newState) as Array<keyof IListModuleState>
      keys
        .forEach(key => {
          if (key in state) {
            (state[key] as any) = newState[key]
          }
        })
    },
    SET_RECENTLY(state: IListModuleState, objects: IListServiceData) {
      state.categories = objects.content.concat(state.categories) || []
      if (objects.next_page) state.nextPage = objects.next_page as number
      state.pending = false
    },
    SET_CATEGORIES(state: IListModuleState, objects: IListServiceData) {
      state.categories = state.categories.concat(objects.content) || []
      state.nextCategory = objects.next_page as number
      state.pending = false
      // state.host = objects.host?.endsWith('/') ? objects.host.slice(0, -1) : (objects.host || '')
      // state.data = objects.data
      // state.preview = objects.preview
      // state.preview2 = objects.preview2
    },
    UPDATE_RECENTLY_PAGE(state: IListModuleState, { index, format }) {
      const targetCategory = state.categories.find((category: any) => {
        return category.title === `${i18n.t('NN0024')}`
      })?.list
      if (targetCategory) {
        targetCategory.splice(index, 1)
        targetCategory.unshift(format)
      }
    },
    SET_CONTENT(state: IListModuleState, objects: IListServiceData) {
      const isSearch = Boolean(state.keyword)
      const {
        content = [],
        // host = '',
        // data = '',
        // preview = '',
        // preview2 = '',
        next_page: nextPage = 0
      } = objects || {}
      const assetContent = content.filter(content => content.title === 'asset')
      const publicContent = content.filter(content => content.title !== 'asset')
      const result = {
        title: content[0]?.title ?? '',
        list: assetContent.flatMap(content => content.list).concat(
          publicContent.flatMap(content => content.list)
        )
      }

      if (isSearch) { // Is search, write to search result.
        state.searchResult = result
        state.nextSearch = nextPage
      } else {
        state.content = result
        state.nextPage = nextPage
      }
      state.pending = false
      // state.host = host.endsWith('/') ? host.slice(0, -1) : host
      // state.data = data
      // state.preview = preview
      // state.preview2 = preview2
    },
    SET_MORE_CONTENT(state: IListModuleState, objects: IListServiceData) {
      const isSearch = Boolean(state.keyword)
      const { list = [] } = isSearch ? state.searchResult : state.content
      const {
        content,
        next_page: nextPage = 0
      } = objects
      const newList = content.flatMap(content => content.list)
      const result = {
        ...state.content,
        list: list.concat(newList)
      }

      if (isSearch) { // Is search, write to search result.
        state.searchResult = result
        state.nextSearch = nextPage
      } else {
        state.content = result
        state.nextPage = nextPage
      }
      state.pending = false
    }
  }

  const getters: GetterTree<IListModuleState, any> = {
    nextParams(state) {
      const { nextPage, nextSearch, keyword, theme, locale } = state
      const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
      return {
        token: needCache ? '1' : store.getters['user/getToken'],
        locale,
        keyword,
        theme,
        listAll: 1,
        listCategory: 0,
        pageIndex: keyword ? nextSearch : nextPage,
        cache: needCache
      }
    },
    hasNextPage(state) {
      if (state.keyword) return state.nextSearch > 0
      else return (state.nextPage !== undefined && state.nextPage >= 0) || state.nextCategory > 0
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
