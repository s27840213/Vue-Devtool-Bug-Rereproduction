import { IGroup, IImage, IShape, IText, ITmp } from './layer'

export interface ICurrSelectedInfo {
  pageIndex: number,
  index: number,
  layers: Array<IShape | IText | IImage | IGroup | ITmp>,
  types: Set<string>
}

export interface ICurrSubSelectedInfo {
  index: number
  type: string
}
