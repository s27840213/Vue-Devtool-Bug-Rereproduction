import { IShape, IText, IImage } from '@/interfaces/layer'

export interface IPage {
  width: number,
  height: number,
  backgroundColor: string,
  name: string,
  layers: Array<IShape | IText | IImage>
}
