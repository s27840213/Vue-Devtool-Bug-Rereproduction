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

export type IUserInfo = IUserInfoV1_0 & Partial<IUserInfoV1_26>

export function isV1_0(userInfo: IUserInfo): userInfo is IUserInfoV1_0 {
  return userInfo.device === undefined
}

export function isV1_26(userInfo: IUserInfo): userInfo is IUserInfoV1_26 {
  return userInfo.device !== undefined
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

export interface IPaymentPending {
  purchase: boolean,
  restore: boolean
}

export interface IPayment {
  subscribe: boolean,
  prices: IPrices,
  pending: IPaymentPending
}

export interface ISubscribeResult {
  uuid: string,
  subscribe: '1' | '0',
  plan_id: 'monthly' | 'annually',
  next_plan_id?: 'monthly' | 'annually',
  next_billing_time?: string,
  stop_subscribe: '1' | '0',
  retry: '1' | '0',
  expire_intent: '0' | '1' | '2',
  reason?: string,
  msg?: string
}

export interface ISubscribeInfo extends ISubscribeResult {
  complete: '1' | '0',
  priceCurrency: string,
  monthly: {
    priceValue: string,
    priceText: string
  },
  annually: {
    priceValue: string,
    priceText: string
  }
}
