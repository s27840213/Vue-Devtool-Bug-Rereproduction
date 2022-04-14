/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from '@/apis'
import apiUtils from '@/utils/apiUtils'
import store from '@/store'
import { IBrand, IBrandParams } from '@/interfaces/brandkit'
import brandkitUtils from '@/utils/brandkitUtils'

export default {
  getToken(): string {
    return store.getters['user/getToken']
  },
  getLocale(): string {
    return store.getters['user/getLocale']
  },
  getUserId(): string {
    return store.getters['user/getUserId']
  },
  getTeamId(): string {
    return store.getters['user/getTeamId']
  },
  async sendApi(url: string, data: {[key: string]: any}): Promise<any> {
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
  async getLogos(brandId: string, token?: string, teamId?: string): Promise<any> {
    return await this.sendApi('/list-logo', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId(),
      brand_id: brandId
    })
  },
  async getPalettes(brandId: string, token?: string, teamId?: string): Promise<any> {
    return await this.sendApi('/list-palette', {
      token: token ?? this.getToken(),
      team_id: teamId ?? this.getTeamId(),
      brand_id: brandId
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
  async updateBrandsWrapper(params: Partial<IBrandParams>, updater: () => void, fallbacker: () => void, errorShower: () => void, responseHandler?: (response: any) => void): Promise<boolean> {
    updater()
    try {
      const response = await this.updateBrands(this.getToken(), this.getLocale(), this.getUserId(), params)
      if (response.data.flag !== 0) {
        fallbacker()
        errorShower()
        return false
      }
      if (responseHandler) {
        responseHandler(response.data)
      }
    } catch (error) {
      console.error(error)
      fallbacker()
      errorShower()
      return false
    }
    return true
  }
}
