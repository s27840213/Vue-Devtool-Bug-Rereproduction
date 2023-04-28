export interface IUserInfo {
  hostId: string,
  appVer: string,
  osVer: string,
  locale: string,
  isFirstOpen: boolean,
  statusBarHeight: number,
  homeIndicatorHeight: number,
  country?: string
}

export type WEBVIEW_API_RESULT = { [key: string]: any } | null | undefined
