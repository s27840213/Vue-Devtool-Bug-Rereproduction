import axios from '@/apis'
import {
  IPhotoServiceParams,
  IPhotoServiceResponse
} from '@/interfaces/api'

class PhotoService {
  getList (params: IPhotoServiceParams) {
    const data = {
      token: '1',
      type: params.type,
      locale: params.locale || 'tw',
      page_index: params.pageIndex,
      keyword: params.keyword,
      cache: true,
      platform: window.location.host
    }
    return axios.request<IPhotoServiceResponse>({
      url: '/list-lib-photo',
      method: 'GET',
      params: data
    })
  }

  getUnsplash (params: IPhotoServiceParams) {
    params.type = 'unsplash'
    return this.getList(params)
  }

  getPexels (params: IPhotoServiceParams) {
    params.type = 'pexels'
    return this.getList(params)
  }
}

export default new PhotoService()
