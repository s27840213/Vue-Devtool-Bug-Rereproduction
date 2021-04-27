import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup } from '@/interfaces/layer'

/**
 * @param {object} currcurrSelectedLayers - used to record the info of selected layers
 *    @param {number} pageIndex - used to record where page the selected layers is
 *    @param {number[]} layers - all indexs of selected layers
 */
export interface IEditorState {
  pages: Array<IPage>,
  currPanelType: number,
  pageScaleRatio: number,
  lastSelectedPageIndex: number,
  currSelectedInfo: {
    pageIndex: number,
    layersIndex: number[],
    layers: Array<IShape | IText | IImage | IGroup>
  },
  clipboard: Array<IShape | IText | IImage | IGroup>
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
      left: '-7.5px',
      top: '-7.5px',
      borderRadius: '50%'
    },
    {
      top: '-7.5px'
    },
    {
      right: '-7.5px',
      top: '-7.5px',
      borderRadius: '50%'
    },
    {
      right: '-7.5px'
    },
    {
      right: '-7.5px',
      bottom: '-7.5px',
      borderRadius: '50%'
    },
    {
      bottom: '-7.5px'
    },
    {
      left: '-7.5px',
      bottom: '-7.5px',
      borderRadius: '50%'
    },
    {
      left: '-7.5px'
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
