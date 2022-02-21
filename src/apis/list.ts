import axios from '@/apis'
import authToken from './auth-token'
import localeUtils from '@/utils/localeUtils'
import {
  IListServiceParams,
  IListServiceResponse
} from '@/interfaces/api'

class ListService {
  getList (params: IListServiceParams) {
    const searchParams = {
      token: params.token || '1',
      type: params.type,
      locale: params.locale || 'tw',
      page_index: params.pageIndex,
      list_all: params.listAll,
      keyword: params.keyword,
      font_list: params.fontList,
      theme: params.theme,
      group_id: params.groupId,
      cache: params.cache,
      platform: params.cache ? window.location.host : null,
      // [2022.01.19] uncached: font, marker, hashtag
      all_theme: params.all_theme
    }

    return axios.request<IListServiceResponse>({
      url: '/list-design',
      method: 'GET',
      params: searchParams
    })
  }

  getSvg (params: IListServiceParams) {
    params.type = 'svg'
    return this.getList(params)
  }

  getTemplate (params: IListServiceParams) {
    params.type = 'template'
    return this.getList(params)
  }

  getText (params: IListServiceParams) {
    params.type = 'text'
    return this.getList(params)
  }

  getBackground (params: IListServiceParams) {
    params.type = 'background'
    return this.getList(params)
  }

  getFont (params: IListServiceParams) {
    params.type = 'font'
    params.fontList = 1
    return this.getList(params)
  }

  addDesign (id: string, type: string, params: IListServiceParams = {}) {
    const data = {
      token: authToken().token,
      type,
      design_id: id,
      ...params
    }
    if (!data.token) return
    return axios.request<IListServiceResponse>({
      url: '/add-design',
      method: 'POST',
      data
    })
  }

  getMarker (params: IListServiceParams) {
    params.type = 'marker'
    params.token = '1'
    params.cache = true
    return this.getList(params)
  }

  getLayout (params: IListServiceParams) {
    params.type = 'layout'
    return this.getList(params)
  }

  getTheme (params: IListServiceParams) {
    params.type = 'theme'
    params.locale = localeUtils.currLocale()
    params.token = '1'
    params.all_theme = 1
    params.cache = true
    return this.getList(params)
  }

  getHashtag (params: IListServiceParams) {
    params.type = 'hashtag'
    params.token = '1'
    params.cache = true
    return this.getList(params)
  }
}

export default new ListService()
