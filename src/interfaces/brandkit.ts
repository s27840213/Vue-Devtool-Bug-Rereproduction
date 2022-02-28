export interface IBrand {
  id: string,
  createTime: string,
  name: string,
  logos: IBrandLogo[],
  textStyleSetting: IBrandTextStyleSetting,
  colorPalettes: IBrandColorPalette[],
  fonts: IBrandFont[]
}

export interface IBrandLogo {
  name: string,
  id: string,
  createTime: string,
  url: string,
  width: number,
  height: number
}

export interface IBrandTextStyleSetting {
  headingStyle: IBrandTextStyle,
  subheadingStyle: IBrandTextStyle,
  bodyStyle: IBrandTextStyle
}

export interface IBrandTextStyle {
  font: IBrandTextFont,
  size: number,
  bold: boolean,
  underline: boolean,
  italic: boolean,
  isDefault: boolean
}

export interface IBrandTextFont {
  id: string,
  name: string,
  type: string,
  ver: number
}

export interface IBrandColorPalette {
  id: string,
  createTime: string,
  name: string,
  colors: IBrandColor[]
}

export interface IBrandColor {
  id: string,
  createTime: string,
  color: string
}

export interface IBrandFont {
  type: string,
  id: string,
  createTime: string,
  name: string,
  ver: number,
  namePrevUrl: string,
  textPrevUrl: string
}

export interface IDeletingItem {
  type: string,
  content: IBrandLogo | IBrandColorPalette | IBrand | IBrandFont
}

export interface IBrandParams {

}
