import axios from '@/apis'
import { IListServiceParams, IListServiceResponse } from '@/interfaces/api'
import store from '@/store'
import generalUtils from '@/utils/generalUtils'
import localeUtils from '@/utils/localeUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import uploadUtils from '@/utils/uploadUtils'
import authToken from './auth-token'
import { getAutoWVUtils } from '@/utils/autoWVUtils'
import cmWVUtils from '@/utils/cmWVUtils'

class ListService {
  getList(params: IListServiceParams) {
    const searchParams = {
      token: params.token || '1',
      type: params.type,
      locale: params.locale || 'tw',
      page_index: params.pageIndex,
      list_all: params.listAll,
      list_category: params.listCategory,
      list_tag: params.listTag,
      category_ids: params.categoryIds,
      keyword: params.keyword,
      font_list: params.fontList,
      theme: params.theme,
      group_id: params.groupId,
      cache: params.cache,
      platform: params.cache ? window.location.host : null,
      ver: params.cache ? store.getters['user/getVerApi'] : null,
      // [2022.01.19] uncached: font, layout
      all_theme: params.all_theme,
      ...(params.shuffle === 1 && { shuffle: params.shuffle }),
      // app: 0: vivipic (default), 1: vivisticker, 2: charmix
      ...this.app,
      // for vivisticker text panel of US version
      col_num: params.colNum,
      // for vivisticker template
      ig_layout: params.igLayout,
      // for charmix hidden message
      is_hm: params.isHm
    }

    return axios.request<IListServiceResponse>({
      url: '/list-design',
      method: 'GET',
      params: searchParams
    })
  }
  
  get app() {
    // If admin and url have 'app', bring app to api.
    if (store.getters['user/isAdmin']) {
      const app = /app=(?<value>\d+)/.exec(window.location.href)?.groups?.value
      if (app) return { app }
    }
    if (generalUtils.isStk) return { app: 1 }
    if (generalUtils.isCm) return { app: 2 }
    return {}
  }

  getInfoList(type: string, designIds: string[], igLayout?: 'story' | 'post', isHm?: 0 | 1) {
    const searchParams = {
      token: '1',
      type,
      design_ids: designIds.join(','),
      locale: localeUtils.currLocale(),
      cache: true,
      platform: window.location.host,
      ver: store.getters['user/getVerApi'],
      ...this.app,
      // for vivisticker template
      ...(igLayout && { ig_layout: igLayout }),
      // for charmix hidden message
      ...(isHm !== undefined && { is_hm: isHm })
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
    params.cache = generalUtils.isStk || generalUtils.isCm // vivisticker and charmix doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getTemplate(params: IListServiceParams) {
    params.type = 'template'
    params.cache = generalUtils.isStk || generalUtils.isCm // vivisticker and charmix doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getText(params: IListServiceParams) {
    params.type = 'text'
    params.cache = generalUtils.isStk || generalUtils.isCm // vivisticker and charmix doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getBackground(params: IListServiceParams) {
    params.type = 'background'
    params.cache = generalUtils.isStk || generalUtils.isCm // vivisticker and charmix doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getFont(params: IListServiceParams) {
    params.type = 'font'
    params.fontList = 2
    params.cache = generalUtils.isStk || generalUtils.isCm // vivisticker and charmix doesn't fetch recently-used with API, so cache can be used here.
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
    if (generalUtils.isStk && stkWVUtils.addDesignDisabled()) {
      return new Promise<{ flag: number }>(resolve => resolve({ flag: 0 }))
    }
    const data = {
      token: generalUtils.isPic ? authToken().token : '1',
      type,
      design_id: id,
      locale: localeUtils.currLocale(),
      ...generalUtils.isStk && { host_id: uploadUtils.hostId },
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
    if (generalUtils.isPic) {
      return this.getList({
        token: authToken().token || '',
        locale: localeUtils.currLocale(),
        type: 'color'
      })
    } else if (generalUtils.isStk || generalUtils.isCm) {
      getAutoWVUtils().listAsset('color')
    }
  }

  addRecentlyUsedColor(color: string) {
    (generalUtils.isStk || generalUtils.isCm) && getAutoWVUtils().addAsset('color', { id: color })
    if (generalUtils.isStk && stkWVUtils.addDesignDisabled()) return
    if (generalUtils.isCm && cmWVUtils.addDesignDisabled()) return
    axios.request<IListServiceResponse>({
      url: '/add-design',
      method: 'POST',
      data: {
        token: (generalUtils.isPic || generalUtils.isCm) ? (authToken().token || '') : '1',
        type: 'color',
        design_id: color,
        locale: localeUtils.currLocale(),
        ...this.app,
        ...(generalUtils.isStk || generalUtils.isCm) && { host_id: uploadUtils.hostId },
      }
    })
  }
}

export default new ListService()
