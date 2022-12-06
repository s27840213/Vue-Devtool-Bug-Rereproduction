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
  assetIndex: number,
  groupId: string,
  exportIds: string,
  groupType: number,
  folderInfo: {
    isRoot: boolean,
    parentFolder: string,
    path: string
  },
  currSidebarPanelType: number,
  mobileSidebarPanelOpen: boolean,
  currFunctionPanelType: number,
  pageScaleRatio: number,
  isSettingScaleRatio: boolean,
  middlemostPageIndex: number,
  currActivePageIndex: number,
  currHoveredPageIndex: number,
  lastSelectedLayerIndex: number,
  clipboard: Array<ITmp>,
  currSelectedInfo: ICurrSelectedInfo,
  currSubSelectedInfo: ICurrSubSelectedInfo,
  isColorPanelOpened: boolean,
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
    isTransparent?: boolean,
    isPreview: boolean,
    previewSrc?: string,
    panelPreviewSrc?: string
  },
  asset: {
    [key: string]: IAsset
  },
  textInfo: {
    heading: Array<string>,
    subheading: Array<string>,
    body: Array<string>
  },
  showBleed: boolean,
  showRuler: boolean,
  showGuideline: boolean,
  lockGuideline: boolean,
  themes: Itheme[],
  hasCopiedFormat: boolean,
  inGestureToolMode: boolean,
  isMobile: boolean
  isLargeDesktop: boolean,
  isGlobalLoading: boolean,
  useMobileEditor: boolean,
  defaultContentScaleRatio: number,
  _3dEnabledPageIndex: number,
  currFocusPageIndex: number,
  enalbleComponentLog: boolean,
  inScreenshotPreviewRoute: boolean
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
  pageSetting,
  photoSetting,
  photoShadow,
  fonts,
  backgroundSetting
}

export enum ColorEventType {
  text = 'setTextColor',
  textEffect = 'setTextEffectColor',
  textBg = 'setTextBg',
  shape = 'setShapeColor',
  background = 'setBackgroundColor',
  photoShadow = 'setPhotoEffectColor'
}

export enum MobileColorPanelType {
  palette = 'color-palette',
  picker = 'color-picker',
  more = 'color-more'
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

export enum LayerProcessType {
  imgShadow = 'imgShadow',
  bgRemove = 'bgRemove',
  none = ''
}
export interface ILayerInfo {
  pageIndex: number,
  layerIndex: number,
  subLayerIdx?: number
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
