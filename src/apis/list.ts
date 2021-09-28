import axios from '@/apis'
import authToken from './auth-token'
import {
  IListServiceParams,
  IListServiceResponse
} from '@/interfaces/api'

class ListService {
  getList (params: IListServiceParams) {
    const data = {
      token: authToken().token,
      type: params.type,
      locale: params.locale || 'tw',
      page_index: params.pageIndex,
      list_all: params.listAll,
      keyword: params.keyword,
      return_obj: 1
    }

    return axios.request<IListServiceResponse>({
      url: '/list-design',
      method: 'POST',
      data
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
    return this.getList(params)
  }

  addDesign (id: string, type: string) {
    const data = {
      token: authToken().token,
      type,
      design_id: id
    }

    return axios.request<IListServiceResponse>({
      url: '/add-design',
      method: 'POST',
      data
    })
  }

  getMarker (params: IListServiceParams) {
    params.type = 'marker'
    return this.getList(params)
  }
}

export default new ListService()
