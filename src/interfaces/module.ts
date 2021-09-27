import { IListServiceContentData } from '@/interfaces/api'
import { IImage, IStyle, IShape, IText, ITmp, IGroup, ILayer } from '@/interfaces/layer'
import { IMarker } from '@/interfaces/shape'

export interface IListModuleState {
  content: Partial<IListServiceContentData>
  categories: IListServiceContentData[]
  keyword: string
  page: number
  nextPage: number | undefined
  perPage: number
  pending: boolean
  host: string
  data: string
  preview: string
  preview2?: string
  locale: string
  error: string
}

export interface IAsset {
  id: string
  type: number
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
}

export interface IAssetProps {
  pageIndex?: number
  styles?: Partial<IStyle>
}
