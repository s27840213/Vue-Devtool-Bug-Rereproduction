import { nativeAPIUtils } from '@nu/shared-lib'

export interface IUserInfo {
  hostId: string
  appVer: string
  osVer: string
  isFirstOpen: boolean
  statusBarHeight: number
  homeIndicatorHeight: number
  country: string
  modelName: string
}

export interface IAlbum {
  albumId: string
  albumSize: number
  title: string
  thumbId: string
}

export interface IAlbumListResponse {
  flag: number
  msg?: string
  smartAlbum: IAlbum[]
  myAlbum: IAlbum[]
}

export interface IAlbumContentResponse {
  flag: number
  msg?: string
  content: string[]
  pageIndex: number
  nextPage?: number
}

export interface IIosResponse<T> {
  errorMsg: string
  eventId: string
  hasInternalError: boolean
  output: T
}

class WebViewUtils extends nativeAPIUtils<IUserInfo> {
  STANDALONE_USER_INFO: IUserInfo = {
    hostId: '',
    appVer: '100.0',
    osVer: '100.0',
    isFirstOpen: false,
    statusBarHeight: 0,
    homeIndicatorHeight: 0,
    country: '',
    modelName: 'web',
  }

  CALLBACK_MAPS = {}

  getUserInfoFromStore(): IUserInfo {
    return this.STANDALONE_USER_INFO
  }

  async getUserInfo(): Promise<IUserInfo> {
    // if (this.inBrowserMode) return this.getUserInfoFromStore()
    const userInfo = await this.callIOSAsAPI('APP_LAUNCH', this.getEmptyMessage())
    // if (!userInfo) return this.getDefaultUserInfo()
    // store.commit('webView/SET_userInfo', userInfo)
    // const appCaps = await fetch(`https://template.vivipic.com/static/appCaps.json?ver=${generalUtils.generateRandomString(6)}`)
    // const jsonCaps = await appCaps.json() as { review_ver: string }
    // store.commit('webView/UPDATE_detectIfInReviewMode', jsonCaps.review_ver)
    // this.sendStatistics(true, userInfo.country)
    return userInfo as IUserInfo
  }

  async getAlbumList(): Promise<IAlbumListResponse> {
    // if (this.inBrowserMode) return this.getUserInfoFromStore()
    const albumList = await this.callIOSAsAPI('GET_ALBUM_LIST', this.getEmptyMessage())

    return albumList as IAlbumListResponse
  }

  async getAlbumContent(albumId: string, pageIndex: number): Promise<IAlbumContentResponse> {
    // if (this.inBrowserMode) return this.getUserInfoFromStore()
    const albumList = await this.callIOSAsAPI('GET_ALBUM_CONTENT', {
      albumId,
      pageIndex,
    })

    return albumList as IAlbumContentResponse
  }

  async switchDomain(url: string): Promise<void> {
    // if (this.inBrowserMode) return this.getUserInfoFromStore()
    await this.callIOSAsAPI('SWITCH_DOMAIN', {
      url,
    })
  }
}

export default new WebViewUtils()
