export interface IUserInfo {
  hostId: string,
  appVer: string,
  osVer: string,
  locale: string,
  isFirstOpen: boolean,
  statusBarHeight: number,
  homeIndicatorHeight: number,
  modelName: string,
  userId?: string,
  country?: string,
  statusBarColor?: string, // not used in frontend, so not creating new interface for it.
}

export type WEBVIEW_API_RESULT = { [key: string]: any } | null | undefined // 'null' is for timeouted or error occurred, while 'undefined' means no result.

export interface ICallbackRecord {
  name: string,
  id: string,
  args: any[]
}
