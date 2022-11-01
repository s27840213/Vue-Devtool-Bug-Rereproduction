import { ICurrSelectedInfo } from './editor'
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
  id: string
}

export interface IMyDesign {
  pages: Array<IPage>,
  type: string,
  id: string,
  updateTime: string,
  ver: number
}

export interface IMyDesignTag {
  name: string,
  tab: string
}
