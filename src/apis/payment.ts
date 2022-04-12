import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import i18n from '@/i18n'

class Payment {
  pay (params: any): AxiosPromise { // todo retype
    params.token = authToken().token || ''
    params.locale = i18n.locale

    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: params
    })
  }
}

export default new Payment()
