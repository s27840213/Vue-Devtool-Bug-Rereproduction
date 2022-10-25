import { SrcObj } from './gallery'
import { ITiptapSelection } from './text'
import { IAdjustJsonProps } from '@/interfaces/adjust'
import { IShadowProps, IShadowStyles } from './imgShadow'
import { LayerProcessType } from '@/store/types'
import { ITextBgEffect, ITextEffect, ITextShape } from './format'

export const jsonVer = '1.0.7'
export interface ILayerIdentifier {
  pageId: string,
  layerId: string,
  subLayerId?: string
}
export interface IStyle {
  [key: string]: number | string | boolean | undefined | { [key: string]: number | string | boolean } | unknown,
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
  imgHeight: number,
  adjust: IAdjustJsonProps,
  shadow: IShadowProps
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
  styles: T,
  id?: string
}

export interface ITextStyle extends IStyle {
  writingMode: string
  textShape: ITextShape | Record<string, never>
  textEffect: ITextEffect | Record<string, never>
  textBg: ITextBgEffect
}

export interface IParagraphStyle {
  [key: string]: number | string | undefined,
  align: string,
  lineHeight: number,
  fontSpacing: number,
  size: number
}

export interface ISpanStyle {
  [key: string]: number | string | boolean | undefined,
  font: string,
  type: string,
  userId: string,
  assetId: string,
  fontUrl: string
  weight: string,
  color: string,
  size: number,
  decoration: string,
  style: string
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
  isHeading?: boolean,
  isSubheading?: boolean,
  isBody?: boolean,
  editing: boolean,
  isEdited: boolean,
  isTyping: boolean
  contentEditable: boolean
  selection: ITiptapSelection,
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
  shapeType?: string,
  pDiffLimits?: number[]
}
export interface IImage extends ILayer<IImageStyle> {
  previewSrc?: string,
  srcObj: SrcObj
  clipPath: string,
  isClipper: boolean,
  isFrame?: boolean,
  isFrameImg?: boolean,
  imgControl: boolean,
  inProcess: LayerProcessType,
  trace?: number,
  isUploading?: boolean,
  parentLayerStyles?: IStyle
  isHoveringFrame?: boolean,
  panelPreviewSrc?: string
}

export interface IFrameStyle extends IStyle {
  shadow?: {
    srcObj: SrcObj
    styles: IShadowStyles
  }
}
export interface IGroup extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>,
  db?: 'svg' | 'text'
}
export interface ITmp extends ILayer<IStyle> {
  layers: Array<IShape | IText | IImage | IGroup>
}

export interface IFrame extends ILayer<IFrameStyle> {
  clips: Array<IImage>
  decoration?: IShape,
  decorationTop?: IShape,
  blendLayers?: Array<IShape>
}
