export interface ILayer {
  type: string,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  rotate: number,
  width: number,
  height: number
}
export interface IShape extends ILayer {
  radius?: string,
}

export interface IText extends ILayer {
  font: string,
  weight: string,
  justification: string,
  lineHeight: number,
  color: string,
  size: number,
  text: string
}

export interface IImage extends ILayer {
  src: string
}

// export interface ILayers {
//   layers: Array<IShape | IText | IImage>
// }

export interface IGroup extends ILayer {
  layers: Array<IShape | IText | IImage>
}
