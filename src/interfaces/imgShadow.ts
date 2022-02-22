export enum ShadowEffectType {
  none = 'none',
  shadow = 'shadow',
  halo = 'halo',
  frame = 'frame',
  projection = 'projection',
  blur = 'blur',
}
export interface IShadowEffect {
  [key: string]: number
  x: number,
  y: number,
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
export interface IHaloEffect {
  [key: string]: number
  // radius: number,
  // spread: number,
  // opacity: number
  width: number,
  y: number,
  blur: number
}
export interface IProjectionEffect {
  [key: string]: number
  spread: number,
  radius: number,
  y: number,
  opacity: number,
  width: number
}

export interface IShadowEffects {
  color: string
  shadow?: IShadowEffect,
  blur?: IBlurEffect,
  frame?: IFrameEffect,
  halo?: IHaloEffect,
  projection?: IProjectionEffect
}
export interface IShadowProps {
  currentEffect: ShadowEffectType,
  filterId?: string,
  effects: IShadowEffects
}
