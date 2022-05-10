import i18n from '@/i18n'
import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'

class Payment {
  planList (country: string): AxiosPromise {
    return axios.request<any>({
      url: '/billing-info',
      method: 'POST',
      data: {
        locale: i18n.locale,
        type: 'list',
        country: country
      }
    })
  }

  billingInfo (): AxiosPromise {
    return axios.request<any>({
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'status'
      }
    })
  }

  billingHistory (): AxiosPromise {
    return axios.request<any>({
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'history'
      }
    })
  }

  updateBillingInfo (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'update',
        ...params // meta (billing info)
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
        action: 'add_card',
        type: 'tappay',
        ...params // country, plan_id, is_bundle, prime
      }
    })
  }

  tappayUpdate (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'update_card',
        type: 'tappay',
        ...params // prime
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
        action: 'init',
        type: 'stripe'
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
        action: 'add_card',
        type: 'stripe',
        ...params // country, plan_id, is_bundle,
      }
    })
  }

  stripeUpdate (): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'update_card',
        type: 'stripe'
      }
    })
  }

  getSwitchPrice (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'switch',
        dry_run: 1,
        ...params // plan_id, is_bundle
      }
    })
  }

  switch (params: any): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'switch',
        dry_run: 0,
        ...params // plan_id, is_bundle
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

  resume (): AxiosPromise {
    return axios.request<any>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'resume'
      }
    })
  }

  deleteCard(): AxiosPromise {
    return axios.request<any>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'delete_card'
      }
    })
  }

  // Only for testing
  deletePlanCompletely(): AxiosPromise {
    return axios.request<any>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        admin_token: 'vKLyK56ICyAn1dLQ'
      }
    })
  }
}

export default new Payment()
