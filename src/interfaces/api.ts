import { RawImage } from '@/interfaces/gallery'
import { IBleed } from '@/interfaces/page'
import { intersection, isEqual } from 'lodash'

/* eslint-disable camelcase */
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
export function isIAssetPhoto(object: unknown): object is IAssetPhoto {
  return typeof object === 'object' && !!object &&
    isEqual(
      intersection(['width', 'height', 'preview', 'urls'], Object.keys(object)),
      ['width', 'height', 'preview', 'urls']
    ) && (!!(object as Record<string, string>).id || !!(object as Record<string, string>).assetIndex)
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
  type?: 'template' | 'text' | 'svg' | 'background' | 'font' | 'marker' | 'layout' | 'theme' | 'hashtag' | 'group' | 'color'
  keyword?: string
  pageIndex?: number
  listAll?: 0 | 1
  listCategory?: 0 | 1
  listTag?: 0 | 1
  categoryIds?: number
  fontList?: 0 | 1 | 2
  aspect?: string
  width?: number
  height?: number
  theme?: string
  groupId?: string
  cache?: boolean
  platform?: string
  all_theme?: number
  colNum?: number,
  igLayout?: 'story' | 'post'
  shuffle?: number
}

export interface IGroupDesignInputParams {
  token: string,
  update: number,
  group_id: string,
  list?: string,
  cover?: string,
  ecomm?: number
}

export interface IListServiceContentDataItem {
  id: string
  type: number
  ver: number
  db?: 'svg' | 'text'
  width?: number
  height?: number
  title?: string
  description?: string
  content_ids?: IListServiceContentDataItem[]
  group_id?: string
  group_type?: number | string
  user_id?: string
  asset_index?: number
  asset_id?: string
  src?: string
  unit?: string
  valid?: number
  plan?: number
  icon?: string
  bleed?: IBleed
  fit?: number
}

export interface ICategoryItem {
  id: string
  title?: string
  size: number
  type: string
  list: IListServiceContentDataItem[]
  url?: string
  sentinel?: boolean
}
export interface ICategoryList {
  key: 'mainContent' | 'searchResult' | 'favoritesContent' | 'favoritesSearchResult' | 'categoryCardList' | 'groupContent'
  show: boolean
  content: ICategoryItem[]
  loadMore?: () => void
  categorySearch?: (arg0: string) => void
}

export interface IListServiceContentData {
  id: number
  list: IListServiceContentDataItem[]
  title: string
  title_locale?: string // Category title locale
  is_recent?: number,
  cover_id?: string,
  cover_url?: string,
  url?: string
}

export interface IListServiceData {
  content: IListServiceContentData[]
  data: string
  host: string
  preview: string
  preview2?: string
  next_page?: number
  tags?: string[]
  /**
   * @param theme_ids - plz see https://www.notion.so/vivipic/Vivipic-35c05fc6c7e04d509ab7eb7a0f393fe4
   */
  theme_ids?: number[]
  url?: string // For IG tutorial viedo
}

export interface IListServiceResponse {
  data: IListServiceData
  flag: number
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
  signed_url?: { [key: string]: string },
  page_num: number,
  polling: boolean,
  unit: string,
  group_type: number
}

export interface IAssetDesignParams {
  asset_index: number,
  color_map: number[][],
  flag: 0,
  font_map: string,
  is_root: boolean,
  name: string,
  parent_folder: string,
  path: string,
  status: number,
  url_map: {
    [key: string]: string
  }
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
  hidden: number,
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
  id?: string,
  name: string,
  team_id: string,
  update_time: string,
  ver: number,
  font_family: string,
  signed_url?: {
    original: string,
    font: string,
    css: string,
    'prev-name': string,
    'prev_2x-name': string,
    'prev-sample': string,
    'prev-2x-sample': string
  }
}

export interface IUserLogoContentData {
  team_id: string,
  id?: string,
  asset_index: number,
  name: string,
  create_time: string,
  signed_url?: {
    full: string,
    larg: string,
    midd: string,
    original: string,
    prev: string,
    smal: string,
    tiny: string
  },
  width?: number,
  height?: number,
  ver: number
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

export interface IPhotoServiceParams {
  token?: string
  locale?: string
  type?: 'unsplash' | 'pexels'
  keyword?: string
  pageIndex?: number
}

export interface IFileParams {
  token: string
  type: 'image'
  pageIndex: number
}

export interface IPhotoUserInfo {
  name: string
  link: string
}
export interface IPhotoItemInfo {
  description: string
  user: IPhotoUserInfo
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

export interface IPhotoServiceDataContent {
  title: string
  list: IPhotoItem[]
}

export interface IPhotoServiceData {
  host: string
  preview: string
  data: string
  content: IPhotoServiceDataContent[]
  next_page: number
}

export interface IPhotoServiceResponse {
  data: IPhotoServiceData
  flag: number
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

export interface IUpdateAssetParams {
  token: string,
  locale: string,
  team_id: string,
  type: 'image' | 'font' | 'design' | string,
  update_type: 'create' | 'copy' | 'move' | 'rename' | 'delete' | 'favor' | string,
  src_asset?: string,
  src_folder?: string,
  target?: string
}

export interface IUploadMissingDesign {
  token: string,
  type: 'svg' | 'background' | 'asset-image' | 'asset-font' | 'font',
  design_id: string
}

export interface IGetImageSize {
  token: string,
  type: string,
  asset_index?: number,
  team_id?: string,
  asset_id?: string,
  key_id?: string,
  cache: boolean
}
export interface IImageSize {
  flag: number,
  msg: string,
  width: number,
  height: number
}

export interface IAssetTemplate {
  // For /list-design?type=template api raw data, not processed. ITemplate is processed.
  id: string
  type: number
  ver: number
  plan: number
  group_id: string
  content_ids: {
    id: string
    ver: number
    width: number
    height: number
    themes: string[]
    unit: string
  }[]
  match_cover: {
    id: string
    ver: number
    width: number
    height: number
    theme_id: string
    unit: string
  }
  group_type: number
  preview: RawImage
}

export interface IFbTrackingData {
  event_name: string,
  event_id: string,
  url: string,
  email: string,
  first_name?: string,
  last_name?: string,
  phone?: string,
  custom_data?: string,
  subscription_id?: string
}

export interface ILoginResult {
  user_name: string,
  user_id: string,
  token: string,
  account: string,
  upass_update: number,
  locale: 'tw' | 'us' | 'jp',
  subscribe: string,
  role: number,
  roleRaw: number,
  upload_map: object,
  upload_log_map: object,
  avatar: object,
  view_guide: number,
  email: string,
  new_user: number,
  complete: number,
}

export interface ILoginResponse {
  flag: number,
  data: ILoginResult
}
