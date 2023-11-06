import { WEBVIEW_API_RESULT } from '@/interfaces/webView'
import generalUtils from '@/utils/generalUtils'
import logUtils from '@/utils/logUtils'
import { WebViewUtils } from './webViewUtils'

export interface IRequest {
  eventId: string
  event: string
  message: any
}

export abstract class HTTPLikeWebViewUtils<T extends { [key: string]: any }> extends WebViewUtils<T> {
  makeAPIRequest(event: string, message: any): IRequest {
    const eventId = generalUtils.generateAssetId()
    return {
      event,
      message,
      eventId,
    }
  }

  async sendRequest(
    eventId: string,
    request: IRequest,
  ): Promise<{ data: WEBVIEW_API_RESULT; isTimeouted: boolean }> {
    return new Promise((resolve) => {
      this.callbackMap[eventId] = resolve
      this.sendToIOS('REQUEST', request, true)
    })
  }

  async callIOSAsHTTPAPI(
    type: string,
    message: any,
    { timeout = 5000, retry = false, retryTimes = 0 } = {},
  ): Promise<WEBVIEW_API_RESULT> {
    const request = this.makeAPIRequest(type, message)
    const eventId = request.eventId
    let result: WEBVIEW_API_RESULT
    try {
      if (timeout === -1) {
        result = (await this.sendRequest(eventId, request)).data
        delete this.callbackMap[eventId]
      } else {
        const raceResult = await Promise.race([
          this.sendRequest(eventId, request),
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
            await generalUtils.sleep(1000)
            result = await this.callIOSAsHTTPAPI(type, message, {
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

  nativeResponse({
    eventId,
    output,
    hasInternalError,
    errorMsg,
  }: {
    eventId: string
    output: any
    hasInternalError: string
    errorMsg: string
  }) {
    if (this.callbackMap[eventId]) {
      if (hasInternalError === '0') {
        this.callbackMap[eventId]({
          data: output,
          isTimeouted: false,
        })
      } else {
        logUtils.setLog(`Event: ${eventId} encountered internal native error: ${errorMsg}`)
        this.callbackMap[eventId]({
          data: null,
          isTimeouted: false,
        })
      }
    }
  }
}
