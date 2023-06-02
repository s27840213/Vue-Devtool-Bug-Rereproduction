import axios from '@/apis'
import { IListServiceParams, IListServiceResponse } from '@/interfaces/api'
import store from '@/store'
import localeUtils from '@/utils/localeUtils'
import uploadUtils from '@/utils/uploadUtils'
import vivistickerUtils from '@/utils/vivistickerUtils'

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
      // app: 0: vivipic (default), 1: vivisticker
      app: 1,
      // for vivisticker text panel of US version
      col_num: params.colNum,
      // for vivisticker template
      ig_layout: params.igLayout
    }

    return axios.request<IListServiceResponse>({
      url: '/list-design',
      method: 'GET',
      params: searchParams
    })
  }

  getInfoList(type: string, designIds: string[], igLayout?: 'story' | 'post') {
    const searchParams = {
      token: '1',
      type,
      design_ids: designIds.join(','),
      locale: localeUtils.currLocale(),
      cache: true,
      platform: window.location.host,
      ver: store.getters['user/getVerApi'],
      app: 1,
      // for vivisticker template
      ...(igLayout && { ig_layout: igLayout })
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
    params.cache = true // vivisticker doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getTemplate(params: IListServiceParams) {
    params.type = 'template'
    params.cache = true // vivisticker doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getText(params: IListServiceParams) {
    params.type = 'text'
    params.cache = true // vivisticker doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getBackground(params: IListServiceParams) {
    params.type = 'background'
    params.cache = true // vivisticker doesn't fetch recently-used with API, so cache can be used here.
    return this.getList(params)
  }

  getFont(params: IListServiceParams) {
    params.type = 'font'
    params.fontList = 2
    params.cache = true // vivisticker doesn't fetch recently-used with API, so cache can be used here.
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
    if (vivistickerUtils.addDesignDisabled()) return new Promise<{ flag: number }>(resolve => resolve({ flag: 0 }))
    const data = {
      token: '1',
      type,
      design_id: id,
      locale: localeUtils.currLocale(),
      host_id: uploadUtils.hostId,
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
    return vivistickerUtils.listAsset('color')
  }

  addRecentlyUsedColor(color: string) {
    vivistickerUtils.addAsset('color', { id: color })
    if (vivistickerUtils.addDesignDisabled()) return
    axios.request<IListServiceResponse>({
      url: '/add-design',
      method: 'POST',
      data: {
        token: '1',
        type: 'color',
        design_id: color,
        locale: localeUtils.currLocale(),
        host_id: uploadUtils.hostId
      }
    })
  }
}

export default new ListService()
