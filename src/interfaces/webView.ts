export interface IUserInfo {
  hostId: string,
  appVer: string,
  osVer: string,
  locale: string,
  isFirstOpen: boolean
}

export interface ILoginResult {
  user_name: string,
  user_id: string,
  token: string,
  account: string,
  upass_update: number,
  locale: string,
  subscribe: string,
  role: number,
  roleRaw: number,
  upload_map: object,
  upload_log_map: object,
  avatar: object,
  view_guide: number,
  email: string,
  new_user: number
}
