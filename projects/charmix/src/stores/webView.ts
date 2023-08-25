import type { IUserInfo } from '@/types/webview'
import { defineStore } from 'pinia'

export interface IWebViewState {
  userInfo: IUserInfo
  inReviewMode: boolean
  inDevMode: boolean
}

export const useWebViewStore = defineStore('webView', {
  state: () => ({
    // Why don't use the follwing line? It will cause error :<..
    // userInfo: picWVUtils.getDefaultUserInfo(),
    userInfo: {
      hostId: '',
      appVer: '',
      osVer: '',
      locale: '',
      isFirstOpen: false,
      statusBarHeight: 0,
      homeIndicatorHeight: 0
    },
    inBrowserMode: false,
    inReviewMode: false,
    inDevMode: false
  }),
  getters: {
    getUserInfo(): IUserInfo {
      return this.userInfo
    },
    getInDevMode(): boolean {
      return this.inDevMode
    },
    getInBrowserMode(): boolean {
      return this.inBrowserMode
    },
    getInReviewMode(): boolean {
      return this.inReviewMode
    }
  },
  actions: {
    setUserInfo(userInfo: IUserInfo) {
      this.userInfo = userInfo
    },
    updateDetectIfInReviewMode(reviewVer: string) {
      this.inReviewMode = reviewVer === this.userInfo.appVer
    },
    setInBrowserMode(inBrowserMode: boolean) {
      this.inBrowserMode = inBrowserMode
    },
    setInReviewMode(inReviewMode: boolean) {
      this.inReviewMode = inReviewMode
    }
  }
})
