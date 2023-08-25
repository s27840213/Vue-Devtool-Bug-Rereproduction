import { useWebViewStore } from '@/stores/webView'
import type { IUserInfo } from '@/types/webview'
import { logUtils, webViewUtils } from '@nu/shared-lib'
import { createPinia, storeToRefs } from 'pinia'
const pinia = createPinia()
const WHITE_STATUS_BAR_ROUTES = ['Editor']

const webviewStore = useWebViewStore(pinia)
const { setUserInfo, setInBrowserMode } = webviewStore
const { getInReviewMode, getUserInfo, getInBrowserMode } = storeToRefs(webviewStore)

class CharmixWVUtils extends webViewUtils<IUserInfo> {
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

  ROUTER_CALLBACKS = ['launchResult', 'getStateResult', 'setStateDone']

  MAIN_CALLBACKS = ['updateInfoDone', 'loginResult', 'uploadImageURL']

  CALLBACK_MAPS = {
    router: this.ROUTER_CALLBACKS,
    main: this.MAIN_CALLBACKS
  }

  get inBrowserMode(): boolean {
    return getInBrowserMode.value
  }

  get inReviewMode(): boolean {
    return getInReviewMode.value
  }

  detectIfInApp() {
    if (window.webkit?.messageHandlers?.APP_LOADED === undefined) {
      this.enterBrowserMode()
    }
  }

  enterBrowserMode() {
    // store.commit('webView/SET_inBrowserMode', true)
    setInBrowserMode(true)
  }

  getUserInfoFromStore(): IUserInfo {
    return getUserInfo.value
  }

  appendModuleName(identifier: string): string {
    return `webView/${identifier}`
  }

  openOrGoto(url: string) {
    window.open(url, this.inBrowserMode ? '_blank' : '_self')
  }

  sendToIOS: InstanceType<typeof webViewUtils>['sendToIOS'] = (...args) => {
    if (this.inBrowserMode) return
    super.sendToIOS(...args)
  }

  callIOSAsAPI: InstanceType<typeof webViewUtils>['callIOSAsAPI'] = async (...args) => {
    if (this.inBrowserMode) return
    return super.callIOSAsAPI(...args)
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
    // const appCaps = await fetch(`https://template.vivipic.com/static/appCaps.json?ver=${generalUtils.generateRandomString(6)}`)
    // const jsonCaps = await appCaps.json() as { review_ver: string }
    // store.commit('webView/UPDATE_detectIfInReviewMode', jsonCaps.review_ver)
    // this.sendStatistics(true, userInfo.country)
    return userInfo
  }

  launchResult(info: IUserInfo) {
    setUserInfo(info)
    this.handleCallback('launch')
  }

  async updateLocale(locale: string): Promise<void> {
    if (this.inBrowserMode) return
    await this.callIOSAsAPI('UPDATE_USER_INFO', { locale }, 'update-user-info')
  }

  updateInfoDone(data: { flag: string; msg?: string }) {
    if (data.flag !== '0') {
      logUtils.setLogAndConsoleLog(data.msg)
      this.errorMessageMap.locale = data.msg ?? ''
    }
    this.handleCallback('update-user-info')
  }

  uploadImageURL(data: any) {
    this.handleCallback('upload-image', data)
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
    if (this.checkVersion('1.0.3')) {
      return await this.callIOSAsAPI('GET_STATE', { key }, 'getState', { retry: true })
    } else {
      return undefined
    }
  }

  getStateResult(data: { key: string; value: string }) {
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

  // async sendStatistics(countryReady = false, country?: string): Promise<void> {
  //   if (this.inBrowserMode || countryReady) {
  //     const data = {
  //       token: store.getters['user/getToken'] as string,
  //       device: store.getters['user/getDevice'] as number,
  //     }
  //     await store.dispatch('user/updateUser', {
  //       ...data,
  //       app: this.inBrowserMode ? 0 : 1,
  //       country
  //       // If inBrowserMode, country = undefined,
  //       // otherwise country will be provided in arguments when called from getUserInfo
  //       // (if app doesn't provide it (in older versions), it will be undefined)
  //     }) // If country is not provided, back-end will use the information provided by CloudFlare.
  //     this.toSendStatistics = false
  //   } else {
  //     this.toSendStatistics = true
  //   }
  // }

  sendAdEvent(eventName: string, param: { [key: string]: any } = {}) {
    if (this.inBrowserMode) return
    this.sendToIOS('SEND_AD_EVENT', { eventName, param })
  }

  ratingRequest(type: string) {
    if (this.inBrowserMode) return
    this.sendToIOS('RATING_REQUEST', { type })
  }

  async getIosImg(limit = 1): Promise<Array<string>> {
    const { images } = ((await this.callIOSAsAPI('UPLOAD_IMAGE', { limit }, 'upload-image', {
      timeout: 60000,
      cancelOnConfict: true
    })) ?? { images: [] }) as { images: Array<string> }
    console.log(images)
    return images
  }
}

export default new CharmixWVUtils()
