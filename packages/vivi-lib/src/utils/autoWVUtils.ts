import picWVUtils from '@/utils/picWVUtils'
import generalUtils from './generalUtils'
// import stkWVUtils from '@/utils/stkWVUtils' // uncomment this line when vivisticker merged

export enum appType {
  Vivipic,
  Vivisticker,
  Charmix
}

export const app = (generalUtils.isPic ? appType.Vivipic : (generalUtils.isStk ? appType.Vivisticker : appType.Charmix)) as appType

export default picWVUtils // comment out this line in vivisticker
// export default stkWVUtils // uncomment this line when vivisticker merged
