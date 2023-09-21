import generalUtils from './utils/generalUtils'
import logUtils from './utils/logUtils'
import nativeAPIUtils from './utils/nativeAPIUtils'
import webViewUtils from './utils/webViewUtils'
const utils: Record<string, any> = import.meta.glob('./utils/*.ts')

export default utils

export { generalUtils, logUtils, nativeAPIUtils, webViewUtils }
