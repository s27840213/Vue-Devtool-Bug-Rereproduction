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
  /** Note: Only the non-transparent-background-image get the spread property */
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
  width: number,
  blur: number,
  opacity: number
}
export interface IHaloEffect {
  [key: string]: number
  radius: number,
  spread: number,
  opacity: number
}
export interface IProjectionEffect {
  [key: string]: number
  width: number,
  opacity: number
}

export interface IShadowProps {
  [key: string]: string | number | boolean | { [key: string]: string | number } | IShadowEffect | undefined
  currentEffect: ShadowEffectType,
  isTransparentBG?: boolean,
  color: string
  shadow?: IShadowEffect,
  blur?: IBlurEffect,
  frame?: IFrameEffect,
  halo?: IHaloEffect,
  projection?: IProjectionEffect
}
