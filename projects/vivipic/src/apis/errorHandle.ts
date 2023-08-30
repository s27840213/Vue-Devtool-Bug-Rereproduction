/* eslint-disable camelcase */
import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import { IUploadMissingDesign } from '@/interfaces/api'
class ErrorHandle {
  addMissingDesign (params: IUploadMissingDesign): AxiosPromise {
    const { token = '', type, design_id } = params
    return axios.request<void>({
      url: '/add-missing-design',
      method: 'POST',
      data: {
        token: token || authToken().token,
        type,
        design_id
      } as IUploadMissingDesign
    })
  }
}

export default new ErrorHandle()
