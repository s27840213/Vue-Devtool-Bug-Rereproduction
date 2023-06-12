export interface IScaler {
  width: string,
  height: string,
  top?: string
  left?: string
  bottom?: string
  right?: string
  transform: string,
  borderRadius: string,
  cursor: string
}

export interface IResizer {
  width: string
  height: string
  top?: string
  left?: string
  bottom?: string
  right?: string
  transform: string
  cursor: string
  opacity: string
  borderRadius: string
}

export interface IControlPoints {
  scalers: Array<IScaler>,
  resizers: Array<IResizer>,
  cursors: Array<string>
}
