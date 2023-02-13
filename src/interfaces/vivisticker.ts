import { IPage } from './page'

export interface IUserInfo {
  hostId: string,
  appVer: string,
  osVer: string,
  locale: string,
  isFirstOpen: boolean,
  editorBg: string
}

export interface IUserSettings {
  autoSave: boolean
}

export interface ITempDesign {
  pages: Array<IPage>,
  editorType: string,
  id: string,
  assetInfo: {[key: string]: any}
}

export interface IMyDesign {
  pages: Array<IPage>,
  type: string,
  id: string,
  updateTime: string,
  ver: string,
  assetInfo: {[key: string]: any}
}

export interface IMyDesignTag {
  name: string,
  tab: string
}

export interface IIosImgData {
  images: Array<string>
}
