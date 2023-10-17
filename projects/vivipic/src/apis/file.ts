import axios from '@nu/vivi-lib/apis'
import authToken from '@nu/vivi-lib/apis/auth-token'
import { AxiosPromise } from 'axios'
import { IUserAssetsData } from '@nu/vivi-lib/interfaces/api'

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
