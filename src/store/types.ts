import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'
import { ITextState } from './text'
/**
 * @param {object} currcurrSelectedLayers - used to record the info of selected layers
 *    @param {number} pageIndex - used to record where page the selected layers is
 *    @param {number[]} layers - all indexs of selected layers
 */
export interface IEditorState {
  text?: ITextState,
  pages: Array<IPage>,
  currSidebarPanelType: number,
  currFunctionPanelType: number,
  pageScaleRatio: number,
  lastSelectedPageIndex: number,
  lastSelectedLayerIndex: number,
  clipboard: Array<ITmp>,
  currSelectedInfo: {
    index: number,
    layers: Array<IShape | IText | IImage | IGroup | ITmp>,
    types: Set<string>
  },
  currSubSelectedInfo: {
    indexs: Array<number>,
    layers: Array<IShape | IText | IImage | IGroup | ITmp>,
    types: Set<string>
  },
  isOrderDropdownsOpened: boolean,
  isLayerDropdownsOpened: boolean
  isPageDropdownsOpened: boolean,
  isColorPickerOpened: boolean,
  currSelectedPhotoInfo: Record<string, never> | {
    userName: string,
    userLink: string,
    vendor: string,
    tags: string[]
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

export enum LayerType {
  'nu-clipper',
  'nu-image',
  'nu-shape',
  'nu-text',
  'nu-group'
}
