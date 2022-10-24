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
  lastSelectedLayerIndex: number,
  currSelectedInfo: ICurrSelectedInfo,
  editorBgIndex: number,
  editorType: string,
  controllerHidden: boolean
}
