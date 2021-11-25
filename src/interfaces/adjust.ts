export interface ISvgFilterTag {
  tag: string
  attrs?: { [key: string]: string | number }
  child?: ISvgFilterTag[] | []
}

export interface IAdjustJsonProps {
  [key: string]: number
}

export interface IAdjustProps {
  adjust: IAdjustJsonProps
  pageIndex?: number
  layerIndex?: number
  subLayerIndex?: number
}
