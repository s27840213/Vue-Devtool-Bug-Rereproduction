import list from '@/apis/list'
import i18n from '@/i18n'
import { IListServiceContentData, IListServiceData } from '@/interfaces/api'
import {
  IAsset, ICategory, ICategoryExtend, IFavorite, IListModuleState, IPending, isICategory,
  isITag, ITag, ITagExtend
} from '@/interfaces/module'
import store from '@/store'
import localeUtils from '@/utils/localeUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import popupUtils from '@/utils/popupUtils'
import themeUtils from '@/utils/themeUtils'
import vivistickerUtils, { MODULE_TYPE_MAPPING } from '@/utils/vivistickerUtils'
import { captureException } from '@sentry/browser'
import { cloneDeep, filter, find, pull } from 'lodash'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

function $all(keyword: string): ITag {
  return {
    keyword: `$all:${keyword}`,
    active: true
  }
}
function keywords2ITags(keywords: string[]): ITag[] {
  return keywords.map((keyword) => ({
    keyword: keyword,
    active: false
  }))
}

function processTags(tag: ITag) { // Split value and label
  return tag.keyword.startsWith('$all:') ? {
    active: tag.active,
    value: tag.keyword,
    label: i18n.global.tc('NN0324')
  } : {
    active: tag.active,
    value: tag.keyword,
    label: tag.keyword
  }
}

