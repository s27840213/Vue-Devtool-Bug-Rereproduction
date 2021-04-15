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

export const ControlPoints = {
  ne: {
    xSign: 1,
    ySign: -1,
    styles: {
      right: '0px',
      top: '0px',
      cursor: 'nesw-resize'
    }
  },
  nw: {
    xSign: -1,
    ySign: -1,
    styles: {
      left: '0px',
      top: '0px',
      cursor: 'nwse-resize'
    }
  },
  se: {
    xSign: 1,
    ySign: 1,
    styles: {
      right: '0px',
      bottom: '0px',
      cursor: 'nwse-resize'
    }
  },
  sw: {
    xSign: -1,
    ySign: 1,
    styles: {
      left: '0px',
      bottom: '0px',
      cursor: 'nesw-resize'
    }
  },
  s: {
    xSign: 0,
    ySign: 1,
    styles: {
      bottom: '0px',
      cursor: 'ns-resize'
    }
  },
  n: {
    xSign: 0,
    ySign: -1,
    styles: {
      top: '0px',
      cursor: 'ns-resize'
    }
  },
  e: {
    xSign: 1,
    ySign: 0,
    styles: {
      right: '0px',
      cursor: 'ew-resize'
    }
  },
  w: {
    xSign: -1,
    ySign: 0,
    styles: {
      left: '0px',
      cursor: 'ew-resize'
    }
  }
}
