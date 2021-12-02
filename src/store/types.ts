import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { ICurrSelectedInfo, ICurrSubSelectedInfo } from '@/interfaces/editor'
import { ITextState } from './text'
import { IAsset } from '@/interfaces/module'
import { SrcObj } from '@/interfaces/gallery'
import { IUserModule } from './module/user'
import { Itheme } from '@/interfaces/theme'

/**
 * @param {number} lastSelectedPageIndex -> 進行各項操作時，主要使用到的pageIndex
 * @param {number} currActivePageIndex
 *    -> 若使用者點擊 Page 會使該 Page 變為 active 狀態，此刻當 Page 的 focus 因為點 Sidebar 或 Function Panel 的 button 而跑掉時，以此判斷說要重新 focus 的 Page 為何
 *    -> 若為 -1 ， focus 最接近中線的 Page
 *    -> 若不為 -1 ， focus 該 index 的 Page
 */

/**
 * @param designId: for multiple template used (only for admin),
   @param assetId: for user upload asset used,
   @param groupId: for template group used (only for admin),
 */
export interface IEditorState {
  pages: Array<IPage>,
  name: string,
  designId: string,
  assetId: string,
  groupId: string,
  groupType: number,
  folderInfo: {
    isRoot: boolean,
    parentFolder: string,
    path: string
  },
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
  currDraggedPhoto: {
    srcObj: SrcObj,
    styles: {
      width: number,
      height: number
    }
  },
  asset: {
    [key: string]: IAsset
  },
  textInfo: {
    heading: Array<string>,
    subheading: Array<string>,
    body: Array<string>
  },
  showRuler: boolean,
  showGuideline: boolean,
  themes: Itheme[]
}

export enum SidebarPanelType {
  template,
  photo,
  object,
  bg,
  text,
  file,
  brand,
  pexels,
  page
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
  shape = 'setShapeColor',
  bg = 'setBgColor'
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

export enum LineTemplatesType {
  type1 = 'type1',
  type2 = 'type2'
}

export interface ISpecLayerData {
  pageIndex: number,
  layerIndex: number,
  subLayerIndex?: number,
  props?: { [key: string]: any },
  styles?: { [key: string]: any },
  type?: string[]
}
