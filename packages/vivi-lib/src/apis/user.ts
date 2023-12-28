import axios from '@/apis'
import i18n from '@/i18n'
import { IGetTxInfoParams, IGetTxInfoResponse, IGroupDesignInputParams, IUpdateAssetParams } from '@/interfaces/api'
import { SrcObj } from '@/interfaces/gallery'
import store from '@/store'
import apiUtils from '@/utils/apiUtils'
import generalUtils from '@/utils/generalUtils'
import { AxiosPromise } from 'axios'

export default {
  getToken(): string {
    return store.getters['user/getToken']
  },
  getLocale(): string {
    return i18n.global.locale
  },
  getTeamId(): string {
    return store.getters['user/getTeamId']
  },
  getAllAssets: (token: string, attrs = {}): AxiosPromise => axios('/list-asset', {
    method: 'POST',
    data: {
      token,
      team_id: store.getters['user/getTeamId'],
      ...attrs
    }
  }),
  login(token: string, account: string, password: string): AxiosPromise {
    const loginUrl = generalUtils.isPic ? '/login' : '/login-charmix'
    return axios(loginUrl, {
      method: 'POST',
      data: {
        token,
        account,
        password,
        locale: this.getLocale()
      }
    })
  },
  deleteAccount(): AxiosPromise {
    return axios('/delete-account', {
      method: 'POST',
      data: {
        token: this.getToken(),
      }
    })
  },
  /**
   *
   * @param token
   * @param teamId
   * @param assetId
   * @param type - 0 for update db, 1 for update prev, 2 for update both
   * @returns
   */
  putAssetDesign: (token: string, team_id: string, asset_id: string, type: number, wait?: number): AxiosPromise => axios('/put-asset-design', {
    method: 'POST',
    data: {
      token,
      team_id,
      asset_id,
      type,
      ...(wait !== undefined && { wait })
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
  verifyVcode: (account: string, vcode: string, token: string, type: number, locale: string): AxiosPromise => axios('/verify-vcode', {
    method: 'POST',
    data: {
      account,
      vcode,
      token,
      type,
      locale,
      campaign: localStorage.getItem('campaign') || undefined
    }
  }),
  updateUser: (token: string, account: string, upass: string, uname: string, locale: string, subscribe: number, country: string, device: number, app: number): AxiosPromise => axios('/update-user', {
    method: 'POST',
    data: {
      token,
      account,
      upass,
      uname,
      locale,
      subscribe,
      country,
      device,
      app,
    }
  }),
  registerSticker: (host_id: string, uuid: string, device: number, country: string, app: number): AxiosPromise => axios('/register-sticker', {
    method: 'POST',
    data: {
      host_id,
      uuid,
      device,
      country,
      app
    }
  }),
  fbLogin: (code: string, redirect_uri: string, locale: string): AxiosPromise => axios('/fb-login', {
    method: 'POST',
    data: {
      code,
      redirect_uri,
      locale,
      campaign: localStorage.getItem('campaign') || undefined
    }
  }),
  googleLogin: (code: string, redirect_uri: string, locale: string): AxiosPromise => axios('/google-login', {
    method: 'POST',
    data: {
      code,
      redirect_uri,
      locale,
      campaign: localStorage.getItem('campaign') || undefined
    }
  }),
  updateUserViewGuide: (token: string, view_guide: number): AxiosPromise => axios('/update-user', {
    method: 'POST',
    data: {
      token,
      view_guide
    }
  }),
  async removeBg(srcObj: SrcObj, aspect?: number): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios('/remove-bg', {
      method: 'POST',
      data: {
        token: this.getToken(),
        locale: this.getLocale(),
        src_obj: srcObj,
        team_id: this.getTeamId(),
        ...(aspect !== undefined && { aspect }),
        debug: location.protocol === 'http:' ? 1 : 0,
      }
    }))
  },
  async removeBgStk(uuid: string, assetId?: number, type = 'stk-bg-remove'): Promise<any> {
    const typeMap: {[index: string]: string} = {
      'stk-bg-remove': 'bg',
      'stk-bg-remove-face': 'bgf'
    }
    return await apiUtils.requestWithRetry(() => axios('/remove-bg-sticker', {
      method: 'POST',
      data: {
        path: `removebg/${uuid}/${assetId}/${typeMap[type]}`,
        locale: this.getLocale(),
      }
    }))
  },
  // https://www.notion.so/vivipic/get-tx-info-api-d90d7f64e05946ea8ceaec615d51094f
  async getTxInfo(params: IGetTxInfoParams): Promise<AxiosPromise<IGetTxInfoResponse>> {
    return await apiUtils.requestWithRetry<IGetTxInfoResponse>(() => axios('/get-tx-info', {
      method: 'POST',
      data: {
        ...params,
        token: params.token || store.getters['user/getGetTxToken']
      }
    }))
  }
}
