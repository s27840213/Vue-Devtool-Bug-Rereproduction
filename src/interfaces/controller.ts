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
  w?: number
  h?: number
  width: string
  height: string
  top?: string
  left?: string
  bottom?: string
  right?: string
  transform: string
  cursor: string
  opacity: string
}

export interface IControlPoints {
  scalers: Array<IScaler>,
  resizers: Array<IResizer>,
  cursors: Array<string>
}
