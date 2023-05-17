import { IAdjustJsonProps } from '@/interfaces/adjust'
import { LayerProcessType } from '@/store/types'
import { ITextBgEffect, ITextEffect, ITextShape } from './format'
import { SrcObj } from './gallery'
import { IShadowProps, IShadowStyles } from './imgShadow'
import { ITiptapSelection } from './text'

/**
 * before 1.0.7: IDK.
 * 1.0.8: Fix problem that some text effect will not scale with font-size,
 *        and NuText layer will always scale 1 and only use font-size to adjust its size.
 */

export const jsonVer = '1.0.8'

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
  type: 'shape' | 'text' | 'image' | 'frame' | 'group' | 'tmp',
  active: boolean,
  shown: boolean,
  locked: boolean,
  moved: boolean,
  moving: boolean,
  dragging: boolean,
  designId: string,
  styles: T,
  id: string
}

export interface ITextStyle extends IStyle {
  writingMode: string
  textShape: ITextShape
  textEffect: ITextEffect
  textBg: ITextBgEffect
  align: string
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
  type: 'text'
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
  isAutoResizeNeeded: boolean,
  isCompensated?: boolean,
  inAutoRescaleMode: boolean,
  initScale: number,
  isDraggingCursor: boolean,
  isFlipping: boolean,
}

export interface IShape extends ILayer<IStyle> {
  type: 'shape'
  // svgID: string,
  className: string,
  ratio: number,
  category: string,
  scaleType?: number,
  styleArray: string[],
  color: [string],
  size?: number[],
  transArray?: string[],
  markerTransArray?: string[],
  svg: string,
  vSize: number[],
  cSize?: number[],
  pSize?: number[],
  pDiff?: number[],
  point?: number[],
  path?: string,
  dasharray?: number[],
  linecap?: 'butt' | 'round',
  markerId?: string[],
  markerWidth?: number[],
  trimWidth?: (boolean | undefined)[],
  trimOffset?: number[],
  filled?: boolean,
  shapeType?: string,
  pDiffLimits?: number[]
}
export interface IImage extends ILayer<IImageStyle> {
  type: 'image'
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
  panelPreviewSrc?: string,
  categoryType?: number
}

export interface IFrameStyle extends IStyle {
  shadow?: {
    srcObj: SrcObj
    styles: IShadowStyles
  }
}
export interface IFrame extends ILayer<IFrameStyle> {
  type: 'frame'
  clips: Array<IImage>
  decoration?: IShape,
  decorationTop?: IShape
  blendLayers?: Array<IShape>
}
export interface IGroup extends ILayer<IStyle> {
  type: 'group'
  layers: Array<IShape | IText | IImage | IFrame>,
  db?: 'svg' | 'text'
}
export interface ITmp extends ILayer<IStyle> {
  type: 'tmp'
  layers: Array<IShape | IText | IImage | IGroup | IFrame>
}

export type AllLayerTypes = IShape | IText | IImage | IGroup | IFrame | ITmp
