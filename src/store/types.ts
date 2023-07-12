import { ICurrSelectedInfo, ICurrSubSelectedInfo } from '@/interfaces/editor'
import { SrcObj } from '@/interfaces/gallery'
import { ITmp } from '@/interfaces/layer'
import { IAsset } from '@/interfaces/module'
import { IPageState } from '@/interfaces/page'
import { Itheme } from '@/interfaces/theme'

/**
 * @param designId: for multiple template used (only for admin),
   @param assetId: for user upload asset used,
   @param groupId: for template group used (only for admin),
 */
export interface IEditorState {
  pages: Array<IPageState>
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
  showColorSlips: boolean
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
  showRuler: boolean,
  showGuideline: boolean,
  lockGuideline: boolean,
  isDraggingGuideline: boolean,
  /**
   * @param themes
   * @param homeTags
   * @param shuffledThemesId
   * for the above param, please read the following notion document
   * https://www.notion.so/vivipic/Vivipic-35c05fc6c7e04d509ab7eb7a0f393fe4
   */
  themes: Itheme[],
  homeTags: Array<string>,
  shuffledThemesIds: Array<number>,
  hasCopiedFormat: boolean,
  inGestureToolMode: boolean,
  isMobile: boolean
  isLargeDesktop: boolean,
  isGlobalLoading: boolean,
  useMobileEditor: boolean,
  _3dEnabledPageIndex: number,
  currFocusPageIndex: number,
  enalbleComponentLog: boolean,
  inScreenshotPreviewRoute: boolean,
  cursor: string,
  isPageScaling: boolean,
  isGettingDesign: boolean,
  showGlobalErrorModal: boolean,
  newTemplateShownMode: boolean,
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
