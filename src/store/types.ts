import { IPage } from '@/interfaces/page'

export interface IState {
  temp: string | null
}

export interface IEditorState {
  pages: Array<IPage>,
  currPanelType: number,
  pageScaleRatio: number,
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

export const ControlPoints = {
  positions: [
    {
      left: '0px',
      top: '0px'
    },
    {
      top: '0px'
    },
    {
      right: '0px',
      top: '0px'
    },
    {
      right: '0px'
    },
    {
      right: '0px',
      bottom: '0px'
    },
    {
      bottom: '0px'
    },
    {
      left: '0px',
      bottom: '0px'
    },
    {
      left: '0px'
    }
  ],
  cursors: [
    'nwse-resize',
    'ns-resize',
    'nesw-resize',
    'ew-resize',
    'nwse-resize',
    'ns-resize',
    'nesw-resize',
    'ew-resize'
  ]
}
