import { ICurrSelectedInfo } from './editor'
import { IPage } from './page'

export interface IUserInfo {
  [key: string]: any
}

export interface ITempDesign {
  pages: Array<IPage>,
  editorType: string
}
