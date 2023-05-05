import giphyApi from '@/apis/giphy'
import i18n from '@/i18n'
import {
  ICategoryContentApiParams, IGif, IGifCategory, IGifCategoryContent, IGifCategoryExtend,
  IGifCategoryList, IGiphyFavorite, IGiphyFavoriteCategoryContent, IGiphyFavoritesSearchResult,
  IGiphyFavoriteTagContent, isIGifCategory, isITag, ITag, ITagContentApiParams, ITagExtend
} from '@/interfaces/giphy'
import store from '@/store/index'
import localStorageUtils from '@/utils/localStorageUtils'
import logUtils from '@/utils/logUtils'
import popupUtils from '@/utils/popupUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'
import { cloneDeep, filter, find, map, pull } from 'lodash'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

type IPending = {
  categories: boolean
  content: boolean
  favorites: boolean
}

interface IGiphyState {
  categories: IGifCategory[]
  searchResult: IGifCategoryContent
  tags: ITag[]
  nextCategory: number
  nextCategoryContent: ICategoryContentApiParams
  nextTagContent: ITagContentApiParams
  selectedGif: IGif
  pending: IPending
  favorites: {
    // Should sync with local storage:
    items: IGiphyFavorite<IGif>
    tags: IGiphyFavorite<true>
    categories: IGiphyFavorite<true>
    // The following should not sync:
    nextTags: string[]
    nextCategories: string[]
    tagsContent: IGiphyFavoriteTagContent
    categoriesContent: IGiphyFavoriteCategoryContent
    searchTarget: string | ITagExtend | IGifCategoryExtend
  }
}

const getDefaultState = (): IGiphyState => ({
  categories: [],
  searchResult: {
    tags: [],
    content: []
  },
  tags: [],
  nextCategory: 0,
  nextCategoryContent: {
    categoryId: -1,
    categoryName: '',
    keyword: null,
    nextPage: null
  },
  nextTagContent: {
    keyword: '',
    type: 0,
    nextPage: 0
  },
  selectedGif: {
    id: '',
    type: 0,
    width: 0,
    height: 0,
    mid: -1,
    has_d: 0,
    src: ''
  },
  pending: {
    categories: false,
    content: false,
    favorites: false
  },
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
    nextTags: [],
    nextCategories: [],
    tagsContent: {},
    categoriesContent: {},
    searchTarget: '',
  }
})
const state = getDefaultState()

const $all = Object.freeze({
  active: true,
  keyword: '$all',
  type: 0
}) as ITag

function favoritesCategoryActiveTag() {
  const { searchTarget } = state.favorites
  if (!isIGifCategory(searchTarget)) return ''
  const tags = state.favorites.categoriesContent[searchTarget.id]?.tags
  const tag = find(tags, 'active') ?? $all
  return `${tag.keyword}:${tag.type}`
}

function processGiphy(data: IGifCategoryList, gifs = [] as IGif[]) {
  const gifsId = map(gifs, 'id')

  // Add isFavorite and src attrs.
  data.content.forEach(category => {
    // Remove duplicate gif.
    if (gifs.length) {
      category.list = category.list.filter((gif) => {
        return !gifsId.includes(gif.id)
      })
    }
    category.list.forEach((gif) => {
      gif.src = `https://media${gif.mid}.giphy.com/media/${gif.id}/giphy-preview.gif`
    })
  })
}

function keyword2tag(_keyword: string): { keyword: string, type: 0 | 1 } {
  if (!/.*:\d/.test(_keyword)) {
    _keyword = `${_keyword}:0`
  }
  const [keyword, _type] = _keyword.split(':')
  const type = parseInt(_type) as 0 | 1
  return { keyword, type }
}

