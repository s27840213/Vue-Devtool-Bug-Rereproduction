/* eslint-disable camelcase */
import { IUserFontContentData } from './api'

export interface IBrandLogo {
  team_id: string,
  name: string,
  id: string,
  createTime: string,
  asset_index: number,
  signed_url?: {
    full: string,
    larg: string,
    midd: string,
    original: string,
    prev: string,
    smal: string,
    tiny: string
  },
  width: number,
  height: number,
  preview?: {
    width: number,
    height: number
  },
  ver: number
}

export interface IBrandTextStyle {
  fontId: string,
  fontUserId: string,
  fontAssetId: string,
  fontType: string,
  fontName: string,
  size: number,
  bold: boolean,
  underline: boolean,
  italic: boolean,
  isDefault: boolean
}

export interface IBrandTextStyleSetting {
  headingStyle: IBrandTextStyle,
  subheadingStyle: IBrandTextStyle,
  bodyStyle: IBrandTextStyle
}

export interface IBrandColor {
  id: string,
  createTime: string,
  color: string
}

export interface IBrandColorPalette {
  id: string,
  createTime: string,
  name: string,
  colors: IBrandColor[]
}

export interface IBrandFont extends Omit<IUserFontContentData, 'create_time' | 'update_time' | 'id'> {
  createTime: string,
  updateTime: string,
  id: string
}

export interface IBrand {
  id: string,
  createTime: string,
  name: string,
  logos: IBrandLogo[],
  textStyleSetting: IBrandTextStyleSetting,
  colorPalettes: IBrandColorPalette[]
}

export interface IDeletingItem {
  type: string,
  content: IBrandLogo | IBrandColorPalette | IBrand | IBrandFont
}

export interface IBrandParams {
  type: string,
  update_type: string,
  src: string,
  target: string
}
