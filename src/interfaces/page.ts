import { IShape, IText, IImage, IGroup, IFrame } from '@/interfaces/layer'

export interface IBackgroundImage {
  config: IImage,
  posX: number,
  posY: number
}
export interface IPage {
  [index: string]: number | string | Array<IShape | IText | IImage | IGroup | IFrame> | Array<string> | IBackgroundImage,
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImage: IBackgroundImage,
  name: string,
  layers: Array<IShape | IText | IImage | IGroup | IFrame>,
  documentColor: Array<string>,
  designId: string
}
