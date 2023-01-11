import { IShape, IText, IImage, IGroup, IFrame, ITmp } from '@/interfaces/layer'
import SnapUtils from '@/utils/snapUtils'

export interface IBackgroundImage {
  config: IImage,
  posX: number,
  posY: number,
  newDisplayMode?: boolean
}
export interface IBleed {
  [index: string]: number
  top: number,
  bottom: number,
  left: number,
  right: number
}
export interface IPage {
  [index: string]: unknown,
  id: string,
  width: number,
  height: number,
  physicalWidth: number,
  physicalHeight: number,
  unit: string,
  backgroundColor: string,
  backgroundImage: IBackgroundImage,
  name: string,
  layers: Array<IShape | IText | IImage | IGroup | IFrame | ITmp>,
  // snapUtils: SnapUtils,
  documentColors: Array<string>,
  designId: string,
  modified?: boolean,
  guidelines: {
    [index: string]: Array<number>,
    v: Array<number>,
    h: Array<number>
  },
  isEnableBleed: boolean,
  bleeds: IBleed,
  physicalBleeds: IBleed
  isAutoResizeNeeded: boolean
}

export interface IPageState {
  config: IPage,
  modules: {
    snapUtils: SnapUtils
  }
}
