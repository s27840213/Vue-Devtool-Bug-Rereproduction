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
  font: string,
  size: number,
  isDefault: boolean
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
  id: string,
  createTime: string,
  name: string,
  namePrevUrl: string,
  textPrevUrl: string
}

export interface IBrandParams {

}
