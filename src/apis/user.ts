/* eslint-disable camelcase */
import axios from '@/apis'
import { IGroupDesignInputParams, IUpdateAssetParams } from '@/interfaces/api'
import { AxiosPromise } from 'axios'

export default {
  getAllAssets: (token: string, attrs = {}): AxiosPromise => axios('/list-asset', {
    method: 'POST',
    data: {
      token,
      ...attrs
    }
  }),
  login: (token: string, account: string, password: string): AxiosPromise => axios('/login', {
    method: 'POST',
    data: {
      token,
      account,
      password
    }
  }),
  /**
   *
   * @param token
   * @param teamId
   * @param assetId
   * @param type - 0 for update db, 1 for update prev, 2 for update both
   * @returns
   */
  // eslint-disable-next-line camelcase
  putAssetDesign: (token: string, team_id: string, asset_id: string, type: number): AxiosPromise => axios('/put-asset-design', {
    method: 'POST',
    data: {
      token,
      team_id,
      asset_id,
      type
    }
  }),
  deleteAssets: (token: string, keyList: string): AxiosPromise => axios('/delete-asset', {
    method: 'POST',
    data: {
      token,
      key_list: keyList
    }
  }),
  updateAsset: (params: IUpdateAssetParams): AxiosPromise => axios('/update-asset', {
    method: 'POST',
    data: {
      ...params
    }
  }),
  groupDesign: (params: IGroupDesignInputParams): AxiosPromise => axios('/group-design', {
    method: 'POST',
    data: {
      ...params
    }
  }),
  register: (token: string, meta: string): AxiosPromise => axios('/register', {
    method: 'POST',
    data: {
      token,
      meta
    }
  }),
  /* eslint-disable camelcase */
  sendVcode: (uname: string, account: string, upass: string, register: string, vcode_only: string, type: number, token: string, locale: string): AxiosPromise => axios('/send-vcode', {
    method: 'POST',
    data: {
      uname,
      account,
      upass,
      register,
      vcode_only,
      type,
      token,
      locale
    }
  }),
  verifyVcode: (account: string, vcode: string, token: string): AxiosPromise => axios('/verify-vcode', {
    method: 'POST',
    data: {
      account,
      vcode,
      token
    }
  }),
  updateUser: (token: string, account: string, upass: string, uname: string, locale: string, subscribe: number): AxiosPromise => axios('/update-user', {
    method: 'POST',
    data: {
      token,
      account,
      upass,
      uname,
      locale,
      subscribe
    }
  }),
  fbLogin: (code: string, redirect_uri: string): AxiosPromise => axios('/fb-login', {
    method: 'POST',
    data: {
      code,
      redirect_uri
    }
  }),
  googleLogin: (code: string, redirect_uri: string): AxiosPromise => axios('/google-login', {
    method: 'POST',
    data: {
      code,
      redirect_uri
    }
  }),
  updateUserViewGuide: (token: string, view_guide: number): AxiosPromise => axios('/update-user', {
    method: 'POST',
    data: {
      token,
      view_guide
    }
  })
}
