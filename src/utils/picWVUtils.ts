import { ILoginResult } from '@/interfaces/api'
import { IUserInfo, WEBVIEW_API_RESULT } from '@/interfaces/webView'
import store from '@/store'
import { WebViewUtils } from '@/utils/webViewUtils'
import generalUtils from './generalUtils'
import logUtils from './logUtils'

const WHITE_STATUS_BAR_ROUTES = [
  'Editor'
]

class VivipicWebViewUtils extends WebViewUtils<IUserInfo> {
  appLoadedSent = false
  toSendStatistics = false
  STANDALONE_USER_INFO: IUserInfo = {
    hostId: '',
    appVer: '100.0',
    locale: 'us',
    isFirstOpen: false,
    osVer: '100.0',
    statusBarHeight: 0,
    homeIndicatorHeight: 0
  }

  ROUTER_CALLBACKS = [
    'launchResult',
    'getStateResult',
    'setStateDone'
  ]

  MAIN_CALLBACKS = [
    'updateInfoDone',
    'loginResult'
  ]

  CALLBACK_MAPS = {
    router: this.ROUTER_CALLBACKS,
    main: this.MAIN_CALLBACKS
  }

  get inBrowserMode(): boolean {
    return store.getters['webView/getInBrowserMode']
  }

  get inReviewMode(): boolean {
    return store.getters['webView/getInReviewMode']
  }

  detectIfInApp() {
    this.enterBrowserMode() // vivisticker is always in browser mode
  }

  enterBrowserMode() {
    store.commit('webView/SET_inBrowserMode', true)
  }

  getUserInfoFromStore(): IUserInfo {
    return store.getters['webView/getUserInfo']
  }

  appendModuleName(identifier: string): string {
    return `webView/${identifier}`
  }

  openOrGoto(url: string) {
    window.open(url, this.inBrowserMode ? '_blank' : '_self')
  }

  sendToIOS(messageType: string, message: any): void {
    if (this.inBrowserMode) return
    super.sendToIOS(messageType, message)
  }

  async callIOSAsAPI(type: string, message: any, event: string, options: {
    timeout?: number, retry?: boolean, retryTimes?: number, timeoutValue?: WEBVIEW_API_RESULT
  } = {}): Promise<WEBVIEW_API_RESULT> {
    if (this.inBrowserMode) return
    return super.callIOSAsAPI(type, message, event, options)
  }

  sendAppLoaded() {
    if (this.inBrowserMode) return
    if (!this.appLoadedSent) {
      this.sendToIOS('APP_LOADED', { hideReviewRequest: false })
      this.appLoadedSent = true
    }
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.inBrowserMode) return this.getUserInfoFromStore()
    await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage(), 'launch')
    const userInfo = this.getUserInfoFromStore()
    const appCaps = await fetch(`https://template.vivipic.com/static/appCaps.json?ver=${generalUtils.generateRandomString(6)}`)
    const jsonCaps = await appCaps.json() as { review_ver: string }
    store.commit('webView/UPDATE_detectIfInReviewMode', jsonCaps.review_ver)
    this.sendStatistics(true, userInfo.country)
    return userInfo
  }

  launchResult(info: IUserInfo) {
    store.commit('webView/SET_userInfo', info)
    this.handleCallback('launch')
  }

  async login(type: 'APPLE' | 'Google' | 'Facebook', locale: string): Promise<{ data: ILoginResult, flag: number, msg?: string }> {
    const loginResult = await this.callIOSAsAPI('LOGIN', { type, locale }, 'login', { timeout: -1 })
    if (loginResult) {
      return loginResult as { data: ILoginResult, flag: number, msg?: string }
    } else {
      throw new Error('login failed')
    }
  }

  loginResult(data: { data: ILoginResult, flag: string | number, msg?: string }) {
    data.flag = typeof data.flag === 'string' ? parseInt(data.flag) : data.flag
    this.handleCallback('login', data)
  }

  async updateLocale(locale: string): Promise<void> {
    if (this.inBrowserMode) return
    await this.callIOSAsAPI('UPDATE_USER_INFO', { locale }, 'update-user-info')
  }

  updateInfoDone(data: { flag: string, msg?: string }) {
    if (data.flag !== '0') {
      logUtils.setLogAndConsoleLog(data.msg)
      this.errorMessageMap.locale = data.msg ?? ''
    }
    this.handleCallback('update-user-info')
  }

  async setState(key: string, value: any) {
    if (this.inBrowserMode) return
    await this.callIOSAsAPI('SET_STATE', { key, value }, 'setState')
  }

  setStateDone() {
    this.handleCallback('setState')
  }

  async getState(key: string): Promise<any> {
    if (this.inBrowserMode) return
    return await this.callIOSAsAPI('GET_STATE', { key }, 'getState', { retry: true })
  }

  getStateResult(data: { key: string, value: string }) {
    this.handleCallback('getState', data.value ? JSON.parse(data.value) : undefined)
  }

  async changeStatusBarTextColor(routeName: string): Promise<any> {
    if (this.inBrowserMode) return
    const statusBarColor = WHITE_STATUS_BAR_ROUTES.includes(routeName) ? 'white' : 'black'
    await this.callIOSAsAPI('UPDATE_USER_INFO', { statusBarColor }, 'update-user-info')
  }

  switchDomain(domain: string): void {
    if (this.inBrowserMode) return
    this.sendToIOS('SWITCH_DOMAIN', { domain })
  }

  async sendStatistics(countryReady = false, country?: string): Promise<void> {
    if (this.inBrowserMode || countryReady) {
      const data = {
        token: store.getters['user/getToken'] as string,
        device: store.getters['user/getDevice'] as number,
      }
      await store.dispatch('user/updateUser', {
        ...data,
        app: this.inBrowserMode ? 0 : 1,
        country
        // If inBrowserMode, country = undefined,
        // otherwise country will be provided in arguments when called from getUserInfo
        // (if app doesn't provide it (in older versions), it will be undefined)
      }) // If country is not provided, back-end will use the information provided by CloudFlare.
      this.toSendStatistics = false
    } else {
      this.toSendStatistics = true
    }
  }

  sendAdEvent(eventName: string, param: { [key: string]: any } = {}) {
    if (this.inBrowserMode) return
    this.sendToIOS('SEND_AD_EVENT', { eventName, param })
  }

  ratingRequest(type: string) {
    if (this.inBrowserMode) return
    this.sendToIOS('RATING_REQUEST', { type })
  }
}

export default new VivipicWebViewUtils()
