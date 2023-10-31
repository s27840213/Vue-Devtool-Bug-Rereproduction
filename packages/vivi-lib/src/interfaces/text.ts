export interface ISelection {
  pIndex: number,
  sIndex: number,
  offset: number
}

export interface IFont {
  name: string,
  face: string,
  loaded: boolean
}

export interface ITiptapSelection {
  from: number,
  to: number
}

export interface ICurveTextPreParams {
  wasCurveText: boolean,
  bendOri: number,
  hDiff1: number,
  minHeight: number
}

export interface ICurveTextPostParams {
  hDiff1: number,
  hDiff2: number,
  rotate: number,
  oldPos: { x: number, y: number },
  oldSize: { width: number, height: number },
  newSize: { width: number, height: number }
}
