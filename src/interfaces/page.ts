import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export interface IBackgroundImage {
  src: string,
  config: IImage,
  posX: number,
  posY: number
}
export interface IPage {
  [index: string]: number | string | Array<IShape | IText | IImage | IGroup> | IBackgroundImage,
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImage: IBackgroundImage,
  name: string,
  layers: Array<IShape | IText | IImage | IGroup>,
  designId: string
}