const actions: ActionTree<IGiphyState, unknown> = {
  async initGiphy({ commit, dispatch }) {
    dispatch('getCategories').then(() => {
      vivistickerUtils.listAsset('giphy')
    })

    commit('SET_pending', { favorites: true })
    for (const target of ['categories', 'tags', 'items']) {
      commit('UPDATE_favorites', {
        [target]: await localStorageUtils.appGet('favorites', `giphy.${target}`)
      })
    }
    commit('UPDATE_favorites', {
      nextTags: state.favorites.tags.order,
      nextCategories: state.favorites.categories.order
    })
    commit('SET_pending', { favorites: false })
    await dispatch('getFavoritesTags')
    await dispatch('getFavoritesCategories')
  },
  async getCategories({ commit }) {
    const { nextCategory } = state
    if (nextCategory === -1) return
    commit('SET_pending', { categories: true })

    await giphyApi.getCategories(nextCategory).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getCategories(${nextCategory}): contentId = [${data.content.map(c => c.id)}]`)
      let oldCategories = state.categories
      processGiphy(data)

      if (nextCategory === 0) {
        oldCategories = [{
          id: -1,
          title: i18n.global.t('NN0024'),
          list: [],
          is_recent: 1
        } as IGifCategory]
        commit('SET_STATE', { tags: data.tags })
      }
      commit('SET_STATE', {
        categories: oldCategories.concat(data.content),
        nextCategory: data.next_page
      })
      commit('SET_pending', { categories: false })
    })
  },
  // Set category content search target, and do search.
  getCategoryContent({ commit, dispatch }, categoryName: string) {
    const category = find(state.categories, ['title', categoryName])
    if (!category) return

    commit('SET_STATE', {
      nextCategoryContent: {
        categoryId: category.id,
        categoryName: categoryName,
        keyword: null,
        nextPage: null
      }
    })
    dispatch('getMoreCategoryContent')
  },
  // Category search.
  getMoreCategoryContent({ commit }) {
    const { nextCategoryContent } = state
    const pending = state.pending.content
    if (pending || nextCategoryContent.nextPage === -1) return
    commit('SET_pending', { content: true })

    giphyApi.getCategoryContent(nextCategoryContent).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getCategoryContent(${JSON.stringify(nextCategoryContent)}): contentId = [${data.content[0].list.map(c => c.id)}]`)
      processGiphy(data, state.searchResult.content)

      commit('UPDATE_searchResult', {
        tags: data.tags,
        content: state.searchResult.content.concat(data.content[0].list)
      })
      commit('UPDATE_nextCategoryContent', {
        keyword: data.keyword,
        nextPage: data.next_page
      })
    })
  },
  searchTag({ commit, dispatch, getters }, rawKeyword: string) {
    // User click 'All' tag, search category instead tag.
    if (rawKeyword === '$all') {
      dispatch('getCategoryContent', state.nextCategoryContent.categoryName)
      return
    }
    const { keyword, type } = keyword2tag(rawKeyword)

    if (getters.isSearchingCategory) {
      const target = cloneDeep(state.searchResult)
      const tag = find(target.tags, { keyword, type }) as ITag
      tag.active = true
      commit('SET_STATE', { searchResult: target })
    } else {
      const target = cloneDeep(state.tags)
      const tag = find(target, { keyword, type })
      if (tag) {
        tag.active = true
        commit('SET_STATE', { tags: target })
      }
    }
    commit('SET_STATE', {
      nextTagContent: {
        keyword,
        type,
        nextPage: 0
      }
    })

    dispatch('getMoreTagContent')
  },
  getMoreTagContent({ commit }) {
    const { nextTagContent } = state
    const pending = state.pending.content
    if (pending || nextTagContent.nextPage === -1) return
    commit('SET_pending', { content: true })

    giphyApi.getTagContent(nextTagContent).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getTagContent(${JSON.stringify(nextTagContent)}): contentId = [${data.content[0].list.map(c => c.id)}]`)
      processGiphy(data, state.searchResult.content)

      commit('UPDATE_searchResult', {
        tags: data.tags,
        content: state.searchResult.content.concat(data.content[0].list)
      })
      commit('UPDATE_nextTagContent', {
        nextPage: data.next_page
      })
    })
  },
  resetCategoryContent({ commit, dispatch }) {
    commit('SET_STATE', {
      searchResult: {
        tags: [],
        content: []
      },
      nextCategoryContent: {
        categoryId: -1,
        categoryName: '',
        keyword: null,
        nextPage: null
      }
    })
    dispatch('searchFavorites', 'none')
  },
  resetTagContent({ commit, dispatch }) {
    // Keep tags but reset their active state.
    const tags = cloneDeep(state.tags)
    tags.forEach((tag) => { tag.active = false })
    const searchResultTags = cloneDeep(state.searchResult.tags)
    searchResultTags.forEach((tag) => { tag.active = false })

    commit('SET_STATE', {
      tags: tags,
      searchResult: {
        tags: searchResultTags,
        content: []
      },
      nextTagContent: {
        keyword: '',
        type: 0,
        nextPage: 0
      }
    })
    dispatch('searchFavorites', 'none')
  },
  // Favorites actions
  async getFavoritesCategories({ commit }) {
    const { nextCategories } = state.favorites
    const pending = state.pending.favorites
    if (pending || nextCategories.length === 0) return
    commit('SET_pending', { favorites: true })
    const toRequest = nextCategories.slice(0, 12)

    await giphyApi.getFavoritesCategories(toRequest.join(','), 0).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getFavoritesCategories(${toRequest}): contentId = [${data.content.map(c => c.id)}]`)
      processGiphy(data)
      const result = cloneDeep(state.favorites.categoriesContent)
      for (const category of data.content) {
        Object.assign(result, {
          [category.id]: {
            next: {
              categoryId: category.id,
              categoryName: category.title,
              keyword: null,
              nextPage: null
            },
            gifs: category.list,
            tags: []
          }
        })
      }

      commit('UPDATE_favorites', {
        categoriesContent: result,
        nextCategories: nextCategories.slice(12)
      })
    })
  },
  async getFavoritesTags({ commit }) {
    const { nextTags } = state.favorites
    const pending = state.pending.favorites
    if (pending || nextTags.length === 0) return
    commit('SET_pending', { favorites: true })
    const toRequest = nextTags.slice(0, 12)

    await giphyApi.getFavoritesTags(toRequest.join(','), 0).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getFavoritesTags(${toRequest}): contentId = [${data.content.map(c => c.title)}]`)
      processGiphy(data)
      const result = cloneDeep(state.favorites.tagsContent)
      for (const category of data.content) {
        Object.assign(result, {
          [`${category.title}:${category.type}`]: {
            next: {
              keyword: category.title,
              type: category.type,
              nextPage: 0
            },
            gifs: category.list
          }
        })
      }

      commit('UPDATE_favorites', {
        tagsContent: result,
        nextTags: nextTags.slice(12)
      })
    })
  },
  getFavoritesCategoriesContent({ commit }, id: string) {
    const pending = state.pending.favorites
    const categoriesContent = cloneDeep(state.favorites.categoriesContent)
    const { next, gifs, tags } = categoriesContent[id] ?? { next: { categoryId: id }, gifs: [], tags: [] }
    const { categoryId, nextPage } = next
    if (pending || nextPage === -1) return
    commit('SET_pending', { favorites: true })

    giphyApi.getCategoryContent(next).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getCategoryContent(${JSON.stringify(next)}): contentId = [${data.content[0].list.map(c => c.id)}]`)
      if (data.content.length === 0) {
        commit('SET_pending', { favorites: false })
        return
      }
      processGiphy(data, gifs)

      categoriesContent[categoryId] = {
        next: {
          categoryId,
          categoryName: data.content[0].title,
          keyword: data.keyword as string,
          nextPage: data.next_page
        },
        gifs: gifs.concat(data.content[0].list),
        // Add a special tag that show category search result instead tag result.
        tags: data.tags ? [$all, ...data.tags].map((tag) => ({
          active: tag.active ?? false,
          keyword: tag.keyword,
          type: tag.type
        })) : tags
      }
      commit('UPDATE_favorites', { categoriesContent })
    })
  },
  getFavoritesTagsContent({ commit }, id: string) {
    const pending = state.pending.favorites
    const tagsContent = cloneDeep(state.favorites.tagsContent)
    const { next, gifs } = tagsContent[id] ?? { next: keyword2tag(id), gifs: [] }
    const { keyword, type, nextPage } = next
    if (pending || nextPage === -1) return
    const key = `${keyword}:${type}`
    commit('SET_pending', { favorites: true })

    giphyApi.getTagContent(next).then((response) => {
      const data = response.data.data
      logUtils.setLog(`giphyApi.getTagContent(${JSON.stringify(next)}): content = [${data.content[0].list.map(c => c.id)}]`)
      processGiphy(data, gifs)

      tagsContent[key] = {
        next: {
          keyword,
          type,
          nextPage: data.next_page
        },
        gifs: gifs.concat(data.content[0].list)
      }
      commit('UPDATE_favorites', { tagsContent })
    })
  },
  selectGif({ commit }, gif: IGif) {
    commit('SET_STATE', { selectedGif: gif })
  },
  async toggleFavorite({ commit, dispatch, getters }, favs: Record<string, IGif | string | number>) {
    for (const [type, target] of Object.entries(favs)) {
      let key: string
      let saveData: true | IGif = true
      let getContent = () => { /**/ }

      switch (type) {
        case 'tags':
          if ((getters.favoritesTags as ITagExtend[]).length <= 6) dispatch('getFavoritesTags') // If user delete too many fav, get more content.
          key = (target as string)
          getContent = () => { dispatch('getFavoritesTagsContent', key) }
          break
        case 'categories':
          if ((getters.favoritesCategories as IGifCategoryExtend[]).length <= 6) dispatch('getFavoritesCategories')
          key = (target as number).toString()
          getContent = () => { dispatch('getFavoritesCategoriesContent', key) }
          break
        case 'items':
          saveData = target as IGif
          key = saveData.id
          break
        default:
      }

      commit('UPDATE_favorites', {
        [type]: await localStorageUtils.appUpdate('favorites', `giphy.${type}`, (old: IGiphyFavorite<true | IGif>) => {
          if (old.obj[key]) {
            old.order = pull(old.order, key)
            delete old.obj[key]
            popupUtils.openPopup('icon', {}, { iconName: 'favorites' })
          } else {
            old.order = [key, ...old.order]
            old.obj[key] = saveData
            getContent()
            popupUtils.openPopup('icon', {}, { iconName: 'favorites-fill' })
          }
          return old
        })
      })
    }
  },
  searchFavorites({ commit }, target: string | unknown) {
    commit('UPDATE_favorites', { searchTarget: target })
  },
  searchMoreFavorites({ dispatch }) {
    const { searchTarget } = state.favorites
    const activeTag = favoritesCategoryActiveTag()
    if (isITag(searchTarget)) {
      dispatch('getFavoritesTagsContent', searchTarget.id)
    } else if (isIGifCategory(searchTarget) && activeTag === '$all:0') {
      dispatch('getFavoritesCategoriesContent', searchTarget.id)
    } else if (isIGifCategory(searchTarget)) {
      dispatch('getFavoritesTagsContent', activeTag)
    }
    switch (searchTarget) {
      case i18n.global.tc('NN0761'):
        dispatch('getFavoritesTags')
        break
      case i18n.global.tc('NN0760'):
        dispatch('getFavoritesCategories')
        break
    }
  },
  searchTagInFavoritesCategory({ commit, dispatch }, keyword: string) {
    const searchTarget = state.favorites.searchTarget as IGifCategory
    const categoriesContent = cloneDeep(state.favorites.categoriesContent)
    const tags = categoriesContent[searchTarget.id].tags
    const tag = find(tags, keyword2tag(keyword)) as ITag
    tags.forEach((tag) => { tag.active = false })
    if (tag) {
      tag.active = true
    } else {
      tags[0].active = true
    }
    commit('UPDATE_favorites', { categoriesContent })
    dispatch('searchMoreFavorites')
  }
}

