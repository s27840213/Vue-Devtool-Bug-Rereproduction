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
  name: 'square-borderless'|'rounded-borderless'|'square-hollow'|
  'rounded-hollow'|'square-both'|'rounded-both'
  opacity: number
  bStroke: number
  bRadius: number
  bColor: string
  pStroke: number
  pColor: string
}

export interface ITextUnderline {
  name: 'underline-triangle'|'underline-circle'|'underline-square'
  height: number
  yOffset: number
  opacity: number
  color: string
}

export interface ITextGooey {
  name: 'gooey'
  bRadius: number
  opacity: number
  color: string
}

export type ITextBgEffect = ITextBox | ITextUnderline | ITextGooey | Record<string, never>

export function isITextBox(object: ITextBgEffect): object is ITextBox {
  return object && object.name &&
    ['square-borderless', 'rounded-borderless', 'square-hollow',
      'rounded-hollow', 'square-both', 'rounded-both'].includes(object.name)
}
export function isITextUnderline(object: ITextBgEffect): object is ITextUnderline {
  return object && object.name &&
    ['underline-triangle', 'underline-circle', 'underline-square'
    ].includes(object.name)
}
export function isITextGooey(object: ITextBgEffect): object is ITextGooey {
  return object && object.name && object.name === 'gooey'
}

export interface ITextFormat {
  textEffect: ITextEffect | {},
  textBg: ITextBgEffect,
  textShape: ITextShape | {},
  scale: number,
  paragraphStyle: IParagraphStyle,
  spanStyle: ISpanStyle
}

export interface IImageFormat extends IAdjustJsonProps { }

export interface IFormat {
  type: 'text' | 'image',
  content: ITextFormat | IImageFormat
}
