import { generalUtils, logUtils } from '@nu/shared-lib'

export type WEBVIEW_API_RESULT = { [key: string]: any } | null | undefined // 'null' is for timeouted or error occurred, while 'undefined' means no result.

export default abstract class WebViewUtils<T extends { [key: string]: any }> {
  abstract STANDALONE_USER_INFO: T
  abstract CALLBACK_MAPS: { [key: string]: string[] }

  callbackMap = {} as {
    [key: string]: (res: { data: WEBVIEW_API_RESULT; isTimeouted: boolean }) => void
  }

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
      this.registerCallbacksCore(callbackName)
    }
  }

  registerCallbacksCore(callbackName: string) {
    ;(window as any)[callbackName] = (...args: any[]) => {
      if (!this.filterCallbackLog(callbackName)) {
        logUtils.setLogAndConsoleLog(callbackName, ...args)
      }
      const self = this as any
      self[callbackName].bind(this)(...args)
    }
  }

  getDefaultUserInfo(): T {
    return this.STANDALONE_USER_INFO
  }

  getEmptyMessage(): { [key: string]: string } {
    return { empty: '' }
  }

  makeAPIRequest(eventId: string, event: string, message: any) {
    return {
      event,
      message,
      eventId,
    }
  }

  sendRequest(eventId: string, event: string, message: any) {
    const request = this.makeAPIRequest(eventId, event, message)
    this.sendToIOS('REQUEST', request, true)
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
        logUtils.setLogForError(error as Error)
      }
    }
  }

  checkVersion(targetVersion: string) {
    const currVer = this.getUserInfoFromStore().appVer ?? '0.0'
    return generalUtils.versionCheck({ greaterThan: targetVersion, version: currVer })
  }

  checkOSVersion(targetVersion: string) {
    const currVer = this.getUserInfoFromStore().osVer ?? '0.0'
    return generalUtils.versionCheck({ greaterThan: targetVersion, version: currVer })
  }

  async callIOSAsAPI(
    type: string,
    message: any,
    { timeout = 5000, retry = false, retryTimes = 0 } = {},
  ): Promise<WEBVIEW_API_RESULT> {
    const eventId = generalUtils.generateAssetId()
    let result: WEBVIEW_API_RESULT
    try {
      if (timeout === -1) {
        result = (
          await new Promise<{ data: WEBVIEW_API_RESULT; isTimeouted: boolean }>((resolve) => {
            this.callbackMap[eventId] = resolve
            this.sendRequest(eventId, type, message)
          })
        ).data
        delete this.callbackMap[eventId]
      } else {
        const raceResult = await Promise.race([
          new Promise<{ data: WEBVIEW_API_RESULT; isTimeouted: boolean }>((resolve) => {
            this.callbackMap[eventId] = resolve
            this.sendRequest(eventId, type, message)
          }),
          new Promise<{ data: WEBVIEW_API_RESULT; isTimeouted: boolean }>((resolve) => {
            setTimeout(() => {
              resolve({
                data: null,
                isTimeouted: true,
              })
            }, timeout)
          }),
        ])
        delete this.callbackMap[eventId]
        result = raceResult.data
        if (raceResult.isTimeouted) {
          logUtils.setLogAndConsoleLog(
            `${type} timeouted after ${timeout}ms with message:`,
            message,
          )
          if (retry && retryTimes < 2) {
            logUtils.setLogAndConsoleLog(`retry: ${retryTimes + 1}`)
            generalUtils.sleep(1000)
            result = await this.callIOSAsAPI(type, message, {
              timeout,
              retry,
              retryTimes: retryTimes + 1,
            })
          }
        }
      }
    } catch (error) {
      logUtils.setLog(
        `Error occurs in callIOSAsAPI with type: ${type}, message: ${message}, event: ${eventId}`,
      )
      logUtils.setLogForError(error as Error)
      result = null
    }
    return result
  }

  setupAPIInterface() {
    this.registerCallbacksCore('nativeResponse')
  }

  nativeResponse({ eventId, output }: { eventId: string; output: unknown }) {
    this.handleCallback(eventId, output)
  }

  handleCallback(eventId: string, data?: any) {
    if (this.callbackMap[eventId]) {
      this.callbackMap[eventId]({
        data,
        isTimeouted: false,
      })
    }
  }
}