const mutations: MutationTree<IGiphyState> = {
  SET_STATE(state: IGiphyState, data: Partial<IGiphyState>) {
    const newState = data || getDefaultState()
    const keys = Object.keys(newState) as Array<keyof IGiphyState>
    keys
      .forEach(key => {
        if (key in state) {
          (state[key] as unknown) = newState[key]
        }
      })
  },
  SET_pending(state: IGiphyState, data: Record<keyof IPending, boolean>) {
    for (const item of Object.entries(data)) {
      state.pending[item[0] as keyof IPending] = item[1]
    }
  },
  UPDATE_searchResult(state: IGiphyState, result: { tags?: ITag[], content: IGif[] }) {
    if (result.tags && result.tags.length !== 0) {
      // Add a special tag that show category search result instead tag result.
      state.searchResult.tags = [$all, ...result.tags]
    }
    state.searchResult.content = result.content
  },
  UPDATE_nextCategoryContent(state: IGiphyState, next: { keyword: string, nextPage: number }) {
    state.nextCategoryContent.keyword = next.keyword
    state.nextCategoryContent.nextPage = next.nextPage
    state.pending.content = false
  },
  UPDATE_nextTagContent(state: IGiphyState, next: { nextPage: number }) {
    state.nextTagContent.nextPage = next.nextPage
    state.pending.content = false
  },
  UPDATE_favorites(state: IGiphyState, obj: Record<string, unknown>) {
    for (const item of Object.entries(obj)) {
      Object.assign(state.favorites, { [item[0]]: item[1] })
    }
    state.pending.favorites = false
  }
}

