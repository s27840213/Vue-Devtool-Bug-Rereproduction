import { ICoordinate } from './frame'

export interface IStyle {
  [key: string]: number | string | boolean | undefined,
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
  opacity: number,
  horizontalFlip: boolean,
  verticalFlip: boolean
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
  designId: string,
  styles: T
}

export interface ITextStyle extends IStyle {
  writingMode: string
}

export interface IParagraphStyle {
  [key: string]: number | string | undefined,
  align: string,
  lineHeight: number,
  fontSpacing: number,
  size: number
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

export interface ISpan {
  [key: string]: string | number | ISpanStyle,
  text: string,
  styles: ISpanStyle
}
export interface IParagraph {
  [key: string]: string | number | Array<ISpan> | IParagraphStyle,
  spans: Array<ISpan>,
  styles: IParagraphStyle
}

export interface IText extends ILayer<ITextStyle> {
  paragraphs: Array<IParagraph>,
  widthLimit: number,
  editing: boolean,
  isHeading?: boolean,
  isSubheading?: boolean,
  isBody?: boolean,
  isEdited: boolean
}

export interface IShape extends ILayer<IStyle> {
  // svgID: string,
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
  point?: number[],
  size?: number[],
  dasharray?: number[],
  linecap?: 'butt' | 'round',
  markerId?: string[],
  markerWidth?: number[],
  trimWidth?: (boolean | undefined)[],
  trimOffset?: number[],
  styleArray: string[],
  filled?: boolean,
  shapeType?: string
}
export interface IImage extends ILayer<IImageStyle> {
  srcObj: {
    type: string,
    userId: string,
    assetId: string
  },
  clipPath: string,
  isClipper: boolean,
  isFrame?: boolean,
  imgControl: boolean
}
export interface IGroup extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}
export interface ITmp extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}

export interface IFrame extends ILayer<IStyle> {
  clips: Array<IImage>
  decoration?: IShape,
  decorationTop? : IShape
}

export const jsonVer = '1.0.0'
