import { IPage } from '@/interfaces/page'
import { IShape, IText, IImage, IGroup, ITmp } from '@/interfaces/layer'

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
  clipboard: Array<ITmp>,
  photos: Array<unknown>
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
  scalers: [
    {
      left: '-7.5px',
      top: '-7.5px',
      borderRadius: '50%',
      cursor: 'nwse-resize'
    },
    {
      right: '-7.5px',
      top: '-7.5px',
      borderRadius: '50%',
      cursor: 'nesw-resize'
    },
    {
      right: '-7.5px',
      bottom: '-7.5px',
      borderRadius: '50%',
      cursor: 'ns-resize'
    },
    {
      left: '-7.5px',
      bottom: '-7.5px',
      borderRadius: '50%',
      cursor: 'nesw-resize'
    }
  ],
  resizers: [
    {
      top: '-7.5px',
      cursor: 'ew-resize'
    },
    {
      right: '-7.5px',
      cursor: 'ew-resize'
    },
    {
      bottom: '-7.5px',
      cursor: 'nwse-resize'
    },
    {
      left: '-7.5px',
      cursor: 'nwse-resize'
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
