import cmWVUtils from '@/utils/cmWVUtils'
import picWVUtils from '@/utils/picWVUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import { WebViewUtils, dummyWVUtils } from '@/utils/webViewUtils'

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

let WVUtils = dummyWVUtils as WebViewUtils<{[key: string]: any}>
switch (app) {
  case appType.Vivipic:
    WVUtils = picWVUtils
    break
  case appType.Vivisticker:
    WVUtils = stkWVUtils
    break
  case appType.Charmix:
    WVUtils = cmWVUtils
    break
}

export default WVUtils
