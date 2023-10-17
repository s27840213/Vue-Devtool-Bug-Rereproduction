/* eslint-disable camelcase */
import axios from '@nu/vivi-lib/apis'
import i18n from '@nu/vivi-lib/i18n'
import { IFbTrackingData } from '@nu/vivi-lib/interfaces/api'
import store from '@/store'

export default {
  getToken(): string {
    return store.getters['user/getToken']
  },
  getLocale(): string {
    return i18n.global.locale
  },
  getTeamId(): string {
    return store.getters['user/getTeamId']
  },

  fbTracking(data: IFbTrackingData): any {
    console.log(data)
    return axios.request<any>({
      url: '/fb-send-event',
      method: 'POST',
      data,
      withCredentials: true
    })
  }
}
