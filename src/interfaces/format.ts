import { IAdjustJsonProps } from "./adjust"
import { IParagraphStyle, ISpanStyle } from "./layer"

export interface ITextEffect {
  name: string,
  ver?: string,
  [key: string]: string | number | undefined
}

export interface ITextFormat {
  textEffect: ITextEffect,
  paragraphStyle: IParagraphStyle,
  spanStyle: ISpanStyle
}

export interface IImageFormat extends IAdjustJsonProps {}

export interface IFormat {
  type: 'text' | 'image',
  content: ITextFormat | IImageFormat
}