function processTags(tag: ITag) {
  return tag.keyword === '$all' ? {
    active: tag.active,
    value: tag.keyword,
    label: i18n.global.tc('NN0324')
  } : {
    active: tag.active,
    value: `${tag.keyword}:${tag.type}`,
    label: tag.keyword
  }
}

const getters: GetterTree<IGiphyState, unknown> = {
  pending(state: IGiphyState) {
    return Object.entries(state.pending).some(([key, value]) => value)
  },
  isSearchingCategory(state: IGiphyState) {
    return state.nextCategoryContent.categoryId !== -1
  },
  isSearchingTag(state: IGiphyState) {
    return state.nextTagContent.keyword !== ''
  },
  tagsBar(state: IGiphyState, getters) { // Data for tags.vue component
    const target = getters.isSearchingCategory
      ? state.searchResult.tags : state.tags
    return target.map(processTags)
  },
  favoritesTagsBar(state: IGiphyState, getters) { // Data for tags.vue component
    const fsr = getters.favoritesSearchResult as IGiphyFavoritesSearchResult
    const target = fsr.title
      ? fsr.tags : []
    return target.map(processTags)
  },
  keyword(state: IGiphyState, getters) {
    return getters.favoritesSearchResult.title || state.nextCategoryContent.categoryName || state.nextTagContent.keyword
  },
  checkItemFavorites(state: IGiphyState) {
    return (id: string): boolean => state.favorites.items.obj[id] !== undefined
  },
  checkCategoryFavorite(state: IGiphyState) {
    return (id: string): boolean => state.favorites.categories.obj[id] !== undefined
  },
  checkTagFavorite(state: IGiphyState) {
    return (rawKeyword: string): boolean | undefined => {
      if (rawKeyword === '') return undefined
      const { keyword, type } = keyword2tag(rawKeyword)
      return state.favorites.tags.obj[`${keyword}:${type}`] !== undefined
    }
  },
  favoritesItems(state: IGiphyState): IGif[] {
    return state.favorites.items.order.map((key) => {
      return state.favorites.items.obj[key]
    })
  },
  favoritesTags(state: IGiphyState): ITagExtend[] {
    return filter(state.favorites.tags.order.map((id) => {
      const { keyword, type } = keyword2tag(id)
      return {
        id,
        keyword,
        type,
        active: false,
        list: state.favorites.tagsContent[id]?.gifs
      }
    }), 'list')
  },
  favoritesCategories(state: IGiphyState): IGifCategoryExtend[] {
    return filter(state.favorites.categories.order.map((id) => {
      const content = state.favorites.categoriesContent[id]
      return {
        id: parseInt(id),
        title: content?.next.categoryName,
        list: content?.gifs
      }
    }), 'list')
  },
  favoritesSearchResult(state: IGiphyState, getters): IGiphyFavoritesSearchResult {
    const { searchTarget } = state.favorites
    const activeTag = favoritesCategoryActiveTag()
    // Searching a tag.
    if (isITag(searchTarget)) {
      return {
        title: searchTarget.keyword,
        content: state.favorites.tagsContent[searchTarget.id]?.gifs,
        tags: []
      }
      // Searching a category, while $all tag active.
    } else if (isIGifCategory(searchTarget) && activeTag === '$all:0') {
      return {
        title: searchTarget.title,
        content: state.favorites.categoriesContent[searchTarget.id]?.gifs,
        tags: state.favorites.categoriesContent[searchTarget.id]?.tags
      }
      // Searching a category, while $all tag inactive. Aka searching a tag.
    } else if (isIGifCategory(searchTarget)) {
      return {
        title: searchTarget.title,
        content: state.favorites.tagsContent[activeTag]?.gifs,
        tags: state.favorites.categoriesContent[searchTarget.id]?.tags
      }
    }
    switch (searchTarget) {
      case i18n.global.tc('NN0762'):
        return {
          title: searchTarget,
          content: getters.favoritesItems as IGif[],
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
          content: getters.favoritesCategories as IGifCategoryExtend[],
          tags: []
        }
      case 'none':
      default:
        return { title: '', content: [], tags: [] }
    }
  },
  headerTab(state: IGiphyState, getters) {
    const { categoryId } = state.nextCategoryContent
    const { keyword: tagKeyword, type: tagType } = state.nextTagContent
    const { searchTarget } = state.favorites
    const activeTag = favoritesCategoryActiveTag()
    let isFavorite: boolean
    let action: () => void

    // Giphy tag search result in category
    if (categoryId !== -1 && tagKeyword) {
      isFavorite = getters.checkTagFavorite(`${tagKeyword}:${tagType}`)
      action = () => store.dispatch('giphy/toggleFavorite', { tags: `${tagKeyword}:${tagType}` })
      // Giphy category search result
    } else if (categoryId !== -1) {
      isFavorite = getters.checkCategoryFavorite(categoryId)
      action = () => store.dispatch('giphy/toggleFavorite', { categories: categoryId })
      // Favorites giphy category
    } else if (isIGifCategory(searchTarget) && activeTag === '$all:0') {
      isFavorite = getters.checkCategoryFavorite(searchTarget.id)
      action = () => store.dispatch('giphy/toggleFavorite', { categories: searchTarget.id })
      // Searching a category, while $all tag inactive. Aka searching a tag.
    } else if (isIGifCategory(searchTarget)) {
      isFavorite = getters.checkTagFavorite(activeTag)
      action = () => store.dispatch('giphy/toggleFavorite', { tags: activeTag })
      // Favorites giphy tag
    } else if (isITag(searchTarget)) {
      isFavorite = getters.checkTagFavorite(searchTarget.id)
      action = () => store.dispatch('giphy/toggleFavorite', { tags: searchTarget.id })
    } else return []

    return [{ // Only non-else will return icon favorites/favorites-fill
      icon: isFavorite ? 'favorites-fill' : 'favorites',
      width: 24,
      action
    }]
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
