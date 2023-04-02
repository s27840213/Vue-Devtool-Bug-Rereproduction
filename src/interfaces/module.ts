/* eslint-disable camelcase */
import { IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
import { IGroup, IImage, ILayer, IShape, IStyle, IText, ITmp } from '@/interfaces/layer'
import { IMarker } from '@/interfaces/shape'

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
  signed_url?: { [key: string]: string },
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
  asset_index?: number,
  has_frame?: boolean
}

export interface ITag {
  keyword: string
  active: boolean
}
export interface ITagExtend extends ITag {
  list: IAsset[]
}
export function isITag(object: unknown): object is ITag {
  if (!object || typeof object !== 'object') return false
  const keys = Object.keys(object ?? {})
  return keys.includes('keyword')
}

export interface ICategory {
  id: number
}
export interface ICategoryExtend extends ICategory {
  title: string
  list: IAsset[]
  url: string
}
export function isICategory(object: unknown): object is ICategory {
  if (!object || typeof object !== 'object') return false
  const keys = Object.keys(object ?? {})
  return keys.includes('id') && keys.every(key => ['id', 'title', 'list', 'url'].includes(key))
}

export interface IFavorite {
  order: string[]
  obj: Record<string, true>
}

export type IFavoriteItemContent = Record<string, IAsset>

export type IFavoriteTagContent = Record<string, {
  asset: IAsset[]
  next: number
}>

export type IFavoriteCategoryContent = Record<string, {
  title: string
  titleLocale: string
  asset: IAsset[]
  tags: ITag[]
  url: string
  next: number
}>

export type IPending = {
  categories: boolean
  content: boolean
  recently: boolean
  favorites: boolean
}

export interface IListModuleState {
  content: Partial<IListServiceContentData>
  categories: IListServiceContentData[]
  searchResult: Partial<IListServiceContentData>
  searchCategoryInfo: {
    categoryName: string
    tags: ITag[]
    url: string
  }
  tags: ITag[]
  keyword: string
  theme: string
  page: number
  nextCategory: number
  nextPage: number | undefined
  nextSearch: number
  perPage: number
  pending: IPending
  // host: string
  // data: string
  // preview: string
  // preview2?: string
  locale: string
  error: string,
  sum?: number,
  favorites: {
    // Should sync with local storage:
    items: IFavorite
    tags: IFavorite
    categories: IFavorite
    // The following should not sync:
    nextItems: string[]
    nextTags: string[]
    nextCategories: string[]
    itemsContent: IFavoriteItemContent
    tagsContent: IFavoriteTagContent
    categoriesContent: IFavoriteCategoryContent
    searchTarget: string | ITag | ICategory
  }
}

export interface IAssetProps {
  db?: string,
  ver?: number,
  pageIndex?: number
  styles?: Partial<IStyle>,
  // the following props are used for preview image during polling process
  isPreview?: boolean,
  assetId?: string | number,
  assetIndex?: number,
  width?: number,
  height?: number,
  panelPreviewSrc?: string,
  imgSrcSize?: {
    width: number,
    height: number
  },
  has_frame?: number | boolean
}
