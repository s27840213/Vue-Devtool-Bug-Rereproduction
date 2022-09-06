import axios from '@/apis'
import authToken from './auth-token'
import localeUtils from '@/utils/localeUtils'
import {
  IListServiceParams,
  IListServiceResponse
} from '@/interfaces/api'
import store from '@/store'

class ListService {
  getList(params: IListServiceParams) {
    const searchParams = {
      token: params.token || '1',
      type: params.type,
      locale: params.locale || 'tw',
      page_index: params.pageIndex,
      list_all: params.listAll,
      list_category: params.listCategory,
      keyword: params.keyword,
      font_list: params.fontList,
      theme: params.theme,
      group_id: params.groupId,
      cache: params.cache,
      platform: params.cache ? window.location.host : null,
      ver: params.cache ? store.getters['user/getVerApi'] : null,
      // [2022.01.19] uncached: font, layout
      all_theme: params.all_theme,
      // app: 0: vivipic (default), 1: vivisticker
      app: 1
    }

    return axios.request<IListServiceResponse>({
      url: '/list-design',
      method: 'GET',
      params: searchParams
    })
  }

  // For list factories
  getSvg(params: IListServiceParams) {
    params.type = 'svg'
    return this.getList(params)
  }

  getTemplate(params: IListServiceParams) {
    params.type = 'template'
    return this.getList(params)
  }

  getText(params: IListServiceParams) {
    params.type = 'text'
    return this.getList(params)
  }

  getBackground(params: IListServiceParams) {
    params.type = 'background'
    return this.getList(params)
  }

  getFont(params: IListServiceParams) {
    params.type = 'font'
    params.fontList = 2
    return this.getList(params)
  }

  getMarker(params: IListServiceParams) {
    params.type = 'marker'
    params.token = '1'
    params.cache = true
    return this.getList(params)
  }

  getLayout(params: IListServiceParams) {
    params.type = 'layout'
    // layout has recently-used list, cannot be cached.
    // params.token = '1'
    // params.cache = true
    return this.getList(params)
  }

  getHashtag(params: IListServiceParams) {
    params.type = 'hashtag'
    params.token = '1'
    params.cache = true
    return this.getList(params)
  }

  // For other usage
  addDesign(id: string, type: string, params: IListServiceParams = {}) {
    const data = {
      token: authToken().token,
      type,
      design_id: id,
      ...params
    }
    if (!data.token) return new Promise(resolve => resolve({ flag: 1 }))
    return axios.request<IListServiceResponse>({
      url: '/add-design',
      method: 'POST',
      data
    })
  }

  getTheme(params: IListServiceParams) {
    params.type = 'theme'
    params.locale = localeUtils.currLocale()
    params.token = '1'
    params.all_theme = 1
    params.cache = true
    return this.getList(params)
  }

  getRecentlyUsedColor() {
    return this.getList({
      token: authToken().token || '',
      locale: localeUtils.currLocale(),
      type: 'color'
    })
  }

  addRecentlyUsedColor(color: string) {
    return axios.request<IListServiceResponse>({
      url: '/add-design',
      method: 'POST',
      data: {
        token: authToken().token || '',
        type: 'color',
        design_id: color
      }
    })
  }
}

export default new ListService()
