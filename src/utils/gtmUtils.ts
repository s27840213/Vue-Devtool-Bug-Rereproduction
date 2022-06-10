import store from '@/store'
import Vue from 'vue'

class GtmUtils {
  get userId(): string { return store.getters['user/getUserId'] }
  get teamId(): string { return store.getters['user/getTeamId'] || this.userId }
  get groupId(): string { return store.getters.getGroupId }
  get isAdmin(): boolean { return store.getters['user/isAdmin'] }
  get isLogin(): boolean { return store.getters['user/isLogin'] }

  track(eventName: string, params?: { [index: string]: string | boolean | number }) {
    Vue.gtm.trackEvent({
      event: eventName,
      ...params
    })
  }

  trackTemplateDownload(templateId: string) {
    if (this.isLogin && !this.isAdmin) {
      this.track('template-download', {
        templateId
      })
    }
  }

  trackPageDownload(templateId: string) {
    if (this.isLogin && !this.isAdmin && templateId !== '') {
      this.track('template-download-2', {
        templateId
      })
    }
  }

  // below code is used for Google Ads
  subscribe(isYearly: boolean) {
    // month : 8.99 usd (269 TWD), year: 79.99 usd (2388 TWD)
    const conversionPrice = isYearly ? 79.99 : 8.99
    const subScribePeriod = isYearly ? 365 : 30
    if (this.isLogin) {
      this.track('subscribe', {
        conversionPrice,
        subScribePeriod
      })
    }
  }

  startTrail(subScribePeriod: number) {
    if (this.isLogin) {
      this.track('startTrail', {
        subScribePeriod
      })
    }
  }
}

export default new GtmUtils()
