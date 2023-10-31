import type { ColorSlip } from './color'

export type INubtnThemes = 'primary' | 'icon_light' | 'icon_dark' | 'secondary' | 'text'
export type INubtnSize = 'sm' | 'md' | ''
export type INubtnState = 'default' | 'pressed' | 'disabled'
export type INuBtnColorMap = {
  [key in INubtnThemes]: {
    [key in INubtnState]: {
      btn: ColorSlip
      text: ColorSlip
      icon: ColorSlip
    }
  }
}
