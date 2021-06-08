import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { IPage } from './page';

export interface IStep {
  pages: Array<IPage>,
  lastSelectedPageIndex: number,
  lastSelectedLayerIndex: number,
  currSelectedInfo: {
    index: number,
    layers: Array<IShape | IText | IImage | IGroup>,
    types: Set<string>
  }
}
