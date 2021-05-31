import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export interface ICalculatedGroupStyle {
  [index: string]: number,
  x: number,
  y: number,
  width: number,
  height: number,
  initWidth: number,
  initHeight: number
}
