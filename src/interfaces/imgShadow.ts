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
  width: number,
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
  [key: string]: string | number | { [key: string]: string | number } | IShadowEffect | undefined
  currentEffect: ShadowEffectType,
  color: string
  shadow?: IShadowEffect,
  blur?: IBlurEffect,
  frame?: IFrameEffect,
  halo?: IHaloEffect,
  projection?: IProjectionEffect
}
