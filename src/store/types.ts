import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { ICurrSelectedInfo, ICurrSubSelectedInfo } from '@/interfaces/editor'
import { ITextState } from './text'
import { IAsset } from '@/interfaces/module'

/**
 * @param {number} lastSelectedPageIndex -> 進行各項操作時，主要使用到的pageIndex
 * @param {number} currActivePageIndex
 *    -> 若使用者點擊 Page 會使該 Page 變為 active 狀態，此刻當 Page 的 focus 因為點 Sidebar 或 Function Panel 的 button 而跑掉時，以此判斷說要重新 focus 的 Page 為何
 *    -> 若為 -1 ， focus 最接近中線的 Page
 *    -> 若不為 -1 ， focus 該 index 的 Page
 */

export interface IEditorState {
  text?: ITextState,
  pages: Array<IPage>,
  designId: string,
  currSidebarPanelType: number,
  currFunctionPanelType: number,
  pageScaleRatio: number,
  lastSelectedPageIndex: number,
  currActivePageIndex: number,
  lastSelectedLayerIndex: number,
  clipboard: Array<ITmp>,
  currSelectedInfo: ICurrSelectedInfo,
  currSubSelectedInfo: ICurrSubSelectedInfo,
  isColorPickerOpened: boolean,
  isMoving: boolean,
  currSelectedPhotoInfo: Record<string, never> | {
    userName: string,
    userLink: string,
    vendor: string,
    tags: string[]
  },
  asset: {
    [key: string]: IAsset
  },
  textInfo: {
    heading: Array<string>,
    subheading: Array<string>,
    body: Array<string>
  }
}

export enum SidebarPanelType {
  template,
  photo,
  object,
  bg,
  text,
  file,
  brand
}

export enum FunctionPanelType {
  none,
  group,
  textSetting,
  colorPicker,
  pageSetting,
  photoSetting,
  fonts,
  backgroundSetting
}

export enum ColorEventType {
  text = 'setTextColor',
  textEffect = 'setTextEffectColor',
  shape = 'setShapeColor'
}

export enum PopupSliderEventType {
  opacity = 'setLayerOpacity',
  lineHeight = 'setTextLineHeight',
  letterSpacing = 'setTextSpacing',
  lineWidth = 'setlineWidth',
  cornerRadius = 'setCornerRadius'
}

export enum LayerType {
  'nu-clipper',
  'nu-image',
  'nu-shape',
  'nu-text',
  'nu-group'
}

export interface ISpecLayerData {
  pageIndex: number,
  layerIndex: number,
  subLayerIndex?: number,
  props?: { [key: string]: any },
  styles?: { [key: string]: any },
  type?: string[]
}
