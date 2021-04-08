import { IPage } from '@/interfaces/page'

export interface IState {
  temp: string | null
}

export interface IEditorState {
  pages: Array<IPage> | null,
  currPanelType: number | null
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
