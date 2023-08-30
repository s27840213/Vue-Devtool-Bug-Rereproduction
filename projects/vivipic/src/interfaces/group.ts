import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export interface ICalculatedGroupStyle {
  [index: string]: number | boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  initWidth: number,
  initHeight: number
}
