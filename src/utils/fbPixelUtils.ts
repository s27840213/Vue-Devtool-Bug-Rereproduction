/**
 * @Document -https://www.notion.so/vivipic/Vivipic-78df91b4ed454ae1867e01e9a6b21a87
 */

import tracking from '@/apis/tracking'
import { IFbTrackingData } from '@/interfaces/api'
import store from '@/store'
import generalUtils from './generalUtils'
import picWVUtils from './picWVUtils'

class FbPixelUtils {
  get userId(): string { return store.getters['user/getUserId'] }
  get teamId(): string { return store.getters['user/getTeamId'] || this.userId }
  get email(): string { return store.getters['user/getEmail'] }
  get groupId(): string { return store.getters.getGroupId }
  get isAdmin(): boolean { return store.getters['user/isAdmin'] }
  get isLogin(): boolean { return store.getters['user/isLogin'] }

  fbq(type: string, action: string, params: { [index: string]: string | number | boolean } = {}, eventParams: { eventID?: string } = {}) {
    (window as any).fbq(type, action, params, eventParams)
    const { eventID } = eventParams

    if (eventID) {
      console.log('send fb tacking api')
      const data = {
        event_name: action,
        event_id: eventID,
        url: window.location.href,
        email: this.email,
        custom_data: JSON.stringify(params),
        ...(params.subscription_id && { subscription_id: params.subscription_id as string })
      }
      console.log(data)
      this.fbTracking(data)
    }
  }

  async fbTracking(data: IFbTrackingData) {
    const response = await tracking.fbTracking(data)
    console.log(response)
    return response
  }

  signUp() {
    const eventId = generalUtils.generateRandomString(8)
    this.fbq('track', 'CompleteRegistration', {}, {
      eventID: eventId
    })
  }

  startTrial() {
    const eventId = generalUtils.generateRandomString(8)

    // trail time: 14 days
    this.fbq('track', 'StartTrial', {
      value: 0.00, currency: 'USD', predicted_ltv: 0.00
    }, {
      eventID: eventId
    })
  }

  subscribe(isYearlyPlany: boolean) {
    const eventId = generalUtils.generateRandomString(8)
    // month : 8.99 usd (269 TWD), year: 79.99 usd (2388 TWD)
    const price = isYearlyPlany ? 79.99 : 8.99
    if (picWVUtils.inBrowserMode) {
      this.fbq('track', 'Subscribe', { subscription_id: this.userId, value: 0, currency: 'USD', predicted_ltv: 0 }, {
        eventID: eventId
      })
    } else {
      picWVUtils.sendAdEvent('subscribe', { subscription_id: this.userId, value: price, currency: 'USD', predicted_ltv: 0 })
    }
  }
}

export default new FbPixelUtils()
