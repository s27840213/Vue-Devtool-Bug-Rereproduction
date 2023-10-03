// import picWVUtils from '@/utils/picWVUtils' // comment out this line in vivisticker
import vivistickerUtils from '@nu/vivi-lib/utils/vivistickerUtils' // uncomment this line in vivisticker

export enum appType { // TODO: somehow detect app type
  Vivipic,
  Vivisticker,
  Charmix
}

// export const app = appType.Vivipic as appType // comment out this line in vivisticker
export const app = appType.Vivisticker as appType // uncomment this line in vivisticker

// export default picWVUtils // comment out this line in vivisticker
export default vivistickerUtils // uncomment this line in vivisticker
