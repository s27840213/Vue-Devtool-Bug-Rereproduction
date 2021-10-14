export interface IPhotoTag {
  title: string
  type: string
}

export interface IUnsplashPhoto {
  width: number
  height: number
  id: string
  description?: string
  color?: string
  created_at?: string
  tags?: IPhotoTag[]
  urls: {
    full: string
    raw: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    links: {
      html: string
    }
  }
}

export interface IPexelsPhoto {
  width: number
  height: number
  id: number
  avg_color: string
  photographer: string
  photographer_url: string
  src: {
    medium: string
    original: string
    portrait: string
    small: string
  }
}

export interface IPhoto {
  width: number
  height: number
  id: string
  tags?: IPhotoTag[]
  urls: {
    full: string
    raw: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    link: string
  }
  vendor?: string
}

export interface IAssetPhoto {
  width: number,
  height: number,
  id: string
  progress?: number,
  preview: {
    width: number,
    height: number,
  },
  urls: {
    prev: string,
    full: string,
    larg: string,
    original: string
  }
}

export interface IPexelsSearchResponse {
  photos: IPexelsPhoto[]
  page: number
  per_page: number
  total_results: number
}

export interface IUnsplashSearchResponse {
  results: IUnsplashPhoto[]
  total: number
  total_pages: number
}

export interface ISearchPhotoParams {
  query: string
  page: number
  perPage?: number
  orderBy?: 'relevant' | 'latest' | 'popular'
}

export interface IListServiceParams {
  token?: string
  locale?: string
  type?: 'template' | 'text' | 'svg' | 'background' | 'font' | 'marker'
  keyword?: string
  pageIndex?: number
  listAll?: 0 | 1
  fontList?: 0 | 1
}

export interface IListServiceContentDataItem {
  id: string
  type: number
  ver: number
  width?: number
  height?: number
}

export interface IListServiceContentData {
  category_id: number
  list: IListServiceContentDataItem[]
  title: string
}

export interface IListServiceData {
  content: IListServiceContentData[]
  data: string
  host: string
  preview: string
  preview2?: string
  next_page?: number
}

export interface IListServiceResponse {
  data: IListServiceData
  flag: number
}

export interface IUserAssetsData {
  design: {
    content: Array<string>,
  },
  font: {
    content: Array<string>,
  },
  image: {
    content: Array<IUserImageContentData>,
  },
  video: {
    content: Array<string>,
  }
}

export interface IUserImageContentData {
  color: Array<string>,
  file_ext: string,
  file_name: string,
  width: number,
  height: number,
  id: string
}
