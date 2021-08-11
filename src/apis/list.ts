import axios from '@/apis'
import authToken from './auth-token'
import {
  IListServiceParams,
  IListServiceResponse
} from '@/interfaces/api'

class ListService {
  getList (path:string, params: IListServiceParams) {
    const data = {
      token: authToken().token,
      locale: params.locale,
      category: params.category,
      page_index: params.pageIndex
    }
    return axios.request<IListServiceResponse>({
      url: `/list-${path}`,
      method: 'POST',
      data
    })
  }

  getSvg (params: IListServiceParams) {
    return this.getList('svg', params)
  }

  getTemplate (params: IListServiceParams) {
    return this.getList('template', params)
  }

  getText (params: IListServiceParams) {
    return this.getList('text', params)
  }
}

export default new ListService()
