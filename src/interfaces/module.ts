import { IListServiceContentData } from '@/interfaces/api'

export interface IListModuleState {
  contents: IListServiceContentData[]
  query: string
  page: number
  nextPage: number | undefined
  perPage: number
  pending: boolean
  host: string
  json: string
  preview: string
  locale: string
  category: number | undefined
  error: string
}
