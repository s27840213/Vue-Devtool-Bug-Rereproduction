import { IPage } from './page'

export interface IUserInfo {
  [key: string]: any
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
