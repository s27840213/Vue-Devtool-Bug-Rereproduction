import { IPage } from '@/interfaces/page'

export interface IUserInfoV1_0 {
  hostId: string,
  appVer: string,
  osVer: string,
  locale: string,
  isFirstOpen: boolean,
  editorBg: string,
  modelName: string
}

export interface IUserInfoV1_26 extends IUserInfoV1_0 {
  device: string,
  country: string,
}

export interface IUserInfoV1_42 extends IUserInfoV1_26 {
  storeCountry: string
}

export type IUserInfo = IUserInfoV1_0 & Partial<IUserInfoV1_26> & Partial<IUserInfoV1_42>

export function isV1_0(userInfo: IUserInfo): userInfo is IUserInfoV1_0 {
  if (isV1_26(userInfo)) return false
  if (isV1_42(userInfo)) return false
  return true
}

export function isV1_26(userInfo: IUserInfo): userInfo is IUserInfoV1_26 {
  return userInfo.device !== undefined
}

export function isV1_42(userInfo: IUserInfo): userInfo is IUserInfoV1_42 {
  if (!isV1_26(userInfo)) return false
  return 'storeCountry' in userInfo
}

export interface IUserSettings {
  autoSave: boolean,
  emojiSetting: string
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

export interface IPlanInfo {
  planId: string,
  priceText: string,
  priceValue: string
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
  },
  planInfo: IPlanInfo[]
}

export interface ISubscribeResultV1_45Base {
  option: string,
  reason?: string,
  msg?: string
}

export interface ISubscribeResultCheckState extends ISubscribeResultV1_45Base {
  complete: '1' | '0',
  uuid: string,
  subscribe: '1' | '0',
  plan_id: string,
  next_plan_id?: string,
  next_billing_time?: string,
  stop_subscribe: '1' | '0',
  retry: '1' | '0',
  expire_intent: '0' | '1' | '2',
}

export interface ISubscribeResultGetProducts extends ISubscribeResultV1_45Base {
  priceCurrency: string,
  monthly: {
    priceValue: string,
    priceText: string
  },
  annually: {
    priceValue: string,
    priceText: string
  },
  planInfo: IPlanInfo[]
}

export type ISubscribeResultV1_45 = Partial<ISubscribeResultCheckState> & Partial<ISubscribeResultGetProducts>

export function isCheckState(data: ISubscribeResultV1_45): data is ISubscribeResultCheckState {
  if (data.option !== 'checkState') return false
  return true
}

export function isGetProducts(data: ISubscribeResultV1_45): data is ISubscribeResultGetProducts {
  if (data.option !== 'getProducts') return false
  return true
}

export interface ILoadingOverlay {
  show: boolean,
  msgs: string[]
}
