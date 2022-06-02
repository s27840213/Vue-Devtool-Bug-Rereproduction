import i18n from '@/i18n'
import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import store from '@/store'

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

  billingHistory (index: number): AxiosPromise {
    return axios.request<any>({
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        type: 'history',
        page_index: index
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

  // Both stripe & tappay
  init (): AxiosPromise { // todo retype
    return axios.request<any>({ // todo retype
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        action: 'init'
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

  calcUserAsset(procId: string): AxiosPromise {
    return axios.request<any>({
      url: '/calc-user-asset',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.locale,
        team_id: store.getters['user/getTeamId'],
        proc_id: procId
      }
    })
  }

  calcDone(procId: string, callback: (e: MessageEvent)=>void): void {
    const ws = new WebSocket(`${'wss://proc.vivipic.com'}?token=${authToken().token || ''}&proc_id=${procId}`)
    ws.onmessage = callback
    ws.onerror = (event) => { console.log('socket error', event) }
  }
}

export default new Payment()
