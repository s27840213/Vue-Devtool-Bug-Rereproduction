import cmWVUtils from '@/utils/cmWVUtils'
import picWVUtils from '@/utils/picWVUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import { WebViewUtils } from '@/utils/webViewUtils'

export enum appType {
  Vivipic,
  Vivisticker,
  Charmix
}

export const app = (() => {
  switch(process.env.VUE_APP_APP_NAME) {
    case 'pic':
      return appType.Vivipic
    case 'stk':
      return appType.Vivisticker
    case 'cm':
      return appType.Charmix
    default:
      return appType.Vivipic
  }
})()

export const getAutoWVUtils = (): WebViewUtils<{[key: string]: any}> => {
  switch (app) {
    case appType.Vivipic:
      return picWVUtils
    case appType.Vivisticker:
      return stkWVUtils
    case appType.Charmix:
      return cmWVUtils
    default:
      return picWVUtils
  }
}
