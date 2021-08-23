import { IListServiceContentData } from '@/interfaces/api'

export interface IListAssetsState {
  contents: IListServiceContentData[]
  query: string
  json: string
  category : number | undefined
  page: number
  nextPage: number | undefined
  perPage: number
  pending: boolean
  host: string
  preview: string
  locale: string
  error: string
}

export interface IListModuleState {
  content: IListServiceContentData[]
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
