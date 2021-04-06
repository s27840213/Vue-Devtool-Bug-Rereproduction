import { IFrame, IFrameList } from '@/interfaces/frame'

export interface IState {
  temp: string | null
}

export interface IEditorState {
  frameList: IFrameList | null,
  currFrame: IFrame | null,
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

// export enum PanelType {
//   template = 'template',
//   photo = 'photo',
//   background = 'background',
//   text = 'text',
//   file = 'file',
//   group = 'group',
//   textSetting = 'textSetting',
//   colorPicker = 'colorPicker',
//   pageSetting = 'pageSetting',
//   photoSetting = 'photoSetting'
// }