export default function (this: any) {
  const getDefaultState = (): IListModuleState => ({
    content: {},
    categories: [],
    searchResult: {},
    searchCategoryInfo: { // Extra data for category search.
      categoryName: '',
      tags: [],
      url: ''
    },
    tags: [],
    keyword: '',
    theme: '',
    page: 0,
    perPage: 0,
    nextCategory: 0,
    nextPage: 0,
    nextSearch: 0,
    pending: {
      categories: false,
      content: false,
      recently: false,
      favorites: false
    },
    // host: '',
    // data: '',
    // preview: '',
    // preview2: '',
    locale: '',
    error: '',
    sum: 0,
    favorites: {
      items: {
        order: [],
        obj: {}
      },
      tags: {
        order: [],
        obj: {}
      },
      categories: {
        order: [],
        obj: {}
      },
      nextItems: [],
      nextTags: [],
      nextCategories: [],
      itemsContent: {},
      tagsContent: {},
      categoriesContent: {},
      searchTarget: ''
    }
  })

  const actions: ActionTree<IListModuleState, unknown> = {
    // For panel template, object, bg, text, only get recently used.
    // For others, get recently used and categories.
    getRecently: async ({ commit, state }, { writeBack = true, key, keyword }) => {
      const { theme } = state
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { categories: [], locale }) // Reset categories
      commit('SET_pending', { recently: true })
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
            id: -1,
            title: i18n.global.t('NN0024'),
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
            await vivistickerUtils.listAsset(key)
          }
        } else {
          commit('SET_pending', { recently: false })
          return data.data
        }
      } catch (error) {
        console.error(error)
        captureException(error)
      }
    },

    // For mutiple categories.
    getCategories: async ({ commit, dispatch, state }, writeBack = true) => {
      const { theme } = state
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { locale })
      commit('SET_pending', { categories: true })
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
        console.error(error)
        captureException(error)
      }
    },

    // For panel initial, get recently and categories at the same time.
    getRecAndCate: async ({ dispatch, commit, state }, { reset = true, key = undefined }: { reset?: boolean, key?: string } = {}) => {
      if (reset) dispatch('resetContent')
      await Promise.all([
        dispatch('getRecently', { writeBack: false }),
        dispatch('getCategories', false)
      ]).then(([recently, category]) => {
        category.content = recently.content.concat(category.content)
        commit('SET_CATEGORIES', category)
        if (key) {
          return vivistickerUtils.listAsset(key)
        }
      }).then(() => {
        if (state.categories.length === 0) {
          dispatch('getMoreContent')
        }
      })
    },

    // For all item or single category search result.
    getContent: async ({ commit, state }, params = {}) => {
      let { theme } = state
      const { keyword }: { keyword: string } = params
      const locale = params.locale || localeUtils.currLocale()
      commit('SET_STATE', { locale })
      commit('SET_pending', { content: true })
      if (keyword) commit('SET_STATE', { keyword })
      if (keyword && keyword.startsWith('tag::') &&
        this.namespace === 'templates') {
        theme = themeUtils.sortSelectedTheme(theme)
      }
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
        commit('SET_CONTENT', { objects: data.data, isSearch: !!keyword })
      } catch (error) {
        console.error(error)
        captureException(error)
      }
    },

    // Only for template center.
    getThemeContent: async ({ commit }, params = {}) => {
      const { keyword, theme } = params
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { keyword, theme, locale, content: {} })
      commit('SET_pending', { content: true })
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
        commit('SET_CONTENT', { objects: data.data, isSearch: !!keyword })
      } catch (error) {
        console.error(error)
        captureException(error)
      }
    },

    // For search result.
    getTagContent: async ({ commit, state }, params = {}) => {
      let { theme } = state
      let { keyword } = params
      const locale = localeUtils.currLocale()
      // If $all:, do category search instead of tag search.
      keyword = keyword.startsWith('$all:') ? keyword.replace('$all:', '')
        : keyword.includes('::') ? keyword : `tag::${keyword}`
      commit('SET_STATE', { keyword, locale })
      commit('SET_pending', { content: true })
      if (this.namespace === 'templates') theme = themeUtils.sortSelectedTheme(theme)
      try {
        // Search tags and set as active.
        commit('UPDATE_tag', keyword)

        // Call api and write back.
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
        commit('SET_CONTENT', { objects: data.data, isSearch: true })
      } catch (error) {
        console.error(error)
        captureException(error)
      }
    },

    // For all and search/category result, it is also used by TemplateCenter.
    getMoreContent: async ({ commit, getters, dispatch, state }) => {
      const { nextParams, hasNextPage } = getters
      const { keyword } = state
      if (!hasNextPage || state.pending.content || state.pending.categories) return
      if (!keyword && state.categories.length > 0 && state.nextCategory !== -1) {
        // Get more categories
        dispatch('getCategories')
        return
      } else if (!keyword && state.nextPage === 0) {
        // Get first all or search/category result
        dispatch('getContent')
        return
      }

      commit('SET_pending', { content: true })
      try {
        const { data } = await this.api(nextParams)
        commit('SET_MORE_CONTENT', data.data)
      } catch (error) {
        console.error(error)
        captureException(error)
      }
    },

    resetContent: ({ commit }) => {
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
    resetSearch: async ({ state, commit }, { resetCategoryInfo = false, keepSearchResult = false } = {}) => {
      const tags = cloneDeep(state.tags) as ITag[]
      tags.forEach((tag) => { tag.active = false })
      const searchCategoryInfo = cloneDeep(state.searchCategoryInfo)
      searchCategoryInfo.tags.forEach((tag) => { tag.active = false })
      commit('SET_STATE', {
        searchResult: keepSearchResult ? state.searchResult : {},
        searchCategoryInfo,
        tags,
        nextSearch: 0,
        keyword: ''
      })

      if (resetCategoryInfo) {
        commit('SET_STATE', {
          searchCategoryInfo: { categoryName: '', tags: [], url: '' }
        })
      }
    },

    getSum: async ({ commit, state }, params = {}) => {
      let { theme } = state
      const { keyword } = params
      const locale = localeUtils.currLocale()
      commit('SET_STATE', { locale, sum: -1 })
      if (keyword && this.namespace === 'templates') theme = themeUtils.sortSelectedTheme(theme)
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
        console.error(error)
        captureException(error)
      }
    },

    initFavorites: async ({ state, commit, dispatch }) => {
      commit('SET_pending', { favorites: true })
      for (const target of ['categories', 'tags', 'items']) {
        commit('UPDATE_favorites', {
          [target]: await localStorageUtils.appGet('favorites', `${this.namespace}.${target}`)
        })
      }
      commit('UPDATE_favorites', {
        nextItems: state.favorites.items.order,
        nextTags: state.favorites.tags.order,
        nextCategories: state.favorites.categories.order
      })
      commit('SET_pending', { favorites: false })
      await dispatch('getFavoritesCategories')
      await dispatch('getFavoritesTags')
      await dispatch('getFavoritesItems')
    },

    getFavoritesCategories: async ({ state, commit, dispatch }) => {
      const { nextCategories } = state.favorites
      if (nextCategories.length === 0) return
      await dispatch('getFavoritesCategoriesContent', nextCategories.slice(0, 12))
      commit('UPDATE_favorites', { nextCategories: nextCategories.slice(12) })
    },

    getFavoritesTags: async ({ state, commit, dispatch }) => {
      const { nextTags } = state.favorites
      if (nextTags.length === 0) return
      await dispatch('getFavoritesTagsContent', nextTags.slice(0, 12))
      commit('UPDATE_favorites', { nextTags: nextTags.slice(12) })
    },

    getFavoritesItems: async ({ state, commit }) => {
      const { pending } = state
      const { nextItems } = state.favorites
      const itemIds = nextItems.slice(0, 100)
      const itemsContent = cloneDeep(state.favorites.itemsContent)

      if (pending.favorites || itemIds.length === 0) return
      commit('SET_pending', { favorites: true })

      try {
        const { data } = (await list.getInfoList(MODULE_TYPE_MAPPING[this.namespace], itemIds)).data

        for (const item of data.content?.[0].list ?? []) {
          if (item.valid) itemsContent[item.id] = item as IAsset
        }
        commit('UPDATE_favorites', {
          itemsContent,
          nextItems: nextItems.slice(100)
        })
      } catch (error) {
        captureException(error)
      }
    },

    getFavoritesCategoriesContent: async ({ state, commit }, target: string[] | ICategoryExtend & { next: number }) => {
      const { theme, pending } = state
      const locale = localeUtils.currLocale()
      const categoriesContent = cloneDeep(state.favorites.categoriesContent)

      if (pending.favorites) return
      if (Array.isArray(target) && target.length === 0) return
      if (!Array.isArray(target) && target.next === -1) return
      commit('SET_pending', { favorites: true })

      const params = {
        token: '1',
        theme,
        cache: true,
        ...Array.isArray(target) ? { // Multiple categoryies, each category get 10 items.
          locale,
          listAll: 0,
          listCategory: 1,
          categoryIds: target.join(',')
        } : { // Single category 100 items.
          locale: categoriesContent[target.id].titleLocale ?? locale,
          listAll: 1,
          listCategory: 0,
          keyword: target.title,
          pageIndex: target.next
        }
      }
      try {
        const data = (await this.api(params)).data.data as IListServiceData

        for (const item of data.content) {
          let title, url, titleLocale: string
          let key, next: number
          let tags: ITag[]
          let asset: IAsset[]
          if (Array.isArray(target)) { // Multiple categoryies
            key = item.id
            title = item.title
            titleLocale = item.title_locale as string
            tags = []
            asset = []
            url = ''
            next = 0
          } else { // Single category
            key = target.id
            title = target.title
            titleLocale = categoriesContent[key].titleLocale
            // Get data.tags if page_index is 0, otherwise use old tags.
            tags = target.next === 0 && data.tags && data.tags.length
              ? [$all(target.title), ...keywords2ITags(data.tags as string[])] : categoriesContent[key].tags
            next = data.next_page as number
            url = target.next === 0 ? data.url ?? '' : categoriesContent[key].url
            asset = (target.next === 0) ? [] : categoriesContent[key].asset
          }

          categoriesContent[key] = {
            title,
            titleLocale,
            next,
            tags,
            url,
            asset: asset.concat(item.list as IAsset[])
          }
        }
        commit('UPDATE_favorites', { categoriesContent })
      } catch (error) {
        captureException(error)
      }
    },

    getFavoritesTagsContent: async ({ state, commit }, keywords: string[]) => {
      const { theme, pending } = state
      const locale = localeUtils.currLocale()
      const tagsContent = cloneDeep(state.favorites.tagsContent)
      const pageIndex = keywords.length === 1 ? tagsContent[keywords[0]]?.next ?? 0 : 0

      if (pending.favorites || keywords.length === 0 || pageIndex === -1) return
      commit('SET_pending', { favorites: true })

      const params = {
        token: '1',
        locale,
        theme,
        pageIndex,
        listCategory: 0,
        cache: true,
        ...keywords.length === 1 ? { // Single tag 100 items.
          listAll: 1,
          keyword: `tag::${keywords[0]}`
        } : { // Multiple tags, each tag get 10 items.
          listTag: 1,
          keyword: `${keywords.join(',,')}`
        }
      }
      try {
        const data = (await this.api(params)).data.data as IListServiceData

        for (const item of data.content) {
          const key = keywords.length === 1 ? keywords[0] : item.title
          const asset = keywords.length === 1 && pageIndex === 0 ? [] : tagsContent[key]?.asset ?? []
          const next = keywords.length === 1 ? data.next_page as number : 0

          tagsContent[key] = {
            next,
            asset: asset.concat(item.list as IAsset[])
          }
        }
        commit('UPDATE_favorites', { tagsContent })
      } catch (error) {
        captureException(error)
      }
    },

    toggleFavorite: async ({ state, commit, dispatch, getters }, favs: Record<string, IAsset | ITagExtend | ICategoryExtend>) => {
      for (const [type, target] of Object.entries(favs)) {
        let key: string
        let getContent = () => { /**/ }

        if (isICategory(target)) { // category
          const favoritesCategories = getters.favoritesCategories as ICategoryExtend[]
          if (favoritesCategories.length <= 6) dispatch('getFavoritesCategories') // If user delete too many fav, get more content.
          key = target.id.toString()
          getContent = () => { dispatch('getFavoritesCategoriesContent', [target.id]) }
        } else if (isITag(target)) { // tag
          const favoritesTags = getters.favoritesTags as ITagExtend[]
          if (favoritesTags.length <= 6) dispatch('getFavoritesTags')
          key = target.keyword
          getContent = () => { dispatch('getFavoritesTagsContent', [key]) }
        } else { // item
          const favoritesItems = getters.favoritesItems as IAsset[]
          if (favoritesItems.length <= 50) dispatch('getFavoritesItems')
          key = target.id
          getContent = () => {
            const itemsContent = cloneDeep(state.favorites.itemsContent)
            itemsContent[key] = target
            commit('UPDATE_favorites', { itemsContent })
          }
        }
        commit('UPDATE_favorites', {
          [type]: await localStorageUtils.appUpdate('favorites', `${this.namespace}.${type}`, (old: IFavorite) => {
            if (old.obj[key]) {
              delete old.obj[key]
              old.order = pull(old.order, key)
              popupUtils.openPopup('icon', {}, { iconName: 'favorites' })
            } else {
              old.obj[key] = true
              old.order = [key, ...old.order]
              getContent()
              popupUtils.openPopup('icon', {}, { iconName: 'favorites-fill' })
            }
            return old
          })
        })
      }
    },

    searchFavorites: async ({ commit }, target: string | ITag | ICategory) => {
      commit('UPDATE_favorites', { searchTarget: target })
    },

    searchMoreFavorites: async ({ state, dispatch, getters }) => {
      const { searchTarget } = state.favorites
      const activeTag = getters.favoritesCategoryActiveTag as string
      if (isITag(searchTarget)) {
        dispatch('getFavoritesTagsContent', [searchTarget.keyword])
      } else if (isICategory(searchTarget) && activeTag.startsWith('$all:')) {
        const content = state.favorites.categoriesContent[searchTarget.id]
        dispatch('getFavoritesCategoriesContent', { ...searchTarget, ...content })
      } else if (isICategory(searchTarget)) {
        dispatch('getFavoritesTagsContent', [activeTag])
      }
      switch (searchTarget) {
        case i18n.global.tc('NN0762'):
          dispatch('getFavoritesItems')
          break
        case i18n.global.tc('NN0761'):
          dispatch('getFavoritesTags')
          break
        case i18n.global.tc('NN0760'):
          dispatch('getFavoritesCategories')
          break
      }
    },

    searchTagInFavoritesCategory: async ({ state, commit, dispatch }, keyword: string) => {
      const searchTarget = state.favorites.searchTarget as ICategory
      const categoriesContent = cloneDeep(state.favorites.categoriesContent)
      const tags = categoriesContent[searchTarget.id].tags
      const tag = find(tags, ['keyword', keyword])
      tags.forEach((tag) => { tag.active = false })
      if (tag) {
        tag.active = true
      } else {
        tags[0].active = true
      }
      commit('UPDATE_favorites', { categoriesContent })
      dispatch('searchMoreFavorites')
    },

    resetFavoritesSearch: async ({ commit }) => {
      commit('UPDATE_favorites', { searchTarget: '' })
    }
  }

  const mutations: MutationTree<IListModuleState> = {
    SET_STATE(state: IListModuleState, data: Partial<IListModuleState>) {
      const newState = data || getDefaultState()
      const keys = Object.keys(newState) as Array<keyof IListModuleState>
      keys
        .forEach(key => {
          if (key in state) {
            (state[key] as unknown) = newState[key]
          }
        })
    },
    SET_pending(state: IListModuleState, data: Record<keyof IPending, boolean>) {
      for (const item of Object.entries(data)) {
        state.pending[item[0] as keyof IPending] = item[1]
      }
    },
    UPDATE_tag(state: IListModuleState, keyword: string) {
      keyword = keyword.replace('tag::', '')
      const tag = find(state.tags, { keyword: keyword })
      if (tag) {
        tag.active = true
      }
      const searchTag = find(state.searchCategoryInfo.tags, { keyword: keyword })
      if (searchTag) {
        searchTag.active = true
      }
    },
    UPDATE_favorites(state: IListModuleState, obj: Record<string, unknown>) {
      for (const item of Object.entries(obj)) {
        Object.assign(state.favorites, { [item[0]]: item[1] })
      }
      state.pending.favorites = false
    },
    SET_RECENTLY(state: IListModuleState, objects: IListServiceData) {
      state.categories = objects.content.concat(state.categories) || []
      if (objects.next_page) state.nextPage = objects.next_page as number
      state.pending.recently = false
    },
    SET_CATEGORIES(state: IListModuleState, objects: IListServiceData) {
      if (objects.tags) {
        state.tags = keywords2ITags(objects.tags)
      }
      state.categories = state.categories.concat(objects.content) || []
      state.nextCategory = objects.next_page as number
      state.pending.categories = false
      // state.host = objects.host?.endsWith('/') ? objects.host.slice(0, -1) : (objects.host || '')
      // state.data = objects.data
      // state.preview = objects.preview
      // state.preview2 = objects.preview2
    },
    UPDATE_RECENTLY_PAGE(state: IListModuleState, { index, format }) {
      const targetCategory = state.categories.find((category: any) => {
        return category.title === `${i18n.global.t('NN0024')}`
      })?.list
      if (targetCategory) {
        targetCategory.splice(index, 1)
        targetCategory.unshift(format)
      }
    },
    SET_CONTENT(state: IListModuleState, { objects, isSearch = false }: { objects: IListServiceData, isSearch: boolean }) {
      const { keyword } = state
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
        if (!keyword.startsWith('tag::')) { // If search category, write searchCategoryInfo.
          state.searchCategoryInfo.categoryName = keyword
          state.searchCategoryInfo.tags = objects.tags && objects.tags.length
            ? [$all(keyword), ...keywords2ITags(objects.tags ?? [])] : []
          state.searchCategoryInfo.url = objects.url ?? ''
        }
        state.searchResult = result
        state.nextSearch = nextPage
      } else {
        state.content = result
        state.nextPage = nextPage
      }
      state.pending.content = false
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
      state.pending.content = false
    }
  }

  const getters: GetterTree<IListModuleState, any> = {
    searchingCategory(state) {
      // During waiting for search category api, searchCategoryInfo.tags is empty, so use keyword to verify.
      return (state.keyword && !state.keyword.startsWith('tag::')) ||
        state.searchCategoryInfo.categoryName !== ''
    },
    pending(state) {
      return Object.entries(state.pending).some(([key, value]) => value)
    },
    nextParams: (state) => {
      let { nextPage, nextSearch, keyword, theme, locale } = state
      const needCache = !store.getters['user/isLogin'] || (store.getters['user/isLogin'] && (!keyword || keyword.includes('group::0')))
      if (keyword && keyword.startsWith('tag::') &&
        this.namespace === 'templates') {
        theme = themeUtils.sortSelectedTheme(theme)
      }
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
    },
    // TagsBar
    tagsBar(state, getters) {
      const showSearchTag = getters.searchingCategory as boolean
      const target = (showSearchTag ? state.searchCategoryInfo.tags : state.tags) ?? []
      return target.map(processTags)
    },
    favoritesTagsBar(state, getters) {
      const fsr = getters.favoritesSearchResult// as IFavoritesSearchResult
      const target = fsr.title
        ? fsr.tags as ITag[] : []
      return target.map(processTags)
    },
    // Check favorites
    checkItemFavorites(state) {
      return (id: string): boolean => state.favorites.items.obj[id] !== undefined
    },
    checkCategoryFavorite(state) {
      return (id: string): boolean => state.favorites.categories.obj[id] !== undefined
    },
    checkTagFavorite(state) {
      return (keyword: string): boolean | undefined => {
        if (keyword === '') return undefined
        return state.favorites.tags.obj[keyword] !== undefined
      }
    },
    // Get favorites content
    favoritesItems(state): IAsset[] {
      const { items, itemsContent } = state.favorites
      return filter(items.order.map((id) => {
        return itemsContent[id]
      }), 'id')
    },
    favoritesCategories(state): ICategoryExtend[] {
      const { categories, categoriesContent } = state.favorites
      return filter(categories.order.map((id) => {
        const content = categoriesContent[id]
        return {
          id: parseInt(id),
          list: content?.asset,
          title: content?.title,
          url: content?.url
        }
      }), 'list')
    },
    favoritesTags(state): ITagExtend[] {
      const { tags, tagsContent } = state.favorites
      return filter(tags.order.map((id) => {
        return {
          keyword: id,
          active: false,
          list: tagsContent[id]?.asset
        }
      }), 'list')
    },
    favoritesCategoryActiveTag(state) {
      const { searchTarget } = state.favorites
      if (!isICategory(searchTarget)) return ''
      const tags = state.favorites.categoriesContent[searchTarget.id]?.tags
      const tag = find(tags, 'active')
      return tag?.keyword ?? '$all:'
    },
    favoritesSearchResult(state, getters) {
      const { searchTarget } = state.favorites
      const activeTag = getters.favoritesCategoryActiveTag as string
      // Searching a tag.
      if (isITag(searchTarget)) {
        return {
          title: searchTarget.keyword,
          content: state.favorites.tagsContent[searchTarget.keyword]?.asset,
          tags: []
        }
        // Searching a category, while $all tag active.
      } else if (isICategory(searchTarget) && activeTag.startsWith('$all:')) {
        return {
          title: state.favorites.categoriesContent[searchTarget.id]?.title,
          content: state.favorites.categoriesContent[searchTarget.id]?.asset,
          tags: state.favorites.categoriesContent[searchTarget.id]?.tags
        }
        // Searching a category, while $all tag inactive. Aka searching a tag.
      } else if (isICategory(searchTarget)) {
        return {
          title: state.favorites.categoriesContent[searchTarget.id]?.title,
          content: state.favorites.tagsContent[activeTag]?.asset, // tagsContent
          tags: state.favorites.categoriesContent[searchTarget.id]?.tags
        }
      }
      switch (searchTarget) {
        case i18n.global.tc('NN0762'):
          return {
            title: searchTarget,
            content: getters.favoritesItems as IAsset[],
            tags: []
          }
        case i18n.global.tc('NN0761'):
          return {
            title: searchTarget,
            content: getters.favoritesTags as ITagExtend[],
            tags: []
          }
        case i18n.global.tc('NN0760'):
          return {
            title: searchTarget,
            content: getters.favoritesCategories as ICategoryExtend[],
            tags: []
          }
        case 'none':
        default:
          return { title: '', content: [], tags: [] }
      }
    },
    headerTab: (state, getters) => {
      const namespace = this.namespace as string
      const { keyword } = state
      const { searchTarget } = state.favorites
      const activeTag = getters.favoritesCategoryActiveTag as string
      const searchingCategory = getters.searchingCategory as boolean
      let title = ''
      let bulbUrl = ''
      let isFavorite: boolean
      let action: () => void

      // Searching a favorites tag.
      if (isITag(searchTarget)) {
        title = searchTarget.keyword
        isFavorite = getters.checkTagFavorite(searchTarget.keyword)
        action = () => store.dispatch(`${namespace}/toggleFavorite`, { tags: { keyword: searchTarget.keyword } })
        // Searching a favorites category, while $all tag active.
      } else if (isICategory(searchTarget) && activeTag.startsWith('$all:')) {
        const category = state.favorites.categoriesContent[searchTarget.id]
        title = category.title
        bulbUrl = category.url
        isFavorite = getters.checkCategoryFavorite(searchTarget.id)
        action = () => store.dispatch(`${namespace}/toggleFavorite`, { categories: { id: searchTarget.id } })
        // Searching a favorites category, while $all tag inactive. Aka searching a tag.
      } else if (isICategory(searchTarget)) {
        const category = state.favorites.categoriesContent[searchTarget.id]
        title = category.title
        bulbUrl = category.url
        isFavorite = getters.checkTagFavorite(activeTag)
        action = () => store.dispatch(`${namespace}/toggleFavorite`, { tags: { keyword: activeTag } })
        // Searching favorites Item/Keyword/Category
      } else if (searchTarget !== '') {
        return { title: searchTarget }
        // Svg tag search result. (non-fav)
      } else if (searchingCategory && keyword.startsWith('tag::')) {
        title = state.searchCategoryInfo.categoryName
        bulbUrl = state.searchCategoryInfo.url
        isFavorite = getters.checkTagFavorite(keyword.replace('tag::', ''))
        action = () => store.dispatch(`${namespace}/toggleFavorite`, { tags: { keyword: keyword.replace('tag::', '') } })
        // Svg category search result. (non-fav)
      } else if (searchingCategory && !keyword.startsWith('tag::')) {
        const category = find(state.categories, ['title', keyword])
        title = state.searchCategoryInfo.categoryName
        bulbUrl = state.searchCategoryInfo.url
        isFavorite = category ? getters.checkCategoryFavorite(category?.id) : false
        action = () => category && store.dispatch(`${namespace}/toggleFavorite`, { categories: { id: category.id } })
      } else return {}

      const bulbIcon = bulbUrl ? [{
        icon: 'inspiration',
        width: 24,
        action: () => { window.open(bulbUrl) }
      }] : []

      return {
        title,
        icons: [...bulbIcon, { // Only non-else will return icons
          icon: isFavorite ? 'favorites-fill' : 'favorites',
          width: 24,
          action
        }]
      }
    }
  }

  return {
    namespaced: true,
    state: getDefaultState,
    getters,
    mutations,
    actions
  }
}
