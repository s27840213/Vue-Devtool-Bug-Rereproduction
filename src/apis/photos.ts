import axios from '@/apis'
import authToken from './auth-token'
import {
  IPhotoServiceParams,
  IPhotoServiceResponse
} from '@/interfaces/api'

class PhotoService {
  getList (params: IPhotoServiceParams) {
    const data = {
      token: authToken().token || '',
      type: params.type,
      locale: params.locale || 'tw',
      page_index: params.pageIndex,
      keyword: params.keyword
    }
    return axios.request<IPhotoServiceResponse>({
      url: '/list-lib-photo',
      method: 'POST',
      data
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
