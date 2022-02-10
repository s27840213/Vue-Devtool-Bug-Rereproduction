export interface IShadowEffect {
  [key: string]: string | number
  x: number,
  y: number,
  radius: number,
  spread: number,
  opacity: number
}

export interface IShadowProps {
  [key: string]: string | number | { [key: string]: string | number } | IShadowEffect | undefined
  currentEffect: string,
  shadow?: IShadowEffect
}

export enum ShadowEffectType {
  none = 'none',
  shadow = 'shadow',
  halo = 'halo',
  frame = 'frame',
  projection = 'projection',
  blur = 'blur'
}
