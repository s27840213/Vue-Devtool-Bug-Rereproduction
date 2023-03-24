import axios from '@/apis'
import i18n from '@/i18n'
import { ICategoryContentApiParams, IGifResponse, ITagContentApiParams } from '@/interfaces/giphy'
import store from '@/store'

class Giphy {
  getCategories(pageIndex: number) {
    return axios.request<IGifResponse>({
      url: '/list-lib-gif',
      method: 'GET',
      params: {
        action: 0,
        page_index: pageIndex,
        locale: i18n.global.locale,
        app: 1,
        cache: true,
        ver: store.getters['user/getVerApi'],
        platform: window.location.host
      }
    })
  }

  getCategoryContent(nextSearch: ICategoryContentApiParams) {
    return axios.request<IGifResponse>({
      url: '/list-lib-gif',
      method: 'GET',
      params: {
        action: 1,
        category_ids: nextSearch.categoryId,
        keywords: nextSearch.keyword,
        page_index: nextSearch.nextPage,
        locale: i18n.global.locale,
        app: 1,
        cache: true,
        ver: store.getters['user/getVerApi'],
        platform: window.location.host
      }
    })
  }

  getTagContent(nextSearch: ITagContentApiParams) {
    return axios.request<IGifResponse>({
      url: '/list-lib-gif',
      method: 'GET',
      params: {
        action: 3,
        keywords: `${nextSearch.keyword}:${nextSearch.type}`,
        page_index: nextSearch.nextPage,
        locale: i18n.global.locale,
        app: 1,
        cache: true,
        ver: store.getters['user/getVerApi'],
        platform: window.location.host
      }
    })
  }

  getFavoritesCategories(category_ids: string, nextPage: number) {
    return axios.request<IGifResponse>({
      url: '/list-lib-gif',
      method: 'GET',
      params: {
        action: 0,
        category_ids: category_ids,
        page_index: nextPage,
        locale: i18n.global.locale,
        app: 1,
        cache: true,
        ver: store.getters['user/getVerApi'],
        platform: window.location.host
      }
    })
  }

  getFavoritesTags(keywords: string, nextPage: number) {
    return axios.request<IGifResponse>({
      url: '/list-lib-gif',
      method: 'GET',
      params: {
        action: 2,
        keywords: keywords,
        page_index: nextPage,
        locale: i18n.global.locale,
        app: 1,
        cache: true,
        ver: store.getters['user/getVerApi'],
        platform: window.location.host
      }
    })
  }
}

export default new Giphy()
