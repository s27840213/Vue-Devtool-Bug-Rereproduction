/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { IAdjustJsonProps } from './adjust'
import { IParagraphStyle, ISpanStyle } from './layer'

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

const textLetterBgName = [
  'rainbow', 'rainbow-dark', 'circle', 'cloud', 'text-book', 'penguin', 'planet'
] as const
export interface ITextLetterBg {
  name: typeof textLetterBgName[number]
  xOffset200: number
  yOffset200: number
  opacity: number
  size: number
  fixedWidth: boolean
  color: string
}

export type ITextBg = ITextBox | ITextUnderline | ITextGooey | ITextLetterBg | { name: 'none' }

export function isITextBox(object: ITextBg): object is ITextBox {
  return object && object.name &&
    ['square-borderless', 'rounded-borderless', 'square-hollow',
      'rounded-hollow', 'square-both', 'rounded-both'].includes(object.name)
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
  name: 'fill-img'
  xOffset200: number
  yOffset200: number
  size: number
  opacity: number
  focus: boolean
  fixedWidth: true
}

export type ITextFill = ITextFillConfig | { name: 'none' }

export function isITextFillConfig(object: ITextFill): object is ITextFillConfig {
  return object && object.name && ['fill-img'].includes(object.name)
}

export interface ITextFormat {
  textEffect: ITextEffect
  textBg: ITextBg
  textShape: ITextShape
  textFill: ITextFill
  scale: number
  paragraphStyle: IParagraphStyle,
  spanStyle: ISpanStyle,
  writingMode: string
}

export interface IImageFormat extends IAdjustJsonProps { }

export interface IFormat {
  type: 'text' | 'image',
  content: ITextFormat | IImageFormat
}
