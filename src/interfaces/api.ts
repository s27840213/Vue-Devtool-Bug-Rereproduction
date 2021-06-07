export interface IPhotoTag {
  title: string
  type: string
}

export interface IPhoto {
  width: number
  height: number
  id: string
  description: string
  color: string
  created_at: string
  tags: IPhotoTag[]
  urls: {
    full: string
    raw: string
    regular: string
    small: string
    thumb: string
  }
}

export interface ISearchPhotoResponse {
  results: IPhoto[]
  total: number
  total_pages: number
}

export interface ISearchPhotoParams {
  query: string
  page: number
  perPage?: number
  orderBy?: 'relevant' | 'latest'
}
