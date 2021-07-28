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
  moved: boolean,
  dragging: boolean,
  styles: T
}

export interface IText extends ILayer<ITextStyle> {
  paragraphs: Array<IParagraph>,
  widthLimit: number,
  editing: boolean,
  isHeading?: boolean,
  isSubheading?: boolean,
  isBody?: boolean,
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
  writingMode: string,
  align: string,
}

export interface IParagraphStyle {
  [key: string]: number | string | undefined,
  lineHeight: number,
  fontSpacing: number,
}

export interface ISpanStyle {
  [key: string]: number | string | undefined,
  font: string,
  weight: string,
  color: string,
  size: number,
  decoration: string,
  style: string,
  opacity: number
}

export interface IShape extends ILayer<IStyle> {
  category: string,
  scaleType?: number,
  svg: string,
  className: string,
  path?: string,
  ratio: number,
  color: [string],
  vSize: number[],
  cSize?: number[],
  pSize?: number[],
  pDiff?: number[],
}
export interface IImage extends ILayer<IImageStyle> {
  src: string,
  clipPath: string,
  isClipper: boolean,
  imgControl: boolean
}
export interface IGroup extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
export interface ITmp extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
