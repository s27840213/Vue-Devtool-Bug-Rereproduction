export enum ShadowEffectType {
  none = 'none',
  shadow = 'shadow',
  imageMatched = 'imageMatched',
  frame = 'frame',
  projection = 'projection',
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
export interface IProjectionEffect {
  [key: string]: number
  spread: number,
  radius: number,
  x: number,
  y: number,
  opacity: number,
  size: number
}

export interface IShadowEffects {
  color: string
  shadow?: IShadowEffect,
  blur?: IBlurEffect,
  frame?: IFrameEffect,
  imageMatched?: IImageMatchedEffect,
  projection?: IProjectionEffect
}
export interface IShadowProps {
  currentEffect: ShadowEffectType,
  filterId?: string,
  effects: IShadowEffects
}
