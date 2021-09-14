import { IListServiceContentData } from '@/interfaces/api'
import { IImage, IStyle, IShape, IText, ITmp, IGroup, ILayer } from '@/interfaces/layer'

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
  fullUrl?: string
  previewUrl?: string
  jsonUrl?: string
  jsonData?: ILayer | IText | ITmp | IImage | IShape | IGroup
  width?: number
  height?: number
}

export interface IAssetProps {
  pageIndex?: number
  styles?: Partial<IStyle>
}
