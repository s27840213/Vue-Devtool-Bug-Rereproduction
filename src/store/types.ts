import { IPage } from '@/interfaces/page'

export interface IState {
  temp: string | null
}

export interface IEditorState {
  pages: Array<IPage>,
  currPanelType: number,
  pageScaleRatio: number
}

export enum PanelType {
  template,
  photo,
  object,
  bg,
  text,
  file,
  group,
  textSetting,
  colorPicker,
  pageSetting,
  photoSetting
}

export enum LayerType {
  'nu-clipper',
  'nu-image',
  'nu-shape',
  'nu-text',
  'nu-group'
}
