import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export interface IBackgroundImage {
<<<<<<< HEAD
  srcObj: {
    type: string,
    userId: string,
    assetId: string
  },
=======
>>>>>>> feefa4a6375fad4c9d70795f9ba53927a75bdedb
  config: IImage,
  posX: number,
  posY: number
}
export interface IPage {
  [index: string]: number | string | Array<IShape | IText | IImage | IGroup> | Array<string> | IBackgroundImage,
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImage: IBackgroundImage,
  name: string,
  layers: Array<IShape | IText | IImage | IGroup>,
  documentColor: Array<string>,
  designId: string
}
