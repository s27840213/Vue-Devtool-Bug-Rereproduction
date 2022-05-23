/* eslint-disable camelcase */
import { IUserFontContentData, IUserLogoContentData } from './api'

export interface IUploadAssetResponse {
  flag: number,
  url?: {
    [index: string]: string
  },
  data: {
    asset_index: number,
    author: string,
    color: Array<string>,
    create_time: string,
    favorite: number,
    file_ext: string,
    file_name: string,
    height: number,
    name: string,
    id: string,
    team_id: string,
    rbg_auto: number,
    rbg_manual: number,
    signed_url?: {
      [index: string]: string
    },
    update_time: string,
    ver: number,
    width: number
  },
  msg?: string
}

export interface IUploadAssetFontResponse {
  flag: number
  data: IUserFontContentData
  msg?: string
}

export interface IUploadAssetLogoResponse {
  flag: number
  data: IUserLogoContentData
  msg?: string
}
