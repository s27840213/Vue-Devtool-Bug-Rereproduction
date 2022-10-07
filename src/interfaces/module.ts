/* eslint-disable camelcase */
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IImage, IStyle, IShape, IText, ITmp, IGroup, ILayer } from '@/interfaces/layer'
import { IMarker } from '@/interfaces/shape'

export interface IListModuleState {
  content: Partial<IListServiceContentData>
  categories: IListServiceContentData[]
  searchResult: Partial<IListServiceContentData>
  keyword: string
  theme: string
  page: number
  nextCategory: number
  nextPage: number | undefined
  nextSearch: number
  perPage: number
  pending: boolean
  // host: string
  // data: string
  // preview: string
  // preview2?: string
  locale: string
  error: string,
  sum?: number
}

export interface IAsset {
  id: string
  type: number
  ver: number
  plan?: number
  jsonData?: ILayer | IText | ITmp | IImage | IShape | IGroup | IMarker
  width?: number
  height?: number
  urls: {
    prev: string
    full: string
    larg: string
    original: string
    json: string
  }
  signed_url?: {[key: string]: string},
  content_ids?: IListServiceContentDataItem[]
  match_cover?: {
    height: number
    id: string
    theme: string
    width: number
    ver: number
  },
  src?: string,
  user_id?: string,
  asset_id?: string,
  asset_index?: number
}

export interface IAssetProps {
  ver?: number,
  pageIndex?: number
  styles?: Partial<IStyle>,
  // the following props are used for preview image during polling process
  isPreview?: boolean,
  assetId?: string,
  assetIndex?: number,
  width?: number,
  height?: number,
  panelPreviewSrc?: string,
  imgSrcSize?: {
    width: number,
    height: number
  }
}
