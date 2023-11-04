import cmWVUtils from '@/utils/cmWVUtils'
import generalUtils, { appType } from '@/utils/generalUtils'
import picWVUtils from '@/utils/picWVUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import { WebViewUtils, dummyWVUtils } from '@/utils/webViewUtils'

let WVUtils = dummyWVUtils as WebViewUtils<{[key: string]: any}>
switch (generalUtils.app) {
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

export const app = generalUtils.app
export { appType }

export default WVUtils
