export interface IGif {
  id: string
  type: number
  width: number
  height: number
  mid: number
  has_d: 0 | 1
  // The following value defined by js, not backend.
  src: string
}

export interface ITag {
  keyword: string
  type: 0 | 1
  // The following value defined by js, not backend.
  active: boolean
}
export function isITag(object: unknown): object is ITag {
  if (!object || typeof object !== 'object') return false
  const keys = Object.keys(object ?? {})
  return keys.includes('keyword') && keys.includes('type')
}
export interface ITagExtend extends ITag {
  id: string
  list: IGif[]
}

export interface IGifCategoryContent {
  tags: ITag[]
  content: IGif[]
}

export interface IGifCategory {
  id: number
  title: string
  type?: number // Only for Giphy Tag content
  list: IGif[]
}
export function isIGifCategory(object: unknown): object is IGifCategory {
  if (!object || typeof object !== 'object') return false
  const keys = Object.keys(object ?? {})
  return keys.includes('id') && keys.includes('title')
}
export type IGifCategoryExtend = IGifCategory

export interface IGifCategoryList {
  content: IGifCategory[]
  tags?: ITag[]
  keyword?: string
  next_page: number
  url?: string
  host: string
  preview: string
  data: string
  downsized: string
}

export interface IGifResponse {
  flag: number
  msg?: string
  data: IGifCategoryList
}

export interface ICategoryContentApiParams {
  categoryId: number
  categoryName: string
  keyword: string | null
  nextPage: number | null
}

export interface ITagContentApiParams {
  keyword: string
  type: number
  nextPage: number
}

export interface IGiphyFavorite<T> {
  order: string[]
  obj: Record<string, T>
}

export type IGiphyFavoriteTagContent = Record<string, {
  // Get all gifs for one favorite category/tag.
  gifs: IGif[]
  next: ITagContentApiParams
}>

export type IGiphyFavoriteCategoryContent = Record<string, {
  // Get all gifs for one favorite category/tag.
  gifs: IGif[]
  tags: ITag[]
  next: ICategoryContentApiParams
}>

export interface IGiphyFavoritesSearchResult {
  title: string
  content: IGif[] | ITagExtend[] | IGifCategoryExtend[]
  tags: ITag[]
}
