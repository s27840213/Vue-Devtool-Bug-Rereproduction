export interface IBrand {
  id: string,
  name: string,
  logos: IBrandLogo[],
  textStyleSetting: IBrandTextStyleSetting,
  colorPalettes: IBrandColorPalette[],
  fonts: IBrandFont[]
}

export interface IBrandLogo {
  name: string,
  id: string,
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
  font: string,
  size: number,
  isDefault: boolean
}

export interface IBrandColorPalette {
  id: string,
  name: string,
  colors: string[]
}

export interface IBrandFont {
  id: string,
  name: string,
  namePrevUrl: string,
  textPrevUrl: string
}

export interface IBrandParams {

}
