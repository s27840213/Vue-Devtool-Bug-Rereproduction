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
  editorType: string
}

export interface IMyDesign {
  pages: Array<IPage>,
  type: string,
  id: string,
  updateTime: string
}
