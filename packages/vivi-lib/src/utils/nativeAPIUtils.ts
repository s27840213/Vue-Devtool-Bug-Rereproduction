import i18n from '@/i18n'
import { WEBVIEW_API_RESULT } from '@/interfaces/webView'
import generalUtils from '@/utils/generalUtils'
import logUtils from '@/utils/logUtils'
import { notify } from '@kyvg/vue3-notification'
import modalUtils from './modalUtils'
import uploadUtils from './uploadUtils'
import { WebViewUtils } from './webViewUtils'

export interface IRequest {
  eventId: string
  event: string
  message: Record<string, unknown>
}

export abstract class HTTPLikeWebViewUtils<T extends Record<string, unknown>> extends WebViewUtils<T> {
  makeAPIRequest(event: string, message: Record<string, unknown>): IRequest {
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
    message = this.getEmptyMessage() as Record<string, unknown>,
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
          } else {
            if (!this.filterErrorModal(type, message, true)) {
              const errorId = generalUtils.generateRandomString(6)
              logUtils.setLog(errorId)
              logUtils.uploadLog().then(() => {
                const hint = `${uploadUtils.fullId},${generalUtils.generateTimeStamp()},${errorId}`
                modalUtils.setModalInfo(
                  `${i18n.global.t('NN0457')}(999)`,
                  hint,
                  {
                    msg: i18n.global.t('STK0023'),
                    action() {
                      generalUtils.copyText(hint).then(() => {
                        notify({ group: 'success', text: i18n.global.t('NN0923') })
                      })
                    },
                  },
                )
              })
            }
          }
        }
      }
    } catch (error) {
      logUtils.setLog(
        `Error occurs in callIOSAsAPI with type: ${type}, message: ${message}, event: ${eventId}`,
      )
      logUtils.setLogForError(error as Error)
      if (!this.filterErrorModal(type, message, false)) {
        const errorId = generalUtils.generateRandomString(6)
        logUtils.setLog(errorId)
        logUtils.uploadLog().then(() => {
          const hint = `${uploadUtils.fullId},${generalUtils.generateTimeStamp()},${errorId}`
          modalUtils.setModalInfo(
            `${i18n.global.t('NN0457')}(500)`,
            hint,
            {
              msg: i18n.global.t('STK0023'),
              action() {
                generalUtils.copyText(hint).then(() => {
                  notify({ group: 'success', text: i18n.global.t('NN0923') })
                })
              },
            },
          )
        })
      }
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
