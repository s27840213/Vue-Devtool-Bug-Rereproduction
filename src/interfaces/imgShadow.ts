import { SrcObj } from './gallery'
import { IImageStyle } from './layer'

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
  color: string,
  frameColor?: string,
  shadow?: IShadowEffect,
  blur?: IBlurEffect,
  frame?: IFrameEffect,
  imageMatched?: IImageMatchedEffect,
  floating?: IFloatingEffect
}

export interface IShadowStyles {
  imgWidth: number,
  imgHeight: number,
  imgX: number,
  imgY: number
}
export interface IShadowProps {
  currentEffect: ShadowEffectType,
  effects: IShadowEffects,
  srcObj: SrcObj,
  styles: IShadowStyles,
  isTransparent?: boolean,
  maxsize?: number,
  middsize?: number,
  srcState?: {
    effect: ShadowEffectType,
    effects: IShadowEffects,
    layerState?: Partial<IImageStyle>,
    layerSrcObj: SrcObj,
    shadowSrcObj: SrcObj
  }
}
