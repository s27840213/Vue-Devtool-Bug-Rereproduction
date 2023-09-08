import generalUtils from './utils/generalUtils'
import logUtils from './utils/logUtils'
import webViewUtils from './utils/webViewUtils'
import nativeAPIUtils from './utils/nativeAPIUtils'
const utils: Record<string, any> = import.meta.glob('./utils/*.ts')

export default utils

export { generalUtils, logUtils, webViewUtils, nativeAPIUtils }
