import { ICoordinate } from "./frame";

export interface IStyle {
  [key: string]: number | string | undefined,
  x: number,
  y: number,
  scale: number
  scaleX: number,
  scaleY: number,
  rotate: number,
  width: number,
  height: number,
  initWidth: number,
  initHeight: number,
  zindex: number,
  opacity: number
}

export interface ITextStyle extends IStyle {
  font: string,
  weight: string,
  color: string,
  size: number,
  initSize: number,
  decoration: string
}

export interface IImageStyle extends IStyle {
  imgX: number,
  imgY: number,
  imgWidth: number,
  imgHeight: number
}

// export interface ITmpStyle extends IStyle {
//   initX: number,
//   initY: number,
// }

// export interface IGroupStyle extends IStyle {
//   initX: number,
//   initY: number,
// }
export interface ILayer<T extends IStyle = IStyle> {
  [key: string]: unknown,
  type: string,
  active: boolean,
  shown: boolean,
  locked: boolean,
  styles: T
}

export interface IText extends ILayer<ITextStyle> {
  text: string
  contents: Array<Array<ISpan>>,
  writingMode: string,
  align: string,
  lineHeight: number,
}

export interface ISpan {
  text: string,
  styles: ITextStyle
}

export interface IShape extends ILayer<IStyle> {
  category: number,
  path: string,
  color: [string],
  svg: string,
  size: [number]
}
export interface IImage extends ILayer<IImageStyle> {
  src: string,
  clipPath?: string,
  imgControl: boolean
}
export interface IGroup extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
export interface ITmp extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
