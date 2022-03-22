import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import { IFileParams, IUserAssetsData } from '@/interfaces/api'
class PhotoService {
  getFiles (params: {pageIndex: number}): AxiosPromise {
    return axios.request<IUserAssetsData>({
      url: '/list-asset',
      method: 'POST',
      data: { // IFileParams
        token: authToken().token || '',
        type: 'image',
        page_index: params.pageIndex
      }
    })
  }
}

export default new PhotoService()
