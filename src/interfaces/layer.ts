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

export interface IImageStyle extends IStyle {
  imgX: number,
  imgY: number,
  imgWidth: number,
  imgHeight: number
}

export interface ILayer<T extends IStyle = IStyle> {
  [key: string]: unknown,
  type: string,
  active: boolean,
  shown: boolean,
  locked: boolean,
  styles: T
}

export interface IText extends ILayer<ITextStyle> {
  paragraphs: Array<IParagraph>,
  widthLimit: number
}

export interface IParagraph {
  [key: string]: string | number | Array<ISpan> | IParagraphStyle,
  spans: Array<ISpan>,
  styles: IParagraphStyle
}

export interface ISpan {
  [key: string]: string | number | ISpanStyle,
  text: string,
  styles: ISpanStyle
}

export interface ITextStyle extends IStyle {
  writingMode: string
}

export interface IParagraphStyle {
  [key: string]: number | string | undefined,
  lineHeight: number,
  fontSpacing: number,
  align: string
}

export interface ISpanStyle {
  [key: string]: number | string | undefined,
  font: string,
  weight: string,
  color: string,
  size: number,
  // initSize: number,
  decoration: string,
  style: string,
  opacity: number
}

export interface ISpanCssStyle {
  fontFamily: string
  fontWeight: string
  fontSize: string
  textDecorationLine: string,
  fontStyle: string,
  color: string,
  opacity: string
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
