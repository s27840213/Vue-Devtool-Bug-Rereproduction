import { ICurrSelectedInfo } from './editor'
import { IPage } from './page'

export interface IStep {
  pages: Array<IPage>,
  lastSelectedPageIndex: number,
  lastSelectedLayerIndex: number,
  currSelectedInfo: ICurrSelectedInfo
}
