/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/apis'
import apiUtils from '@/utils/apiUtils'
import store from '@/store'
import { IBrand, IBrandParams } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'
import i18n from '@/i18n'
import logUtils from '@/utils/logUtils'

export default {
  getToken(): string {
    return store.getters['user/getToken']
  },
  getLocale(): string {
    return i18n.global.locale
  },
  getUserId(): string {
    return store.getters['user/getUserId']
  },
  getTeamId(): string {
    return store.getters['user/getTeamId']
  },
  async sendApi(url: string, data: { [key: string]: any }): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios(url, {
      method: 'POST',
      data
    }))
  },
  async getBrands(token?: string, teamId?: string): Promise<any> {
    return await this.sendApi('/list-brand', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId()
    })
  },
  async getLogos(brandId: string, token?: string, teamId?: string, params = {}): Promise<any> {
    return await this.sendApi('/list-logo', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId(),
      brand_id: brandId,
      ...params
    })
  },
  async getPalettes(brandId: string, token?: string, teamId?: string, params = {}): Promise<any> {
    return await this.sendApi('/list-palette', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId(),
      brand_id: brandId,
      ...params
    })
  },
  async getFonts(token?: string, teamId?: string, params = {}): Promise<any> {
    return await this.sendApi('/list-asset', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId(),
      type: 'font',
      ...params
    })
  },
  async getAsset(type: string, assetIndex: string, token?: string, teamId?: string): Promise<any> {
    return await this.sendApi('/list-asset', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId(),
      type,
      asset_list: assetIndex
    })
  },
  async getFont(assetIndex: string, token?: string, teamId?: string): Promise<any> {
    return await this.getAsset('font', assetIndex, token, teamId)
  },
  async getLogo(assetIndex: string, token?: string, teamId?: string): Promise<any> {
    return await this.getAsset('logo', assetIndex, token, teamId)
  },
  async deleteAsset(type: string, assetIndex: string, token?: string, locale?: string, teamId?: string): Promise<any> {
    return await this.sendApi('/update-asset', {
      type,
      token: token ?? this.getToken(),
      locale: locale ?? this.getLocale(),
      team_id: teamId ?? this.getTeamId(),
      update_type: 'delete',
      target: 1,
      src_asset: assetIndex
    })
  },
  async deleteFont(assetIndex: string, token?: string, locale?: string, teamId?: string): Promise<any> {
    return await this.deleteAsset('font', assetIndex, token, locale, teamId)
  },
  async deleteLogo(assetIndex: string, token?: string, locale?: string, teamId?: string): Promise<any> {
    return await this.deleteAsset('logo', assetIndex, token, locale, teamId)
  },
  async getTestingBrands(token: string): Promise<IBrand[]> {
    return new Promise<IBrand[]>(resolve => {
      setTimeout(() => resolve([brandkitUtils.createDefaultBrand()]), 1000)
    })
  },
  async updateBrands(token: string, locale: string, teamId: string, params: Partial<IBrandParams>): Promise<any> {
    if (params.type) {
      return await apiUtils.requestWithRetry(() => {
        const payload: any = {
          method: 'POST',
          data: {
            token,
            locale,
            team_id: teamId
          }
        }
        Object.assign(payload.data, params)
        return axios('/update-brand', payload)
      })
      // return new Promise<any>(resolve => {
      //   setTimeout(() => resolve({ data: { flag: 1 } }), 1000)
      // })
    } else { // for testing (not implemented APIs)
      return { data: { flag: 0 } }
      // return new Promise<any>(resolve => {
      //   setTimeout(() => resolve({ data: { flag: 1 } }), 1000)
      // })
    }
  },
  async updateApiWrapper(apiSender: () => Promise<any>, updater: () => void, fallbacker: () => void, errorShower: (msg?: string) => void, responseHandler?: (response: any) => void): Promise<boolean> {
    updater()
    try {
      const response = await apiSender()
      if (response.data.flag !== 0) {
        fallbacker()
        errorShower(response.data.msg)
        return false
      }
      if (responseHandler) {
        responseHandler(response.data)
      }
    } catch (error) {
      logUtils.setLogForError(error as Error)
      fallbacker()
      errorShower((error as Error).message)
      return false
    }
    return true
  },
  async updateBrandsWrapper(params: Partial<IBrandParams>, updater: () => void, fallbacker: () => void, errorShower: (msg?: string) => void, responseHandler?: (response: any) => void): Promise<boolean> {
    return await this.updateApiWrapper(async () => {
      return await this.updateBrands(this.getToken(), this.getLocale(), this.getUserId(), params)
    }, updater, fallbacker, errorShower, responseHandler)
  }
}
