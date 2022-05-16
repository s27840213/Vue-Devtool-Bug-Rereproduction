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
}

export default new GtmUtils()
