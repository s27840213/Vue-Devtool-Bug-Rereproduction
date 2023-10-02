import picWVUtils from '@/utils/picWVUtils'
import generalUtils from './generalUtils'
// import vivistickerUtils from '@/utils/vivistickerUtils' // uncomment this line when vivisticker merged

export enum appType {
  Vivipic,
  Vivisticker,
  Charmix
}

export const app = (generalUtils.isPic ? appType.Vivipic : (generalUtils.isStk ? appType.Vivisticker : appType.Charmix)) as appType

export default picWVUtils // comment out this line in vivisticker
// export default vivistickerUtils // uncomment this line when vivisticker merged
