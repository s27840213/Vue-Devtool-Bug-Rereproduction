import { nativeAPIUtils } from '@nu/shared-lib'

export interface IUserInfo {
  hostId: string
  appVer: string
  osVer: string
  isFirstOpen: boolean
  statusBarHeight: number
  homeIndicatorHeight: number
  country: string
  modelName: string
}

class WebViewUtils extends nativeAPIUtils<IUserInfo> {
  STANDALONE_USER_INFO: IUserInfo = {
    hostId: '',
    appVer: '100.0',
    osVer: '100.0',
    isFirstOpen: false,
    statusBarHeight: 0,
    homeIndicatorHeight: 0,
    country: '',
    modelName: 'web',
  }

  CALLBACK_MAPS = {}

  getUserInfoFromStore(): IUserInfo {
    return this.STANDALONE_USER_INFO
  }

  async getUserInfo(): Promise<IUserInfo> {
    // if (this.inBrowserMode) return this.getUserInfoFromStore()
    const userInfo = await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage())
    if (!userInfo) return this.getDefaultUserInfo()
    // store.commit('webView/SET_userInfo', userInfo)
    // const appCaps = await fetch(`https://template.vivipic.com/static/appCaps.json?ver=${generalUtils.generateRandomString(6)}`)
    // const jsonCaps = await appCaps.json() as { review_ver: string }
    // store.commit('webView/UPDATE_detectIfInReviewMode', jsonCaps.review_ver)
    // this.sendStatistics(true, userInfo.country)
    return userInfo as IUserInfo
  }
}

export default new WebViewUtils()
