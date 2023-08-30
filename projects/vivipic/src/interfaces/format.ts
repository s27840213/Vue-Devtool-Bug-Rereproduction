/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { IAdjustJsonProps } from '@/interfaces/adjust'
import { IAssetPhoto, IPhotoItem } from '@/interfaces/api'
import { IParagraphStyle, ISpanStyle } from '@/interfaces/layer'
import { textLetterBgName } from '@/utils/letterBgData'

export interface ITextEffect {
  name: string
  ver?: string
  [key: string]: string | number | undefined
}

export interface ITextShape {
  bend: number | string,
  focus: boolean,
  name: string
}

export interface ITextBox {
  name: 'square-borderless' | 'rounded-borderless' | 'square-hollow' |
  'rounded-hollow' | 'square-both' | 'rounded-both'
  opacity: number
  bStroke: number
  bRadius: number
  bColor: string
  pStrokeX: number
  pStrokeY: number
  pColor: string
}

export const tailPositions = ['top', 'right', 'bottom', 'left'] as const
export type ITailPosition = typeof tailPositions[number]
export interface ITextSpeechBubble {
  name: 'speech-bubble' | 'speech-bubble-triangle'
  tailOffset: number
  tailPosition: ITailPosition
  bRadius: number
  pStrokeX: number
  pStrokeY: number
  opacity: number
  pColor: string
}

export interface ITextUnderline {
  name: 'underline'
  endpoint: string
  height: number
  yOffset: number
  opacity: number
  color: string
}

export interface ITextGooey {
  name: 'gooey'
  distance: number
  bRadius: number
  opacity: number
  color: string
}

export interface ITextLetterBg {
  name: typeof textLetterBgName[number]
  xOffset200: number
  yOffset200: number
  opacity: number
  size: number
  fixedWidth: boolean
  color: string
}

export type ITextBg = ITextBox | ITextSpeechBubble | ITextUnderline | ITextGooey | ITextLetterBg | { name: 'none' }

export function isITextBox(object: ITextBg): object is ITextBox {
  return object && object.name &&
    ['square-borderless', 'rounded-borderless', 'square-hollow',
      'rounded-hollow', 'square-both', 'rounded-both'].includes(object.name)
}
export function isITextSpeechBubble(object: ITextBg): object is ITextSpeechBubble {
  return object && object.name && ['speech-bubble', 'speech-bubble-triangle'].includes(object.name)
}
export function isITextUnderline(object: ITextBg): object is ITextUnderline {
  return object && object.name && object.name === 'underline'
}
export function isITextGooey(object: ITextBg): object is ITextGooey {
  return object && object.name && ['gooey'].includes(object.name)
}
export function isITextLetterBg(object: ITextBg): object is ITextLetterBg {
  return object && object.name &&
    (textLetterBgName as unknown as string[]).includes(object.name)
}

export interface ITextFillConfig {
  name: 'custom-fill-img'
  customImg: IAssetPhoto | IPhotoItem | null
  xOffset200: number
  yOffset200: number
  size: number
}

export interface ITextFillCustom {
  name: '0' | '1' | '2' // ....
  customImg: IAssetPhoto | IPhotoItem | null
  img: IAssetPhoto & {
    key: string
    teamId: string
  }
  xOffset200: number
  yOffset200: number
  size: number
}

export type ITextFill = ITextFillConfig | ITextFillCustom | { name: 'none', customImg: IAssetPhoto | IPhotoItem | null }

export function isTextFill(object: ITextFill): object is ITextFillConfig | ITextFillCustom {
  return object && !!object.name && object.name !== 'none'
}

export function isITextFillCustom(object: ITextFill): object is ITextFillCustom {
  return object && !!object.name && !['none', 'custom-fill-img'].includes(object.name)
}

class TextStyleCopiedFormatClass {
  textEffect?: ITextEffect
  textBg?: ITextBg
  textShape?: ITextShape
  textFill?: ITextFill
  scale?: number
  writingMode?: string
}
const textStyleCopiedFormat = new TextStyleCopiedFormatClass()
export const textStyleCopiedFormatKeys = Object.keys(textStyleCopiedFormat)
export type ITextStyleCopiedFormat = Required<TextStyleCopiedFormatClass>
export type ITextFormat = ITextStyleCopiedFormat & {
  paragraphStyle: IParagraphStyle
  spanStyle: ISpanStyle
}

export interface IImageFormat extends IAdjustJsonProps { }

export interface IFormat {
  type: 'text' | 'image',
  content: ITextFormat | IImageFormat
}