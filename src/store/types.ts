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

const _ControlPoints = (resizerShort: number, resizerLong: number) => {
  return {
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
        width: `${resizerLong}px`,
        height: `${resizerShort}px`,
        top: `${-resizerShort - 1.5}px`,
        transform: 'translate(-50%, 0)',
        cursor: 'ew-resize'
      },
      {
        height: `${resizerLong}px`,
        width: `${resizerShort}px`,
        right: `${-resizerShort - 1.5}px`,
        transform: 'translate(0, -50%)',
        cursor: 'ew-resize'
      },
      {
        width: `${resizerLong}px`,
        height: `${resizerShort}px`,
        bottom: `${-resizerShort - 1.5}px`,
        transform: 'translate(-50%, 0)',
        cursor: 'nwse-resize'
      },
      {
        height: `${resizerLong}px`,
        width: `${resizerShort}px`,
        left: `${-resizerShort - 1.5}px`,
        transform: 'translate(0, -50%)',
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
}

export const ControlPoints = _ControlPoints(4, 25)
