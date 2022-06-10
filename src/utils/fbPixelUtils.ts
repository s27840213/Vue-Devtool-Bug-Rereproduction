import store from '@/store'
import Vue from 'vue'

class FbPixelUtils {
  get userId(): string { return store.getters['user/getUserId'] }
  get teamId(): string { return store.getters['user/getTeamId'] || this.userId }
  get groupId(): string { return store.getters.getGroupId }
  get isAdmin(): boolean { return store.getters['user/isAdmin'] }
  get isLogin(): boolean { return store.getters['user/isLogin'] }

  fbq(type: string, action: string, params?: { [index: string]: any }) {
    params ? (window as any).fbq(type, action, params) : (window as any).fbq(type, action)
  }

  startTrail(trailTime: number) {
    // trail time: 14 days
    this.fbq('track', 'StartTrial', {
      value: '0.00', currency: 'USD', predicted_ltv: `${trailTime}`
    })
  }

  subscribe(isYearlyPlany: boolean) {
    // month : 8.99 usd (269 TWD), year: 79.99 usd (2388 TWD)
    const price = isYearlyPlany ? 79.99 : 8.99
    const subscribeTime = isYearlyPlany ? 365 : 30
    this.fbq('track', 'Subscribe', { value: `${price}`, currency: 'USD', predicted_ltv: `${subscribeTime}` })
  }
}

export default new FbPixelUtils()
