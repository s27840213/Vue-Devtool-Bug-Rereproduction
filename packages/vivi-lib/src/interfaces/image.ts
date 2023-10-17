export interface IImageUrls {
  prev: string,
  full: string,
  larg: string,
  original: string,
  midd: string,
  smal: string,
  tiny: string
}

export interface IBgRemoveInfo {
  width: number,
  height: number,
  id: string,
  assetIndex: number,
  teamId: string,
  urls: IImageUrls,
  initSrc: string
}

export interface ITrimmedCanvasInfo {
  canvas: HTMLCanvasElement,
  remainingHeightPercentage: number,
  remainingWidthPercentage: number,
  xShift: number,
  yShift: number
}
