import { IViviStickerProFeatures } from '@/utils/stkWVUtils'
import { IFrame, IGroup, IImage, IShape, IText } from '@/interfaces/layer'

export interface ICurrSelectedInfo {
  pageIndex: number,
  index: number,
  layers: Array<IShape | IText | IImage | IGroup | IFrame>,
  types: Set<string>,
  id: string
}

export interface ICurrSubSelectedInfo {
  index: number
  type: string
}

export interface IFooterTabProps {
  currColorEvent?: string
}

export interface IFooterTab {
  icon: string,
  text?: string,
  panelType?: string,
  hidden?: boolean,
  disabled?: boolean,
  props?: IFooterTabProps,
  forPro?: boolean,
  plan?: IViviStickerProFeatures
}

export interface CustomElementConfig {
  tag: string
  attrs?: Record<string, string | number>
  content?: CustomElementConfig[]
  style?: Record<string, string | number>
}
