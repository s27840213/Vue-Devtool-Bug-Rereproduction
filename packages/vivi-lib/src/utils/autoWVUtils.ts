import { WebViewUtils, dummyWVUtils } from '@/utils/webViewUtils'
import picWVUtils from '@/utils/picWVUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import generalUtils from '@/utils/generalUtils'

export enum appType {
  Vivipic,
  Vivisticker,
  Charmix
}

export const app = (generalUtils.isPic ? appType.Vivipic : (generalUtils.isStk ? appType.Vivisticker : appType.Charmix)) as appType

let WVUtils = dummyWVUtils as WebViewUtils<{[key: string]: any}>
switch (app) {
  case appType.Vivipic:
    WVUtils = picWVUtils
    break
  case appType.Vivisticker:
    WVUtils = stkWVUtils
    break
}

export default WVUtils
