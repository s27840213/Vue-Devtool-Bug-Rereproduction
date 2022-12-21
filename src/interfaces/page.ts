import { IShape, IText, IImage, IGroup, IFrame } from '@/interfaces/layer'
import SnapUtils from '@/utils/snapUtils'

export interface IBackgroundImage {
  config: IImage,
  posX: number,
  posY: number,
  newDisplayMode?: boolean
}
export interface IPage {
  [index: string]: unknown,
  id: string,
  width: number,
  height: number,
  backgroundColor: string,
  backgroundImage: IBackgroundImage,
  name: string,
  layers: Array<IShape | IText | IImage | IGroup | IFrame>,
  // snapUtils: SnapUtils,
  documentColors: Array<string>,
  designId: string,
  modified?: boolean,
  guidelines: {
    [index: string]: Array<number>,
    v: Array<number>,
    h: Array<number>
  },
  isAutoResizeNeeded: boolean
}

export interface IPageState {
  config: IPage,
  modules: {
    snapUtils: SnapUtils
  }
}
