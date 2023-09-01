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

export type WEBVIEW_API_RESULT = { [key: string]: any } | null | undefined // 'null' is for timeouted or error occurred, while 'undefined' means no result.

export interface ICallbackRecord {
  name: string,
  id: string,
  args: any[]
}
