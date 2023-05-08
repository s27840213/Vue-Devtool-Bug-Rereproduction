import { WEBVIEW_API_RESULT } from '@/interfaces/webView'
import generalUtils from './generalUtils'
import logUtils from './logUtils'

export abstract class WebViewUtils<T extends { [key: string]: any }> {
  abstract STANDALONE_USER_INFO: T
  abstract CALLBACK_MAPS: { [key: string]: string[] }

  callbackMap = {} as { [key: string]: (res: { data: WEBVIEW_API_RESULT, isTimeouted: boolean }) => void }
  errorMessageMap = {} as { [key: string]: string }

  abstract getUserInfoFromStore(): T

  abstract appendModuleName(identifier: string): string

  filterLog(messageType: string, message: any): boolean {
    // implementation classes can filter out logs for certain messageType with certain messages
    return false
  }

  filterCallbackLog(callbackName: string) {
    // implementation classes can filter out logs for certain callback
    return false
  }

  registerCallbacks(type: string) {
    for (const callbackName of this.CALLBACK_MAPS[type]) {
      (window as any)[callbackName] = (...args: any[]) => {
        if (!this.filterCallbackLog(callbackName)) {
          logUtils.setLogAndConsoleLog(callbackName, ...args)
        }
        const self = this as any
        self[callbackName].bind(this)(...args)
      }
    }
  }

  getDefaultUserInfo(): T {
    return this.STANDALONE_USER_INFO
  }

  getEmptyMessage(): { [key: string]: string } {
    return { empty: '' }
  }

  sendToIOS(messageType: string, message: any, throwsError = false) {
    if (!this.filterLog(messageType, message)) {
      logUtils.setLogAndConsoleLog(messageType, message)
    }
    try {
      const webkit = window.webkit
      if (!webkit) return
      const messageHandler = webkit.messageHandlers[messageType]
      if (!messageHandler) {
        throw new Error(`message type: ${messageType} does not exist!`)
      }
      messageHandler.postMessage(generalUtils.unproxify(message))
    } catch (error) {
      if (throwsError) {
        throw error
      } else {
        logUtils.setLogAndConsoleLog(error)
      }
    }
  }

  checkVersion(targetVersion: string) {
    // targetVersion must be in format: <main>.<sub> e.g. 1.18
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSub] = this.getUserInfoFromStore().appVer.split('.')
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  checkOSVersion(targetVersion: string) {
    // targetVersion must be in format: <main>.<sub> e.g. 1.18
    const [targetMain, targetSub] = targetVersion.split('.')
    const [currMain, currSubRaw] = (this.getUserInfoFromStore().osVer ?? '0.0').split('.')
    const currSub = currSubRaw ?? '0'
    return parseInt(currMain) > parseInt(targetMain) || (parseInt(currMain) === parseInt(targetMain) && parseInt(currSub) >= parseInt(targetSub))
  }

  registerResolve(event: string, resolve: (value: any) => void) {
    if (this.callbackMap[event] !== undefined) {
      throw new Error(`duplicate event callback: ${event} already exists!`)
    } else {
      this.callbackMap[event] = resolve
    }
  }

  async callIOSAsAPI(type: string, message: any, event: string, {
    timeout = 5000, retry = false, retryTimes = 0
  } = {}): Promise<WEBVIEW_API_RESULT> {
    let result: WEBVIEW_API_RESULT
    try {
      if (timeout === -1) {
        result = (await (new Promise<{ data: WEBVIEW_API_RESULT, isTimeouted: boolean }>(resolve => {
          this.registerResolve(event, resolve)
          this.sendToIOS(type, message, true) // send message to iOS only when resolve is successfully registered
        }))).data
        delete this.callbackMap[event]
      } else {
        const raceResult = await Promise.race([
          new Promise<{ data: WEBVIEW_API_RESULT, isTimeouted: boolean }>(resolve => {
            this.registerResolve(event, resolve)
            this.sendToIOS(type, message, true) // send message to iOS only when resolve is successfully registered
          }),
          new Promise<{ data: WEBVIEW_API_RESULT, isTimeouted: boolean }>(resolve => {
            setTimeout(() => {
              resolve({
                data: null,
                isTimeouted: true
              })
            }, timeout)
          })
        ])
        delete this.callbackMap[event]
        result = raceResult.data
        if (raceResult.isTimeouted) {
          logUtils.setLogAndConsoleLog(`${type} timeouted after ${timeout}ms with message:`, message)
          if (retry && retryTimes < 2) {
            logUtils.setLogAndConsoleLog(`retry: ${retryTimes + 1}`)
            result = await this.callIOSAsAPI(type, message, event, {
              timeout, retry, retryTimes: retryTimes + 1
            })
          }
        }
      }
    } catch (error) {
      const theError = error as Error
      console.error(error)
      logUtils.setLog(`Error occurs in callIOSAsAPI: ${theError.name}, ${theError.message}, ${theError.cause}, ${theError.stack}`)
      result = null
    }
    return result
  }

  handleCallback(event: string, data?: any) {
    if (this.callbackMap[event]) {
      this.callbackMap[event]({
        data,
        isTimeouted: false
      })
    }
  }
}
