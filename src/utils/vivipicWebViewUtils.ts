import { ILoginResult, IUserInfo } from '@/interfaces/webView'
import store from '@/store'
import { WebViewUtils } from '@/utils/webViewUtils'
import logUtils from './logUtils'

class VivipicWebViewUtils extends WebViewUtils<IUserInfo> {
  appLoadedSent = false
  STANDALONE_USER_INFO: IUserInfo = {
    hostId: '',
    appVer: '100.0',
    locale: 'us',
    isFirstOpen: false,
    osVer: '100.0'
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

  get isBrowserMode(): boolean {
    return store.getters['webView/getIsBrowserMode']
  }

  detectIfInApp() {
    if ((window as any).webkit === undefined) {
      this.enterBrowserMode()
    }
  }

  enterBrowserMode() {
    store.commit('webView/SET_isBrowserMode', true)
  }

  getUserInfoFromStore(): IUserInfo {
    return store.getters['webView/getUserInfo']
  }

  openOrGoto(url: string) {
    if (this.isBrowserMode) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  }

  sendAppLoaded() {
    if (!this.appLoadedSent) {
      this.sendToIOS('APP_LOADED', { hideReviewRequest: false })
      this.appLoadedSent = true
    }
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.isBrowserMode) return this.getUserInfoFromStore()
    await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage(), 'launch')
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
    if (this.isBrowserMode) {
      localStorage.setItem('locale', locale)
      return
    }
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
    if (this.isBrowserMode) return
    await this.callIOSAsAPI('SET_STATE', { key, value }, 'setState')
  }

  setStateDone() {
    this.handleCallback('setState')
  }

  async getState(key: string): Promise<any> {
    if (this.isBrowserMode) return
    return await this.callIOSAsAPI('GET_STATE', { key }, 'getState')
  }

  getStateResult(data: { key: string, value: string }) {
    this.handleCallback('getState', data.value ? JSON.parse(data.value) : undefined)
  }
}

const webViewUtils = new VivipicWebViewUtils()

export default webViewUtils
