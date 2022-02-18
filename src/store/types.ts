import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { ICurrSelectedInfo, ICurrSubSelectedInfo } from '@/interfaces/editor'
import { ITextState } from './text'
import { IAsset } from '@/interfaces/module'
import { SrcObj } from '@/interfaces/gallery'
import { IUserModule } from './module/user'
import { Itheme } from '@/interfaces/theme'

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
  exportIds: string,
  groupType: number,
  folderInfo: {
    isRoot: boolean,
    parentFolder: string,
    path: string
  },
  currSidebarPanelType: number,
  currFunctionPanelType: number,
  pageScaleRatio: number,
  middlemostPageIndex: number,
  currActivePageIndex: number,
  lastSelectedLayerIndex: number,
  clipboard: Array<ITmp>,
  currSelectedInfo: ICurrSelectedInfo,
  currSubSelectedInfo: ICurrSubSelectedInfo,
  isColorPickerOpened: boolean,
  isMoving: boolean,
  currSelectedResInfo: Record<string, never> | {
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
    },
    isPreview: boolean
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
  lockGuideline: boolean,
  themes: Itheme[],
  hasCopiedFormat: boolean
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
  background = 'setBackgroundColor',
  photoShadow = 'setPhotoEffectColor'
}

export enum PopupSliderEventType {
  stop = 'changeStop',
  opacity = 'setLayerOpacity',
  lineHeight = 'setTextLineHeight',
  letterSpacing = 'setTextSpacing',
  lineWidth = 'setlineWidth',
  cornerRadius = 'setCornerRadius'
}

export enum LayerType {
  image = 'image',
  shape = 'shape',
  text = 'text',
  group = 'group',
  frame = 'frame',
  tmp = 'tmp'
}

export interface ILayerInfo {
  pageIndex: number,
  layerIndex: number,
  subLayerIdx: number
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
