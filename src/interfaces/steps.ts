import { ICurrSelectedInfo } from './editor'
import { IPage } from './page'

export interface IStep {
  pages: Array<IPage>,
  lastSelectedLayerIndex: number,
  currSelectedInfo: ICurrSelectedInfo
}
