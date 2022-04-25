import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import i18n from '@/i18n'

class Payment {
  tappayAdd (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'tappay',
        action: 'add',
        ...params // country, plan_id, is_bundle, prime
      }
    })
  }

  stripeInit (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'stripe',
        action: 'init',
        ...params // country?
      }
    })
  }

  stripeAdd (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'stripe',
        action: 'add',
        ...params // plan_id, is_bundle,
      }
    })
  }
}

export default new Payment()
