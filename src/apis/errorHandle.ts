import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import { IUploadMissingDesign } from '@/interfaces/api'
class ErrorHandle {
  addMissingDesign (params: IUploadMissingDesign): AxiosPromise {
    const { type, design_id } = params
    return axios.request<void>({
      url: '/add-missing-design',
      method: 'POST',
      data: {
        token: authToken().token || '',
        type,
        design_id
      }
    })
  }
}

export default new ErrorHandle()
