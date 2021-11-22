/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
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
  id: string,
  assetIndex?: number,
  progress?: number,
  preview: {
    width: number,
    height: number,
  },
  urls: {
    prev: string,
    full: string,
    larg: string,
    original: string,
    midd: string,
    smal: string,
    tiny: string
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
  type?: 'template' | 'text' | 'svg' | 'background' | 'font' | 'marker' | 'layout' | 'theme' | 'hashtag'
  keyword?: string
  pageIndex?: number
  listAll?: 0 | 1
  fontList?: 0 | 1
  aspect?: string
  width?: number
  height?: number
  theme?: string
}

export interface IGroupDesignInputParams {
  token: string,
  update: number,
  group_id: string,
  list?: string,
  cover?: string,
}

export interface IListServiceContentDataItem {
  id: string
  type: number
  ver: number
  width?: number
  height?: number
  title?: string
  description?: string
  content_ids?: IListServiceContentDataItem[],
  group_id?: string,
  group_type?: string
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
    content: Array<IUserDesignContentData>,
    title: string
  },
  font: {
    content: Array<IUserFontContentData>,
    title: string
  },
  image: {
    content: Array<IUserImageContentData>,
    title: string
  },
  video: {
    content: Array<string>,
    title: string
  }
}

export interface IUserDesignContentData {
  author: string,
  color: Array<string>,
  create_time: string,
  favorite: number,
  file_ext: string,
  file_name: string,
  height: number,
  id: string,
  asset_index: number,
  name: string,
  team_id: string,
  update_time: string,
  ver: number,
  width: number
  signed_url?: {[key: string]: string}
}

export interface IUserFolderContentData {
  author: string,
  create_time: string,
  id: string,
  name: string,
  update_time: string
}
export interface IUserImageContentData {
  color: Array<string>,
  create_time: string,
  update_time: string,
  author: string,
  file_ext: string,
  file_name: string,
  width: number,
  height: number,
  id: string
  team_id: string
  ver: number,
  // Only for private asset
  signed_url?: {
    full: string,
    larg: string,
    midd: string,
    original: string,
    prev: string,
    smal: string,
    tiny: string
  },
  asset_index: number
}

export interface IUserFontContentData {
  asset_index: number,
  author: string,
  create_time: string,
  favorite: number,
  file_ext: string,
  file_name: string,
  id: string,
  name: string,
  team_id: string,
  update_time: string,
  ver: number,
  signed_url?: {
    original: string,
    font: string,
    'prev-name': string,
    'prev_2x-name': string,
    'prev-sample': string,
    'prev-2x-sample': string
  }
}

export interface IPhotoServiceParams {
  token?: string
  locale?: string
  type?: 'unsplash' | 'pexels'
  keyword?: string
  pageIndex?: number
}

export interface IPhotoServiceResponse {
  data: IPhotoServiceData
  flag: number
}

export interface IPhotoServiceData {
  host: string
  preview: string
  data: string
  content: IPhotoServiceDataContent[]
  next_page: number
}

export interface IPhotoServiceDataContent {
  title: string
  list: IPhotoItem[]
}

export interface IPhotoItem {
  id: string
  type: number
  ver: number
  width: number
  height: number
  color: string[]
  tags: string[]
  info: IPhotoItemInfo
}

export interface IPhotoItemInfo {
  description: string
  user: IPhotoUserInfo
}

export interface IPhotoUserInfo {
  name: string
  link: string
}

export interface IHashtagServiceContentDataTagItem {
  name: string
}

export interface IHashtagServiceContentDataThemeItem {
  id: number
  name: string
}

export interface IHashtagServiceContentData {
  list: (IHashtagServiceContentDataTagItem | IHashtagServiceContentDataThemeItem)[]
  title: string
  type: string
}
