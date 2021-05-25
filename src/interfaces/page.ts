import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

export interface IPage {
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImage: {
    src: string,
    config: IImage,
    posX: number,
    posY: number
  },
  name: string,
  layers: Array<IShape | IText | IImage | IGroup>
}
