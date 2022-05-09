import { SrcObj } from './gallery'

export enum ShadowEffectType {
  none = 'none',
  shadow = 'shadow',
  imageMatched = 'imageMatched',
  frame = 'frame',
  floating = 'floating',
  blur = 'blur',
}
export interface IShadowEffect {
  [key: string]: number,
  distance: number,
  angle: number,
  radius: number,
  spread: number,
  opacity: number
}
export interface IBlurEffect {
  [key: string]: number
  radius: number,
  spread: number,
  opacity: number
}
export interface IFrameEffect {
  [key: string]: number
  radius: number,
  spread: number,
  opacity: number
}
export interface IImageMatchedEffect {
  [key: string]: number
  size: number,
  distance: number,
  angle: number,
  radius: number,
  opacity: number
}
export interface IFloatingEffect {
  [key: string]: number
  radius: number,
  x: number,
  y: number,
  opacity: number,
  thinkness: number
  size: number
}

export interface IShadowEffects {
  color: string
  shadow?: IShadowEffect,
  blur?: IBlurEffect,
  frame?: IFrameEffect,
  imageMatched?: IImageMatchedEffect,
  floating?: IFloatingEffect
}
export interface IShadowProps {
  currentEffect: ShadowEffectType,
  effects: IShadowEffects,
  srcObj: SrcObj
  isTransparent?: boolean,
}
