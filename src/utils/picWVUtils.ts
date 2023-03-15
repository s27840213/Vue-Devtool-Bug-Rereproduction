import { ILoginResult, IUserInfo } from '@/interfaces/webView'
import store from '@/store'
import { WebViewUtils } from '@/utils/webViewUtils'
import generalUtils from './generalUtils'
import logUtils from './logUtils'

const WHITE_STATUS_BAR_ROUTES = [
  'Editor'
]

class VivipicWebViewUtils extends WebViewUtils<IUserInfo> {
  appLoadedSent = false
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
    if ((window as any).webkit === undefined) {
      this.enterBrowserMode()
    }
  }

  enterBrowserMode() {
    store.commit('webView/SET_inBrowserMode', true)
  }

  getUserInfoFromStore(): IUserInfo {
    return store.getters['webView/getUserInfo']
  }

  openOrGoto(url: string) {
    window.open(url, this.inBrowserMode ? '_blank' : '_self')
  }

  sendAppLoaded() {
    if (!this.appLoadedSent) {
      this.sendToIOS('APP_LOADED', { hideReviewRequest: false })
      this.appLoadedSent = true
    }
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.inBrowserMode) return this.getUserInfoFromStore()
    await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage(), 'launch')
    const appCaps = await fetch(`https://template.vivipic.com/static/appCaps.json?ver=${generalUtils.generateRandomString(6)}`)
    const jsonCaps = await appCaps.json() as { review_ver: string }
    store.commit('webView/UPDATE_detectIfInReviewMode', jsonCaps.review_ver)
    return this.getUserInfoFromStore()
  }

  launchResult(info: IUserInfo) {
    logUtils.setLogAndConsoleLog(JSON.stringify(info))
    store.commit('webView/SET_userInfo', info)
    this.handleCallback('launch')
  }

  async login(type: 'APPLE' | 'Google' | 'Facebook', locale: string): Promise<{ data: ILoginResult, flag: number, msg?: string }> {
    return await this.callIOSAsAPI('LOGIN', { type, locale }, 'login', -1)
  }

  loginResult(data: { data: ILoginResult, flag: string | number, msg?: string }) {
    logUtils.setLogAndConsoleLog(data)
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
    return await this.callIOSAsAPI('GET_STATE', { key }, 'getState')
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
}

export default new VivipicWebViewUtils()
