import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import i18n from '@/i18n'

class Payment {
  planList (): AxiosPromise {
    return axios.request<any>({
      url: '/billing-info',
      method: 'POST',
      data: {
        locale: i18n.locale,
        type: 'list'
      }
    })
  }

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

  stripeInit (): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'stripe',
        action: 'init'
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
        action: 'add_card',
        ...params // country, plan_id, is_bundle,
      }
    })
  }

  cancel (reason: string): AxiosPromise {
    return axios.request<any>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'cancel',
        reason: reason
      }
    })
  }
}

export default new Payment()
