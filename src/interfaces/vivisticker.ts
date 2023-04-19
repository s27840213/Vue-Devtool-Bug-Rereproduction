import { IPage } from './page'

export interface IUserInfoV1_0 {
  hostId: string,
  appVer: string,
  osVer: string,
  locale: string,
  isFirstOpen: boolean,
  editorBg: string,
}

export interface IUserInfoV1_26 extends IUserInfoV1_0 {
  device: string,
  country: string,
}

export type IUserInfo = IUserInfoV1_0 | IUserInfoV1_26

export function isV1_26(userInfo: IUserInfo): userInfo is IUserInfoV1_26 {
  return (userInfo as any).device !== undefined
}

export interface IUserSettings {
  autoSave: boolean
}

export interface ITempDesign {
  pages: Array<IPage>,
  editorType: string,
  id: string,
  assetInfo: { [key: string]: any }
}

export interface IMyDesign {
  pages: Array<IPage>,
  type: string,
  id: string,
  updateTime: string,
  ver: string,
  assetInfo: { [key: string]: any }
}

export interface IMyDesignTag {
  name: string,
  tab: string
}

export interface IIosImgData {
  images: Array<string>
}
export interface IPrice {
  value: number,
  text: string
}
export interface IPrices {
  currency: string,
  monthly: IPrice,
  annually: IPrice
}
