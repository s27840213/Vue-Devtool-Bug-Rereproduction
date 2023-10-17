import axios from '@nu/vivi-lib/apis'
import i18n from '@nu/vivi-lib/i18n'
import * as type from '@nu/vivi-lib/interfaces/payment'
import store from '@/store'
import { AxiosPromise } from 'axios'
import authToken from '@nu/vivi-lib/apis/auth-token'

class Payment {
  planList(country: string) {
    return axios.request<type.IApiBillingInfoList>({
      url: '/billing-info',
      method: 'POST',
      data: {
        locale: i18n.global.locale,
        type: 'list',
        country: country
      }
    })
  }

  billingInfo() {
    return axios.request<type.IApiBillingInfoStatus>({
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        type: 'status'
      }
    })
  }

  billingHistory(index: number) {
    return axios.request<type.IApiBillingInfoHistory>({
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        type: 'history',
        page_index: index
      }
    })
  }

  updateBillingInfo(params: type.IParamMeta) {
    return axios.request<type.IApiBasic>({
      url: '/billing-info',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        type: 'update',
        ...params // meta (billing info)
      }
    })
  }

  // For both stripe & tappay
  init() {
    return axios.request<type.IApiPaymentInit>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'init'
      }
    })
  }

  tappayAdd(params: type.IParamTappayAdd) {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'add_card',
        type: 'tappay',
        campaign: localStorage.getItem('campaign') || undefined,
        device: store.getters['user/getDevice'],
        app: store.getters['webView/getInBrowserMode'] ? 0 : 1,
        ...params
      }
    })
  }

  stripeAdd(params: type.IParamStripeAdd) {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'add_card',
        type: 'stripe',
        campaign: localStorage.getItem('campaign') || undefined,
        device: store.getters['user/getDevice'],
        app: store.getters['webView/getInBrowserMode'] ? 0 : 1,
        ...params
      }
    })
  }

  tappayUpdate(params: type.IParamPrime) {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'update_card',
        type: 'tappay',
        ...params
      }
    })
  }

  stripeUpdate() {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'update_card',
        type: 'stripe'
      }
    })
  }

  getSwitchPrice(params: type.IParamSwitch) {
    return axios.request<type.IApiPaymentSwitch>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'switch',
        dry_run: 1,
        ...params // plan_id, is_bundle
      }
    })
  }

  switch(params: type.IParamSwitch) {
    return axios.request<type.IApiPaymentSwitch>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'switch',
        dry_run: 0,
        ...params // plan_id, is_bundle
      }
    })
  }

  cancel(reason: string) {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'cancel',
        reason: reason
      }
    })
  }

  resume() {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'resume'
      }
    })
  }

  deleteCard() {
    return axios.request<type.IApiBasic>({
      url: '/payment',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        action: 'delete_card'
      }
    })
  }

  calcUserAsset(procId: string): AxiosPromise {
    return axios.request<type.IApiBasic>({
      url: '/calc-user-asset',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        team_id: store.getters['user/getTeamId'],
        proc_id: procId
      }
    })
  }

  calcDone(procId: string, callback: (e: MessageEvent) => void): void {
    const ws = new WebSocket(`${'wss://proc.vivipic.com'}?token=${authToken().token || ''}&proc_id=${procId}`)
    ws.onmessage = callback
    ws.onerror = (event) => { console.log('socket error', event) }
  }

  verifyCoupon(coupon: string) {
    return axios.request<type.IApiCouponCheck>({
      url: '/verify-coupon',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        add: 0,
        coupon
      }
    })
  }

  applyCoupon(coupon: string, plan_id: string, is_bundle: number) {
    return axios.request<type.IApiCoupon>({
      url: '/verify-coupon',
      method: 'POST',
      data: {
        token: authToken().token || '',
        locale: i18n.global.locale,
        add: 0,
        coupon,
        plan_id,
        is_bundle
      }
    })
  }
}

export default new Payment()
