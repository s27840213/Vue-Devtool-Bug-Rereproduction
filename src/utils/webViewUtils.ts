import generalUtils from './generalUtils'
import logUtils from './logUtils'

export abstract class WebViewUtils<T extends { [key: string]: any }> {
  abstract STANDALONE_USER_INFO: T
  abstract CALLBACK_MAPS: { [key: string]: string[] }

  callbackMap = {} as { [key: string]: (data?: any) => void }
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

  sendToIOS(messageType: string, message: any) {
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
      logUtils.setLogAndConsoleLog(error)
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

  async callIOSAsAPI(type: string, message: any, event: string, timeout = 5000): Promise<{ [key: string]: any } | undefined> {
    this.sendToIOS(type, message)
    let result: { [key: string]: any } | undefined
    if (timeout === -1) {
      result = await (new Promise<{ [key: string]: any } | undefined>(resolve => {
        this.callbackMap[event] = resolve
      }))
    } else {
      result = await Promise.race([
        new Promise<{ [key: string]: any } | undefined>(resolve => {
          this.callbackMap[event] = resolve
        }),
        new Promise<undefined>(resolve => {
          setTimeout(() => {
            logUtils.setLogAndConsoleLog(`${type} with ${message} timeouted after ${timeout}ms`)
            resolve(undefined)
          }, timeout)
        })
      ])
    }
    delete this.callbackMap[event]
    return result
  }

  handleCallback(event: string, data?: any) {
    if (this.callbackMap[event]) {
      this.callbackMap[event](data)
    }
  }
}
