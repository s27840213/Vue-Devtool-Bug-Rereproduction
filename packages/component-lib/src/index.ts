import generalUtils from './utils/generalUtils'
const utils: Record<string, any> = import.meta.glob('./utils/*.ts')

export default utils

export { generalUtils }
