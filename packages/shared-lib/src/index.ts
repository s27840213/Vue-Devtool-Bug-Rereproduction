import generalUtils from './utils/generalUtils'
import logUtils from './utils/logUtils'
import nativeAPIUtils from './utils/nativeAPIUtils'
import queueUtils, { globalQueue } from './utils/queueUtils'
const utils: Record<string, any> = import.meta.glob('./utils/*.ts')

export default utils

export { generalUtils, globalQueue, logUtils, nativeAPIUtils, queueUtils }
