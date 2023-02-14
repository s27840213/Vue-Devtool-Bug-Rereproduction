import { IUserInfo } from '@/interfaces/webView'
import store from '@/store'
import localeUtils from './localeUtils'
import logUtils from './logUtils'

const STANDALONE_USER_INFO: IUserInfo = {
  hostId: '',
  appVer: '100.0',
  locale: 'us',
  isFirstOpen: false,
  osVer: '100.0'
}

const ROUTER_CALLBACKS = [
  'launchResult',
  'getStateResult',
  'setStateDone'
]

const VVSTK_CALLBACKS = [
  'updateInfoDone',
  'loginResult'
]

const CALLBACK_MAPS = {
  router: ROUTER_CALLBACKS,
  vvstk: VVSTK_CALLBACKS
}

class WebViewUtils {
  appLoadedSent = false
  callbackMap = {} as { [key: string]: (data?: any) => void }
  errorMessageMap = {} as { [key: string]: string }

  get isBrowserMode(): boolean {
    return store.getters['vivisticker/getIsBrowserMode']
  }

  registerCallbacks(type: 'router' | 'vvstk') {
    for (const callbackName of CALLBACK_MAPS[type]) {
      (window as any)[callbackName] = (webViewUtils as any)[callbackName]
    }
  }

  getDefaultUserInfo(): IUserInfo {
    return STANDALONE_USER_INFO
  }

  getEmptyMessage(): { [key: string]: string } {
    return { empty: '' }
  }

  setDefaultLocale() {
    let locale = localStorage.getItem('locale')
    if (locale === '' || !locale) {
      locale = localeUtils.getBrowserLang()
    }
    STANDALONE_USER_INFO.locale = locale
  }

  sendToIOS(messageType: string, message: any) {
    logUtils.setLogAndConsoleLog(messageType, message)
    try {
      const webkit = (window as any).webkit
      if (!webkit) return
      const messageHandler = webkit.messageHandlers[messageType]
      if (!messageHandler) {
        throw new Error(`message type: ${messageType} does not exist!`)
      }
      messageHandler.postMessage(message)
    } catch (error) {
      logUtils.setLogAndConsoleLog(error)
    }
  }

  appToast(msg: string) {
    this.sendToIOS('SHOW_TOAST', { msg })
  }

  sendAppLoaded() {
    if (!this.appLoadedSent) {
      this.sendToIOS('APP_LOADED', { hideReviewRequest: false })
      this.appLoadedSent = true
    }
  }

  checkVersion(targetVersion: string) {
    // targetVersion must be in format: <main>.<sub> e.g. 1.18
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSub] = store.getters['webView/getUserInfo'].appVer.split('.')
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  checkOSVersion(targetVersion: string) {
    // targetVersion must be in format: <main>.<sub> e.g. 1.18
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSubRaw] = (store.getters['webView/getUserInfo'].osVer ?? '0.0').split('.')
    const currSub = currSubRaw ?? '0'
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  async callIOSAsAPI(type: string, message: any, event: string, timeout = 5000): Promise<any> {
    this.sendToIOS(type, message)
    const result = await Promise.race([
      new Promise<any>(resolve => {
        this.callbackMap[event] = resolve
      }),
      new Promise<undefined>(resolve => {
        setTimeout(() => {
          resolve(undefined)
        }, timeout)
      })
    ])
    delete this.callbackMap[event]
    return result
  }

  handleCallback(event: string, data?: any) {
    if (this.callbackMap[event]) {
      this.callbackMap[event](data)
    }
  }

  async getUserInfo(): Promise<IUserInfo> {
    if (this.isBrowserMode) return store.getters['webView/getUserInfo']
    await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage(), 'launch')
    return store.getters['webView/getUserInfo']
  }

  launchResult(info: IUserInfo) {
    logUtils.setLogAndConsoleLog(JSON.stringify(info))
    store.commit('webView/SET_userInfo', info)
    webViewUtils.handleCallback('launch')
  }

  async login(type: 'APPLE' | 'Google' | 'Facebook', locale: string): Promise<boolean> {
    if (this.isBrowserMode) return true
    return await this.callIOSAsAPI('LOGIN', { type, locale }, 'login')
  }

  loginResult(data: { flag: string, msg?: string }) {
    if (data.flag !== '0') {
      logUtils.setLogAndConsoleLog(data.msg)
      this.errorMessageMap.login = data.msg ?? ''
    }
    webViewUtils.handleCallback('login', data.flag === '0')
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
    webViewUtils.handleCallback('update-user-info')
  }

  async setState(key: string, value: any) {
    if (this.isBrowserMode) return
    await this.callIOSAsAPI('SET_STATE', { key, value }, 'setState')
  }

  setStateDone() {
    webViewUtils.handleCallback('setState')
  }

  async getState(key: string): Promise<any> {
    if (this.isBrowserMode) return
    return await webViewUtils.callIOSAsAPI('GET_STATE', { key }, 'getState')
  }

  getStateResult(data: { key: string, value: string }) {
    webViewUtils.handleCallback('getState', data.value ? JSON.parse(data.value) : undefined)
  }
}

const webViewUtils = new WebViewUtils()

export default webViewUtils
