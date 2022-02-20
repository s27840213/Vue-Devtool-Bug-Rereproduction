import axios from '@/apis'
import apiUtils from '@/utils/apiUtils'
import store from '@/store'
import { IBrand } from '@/interfaces/brandkit'
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
  async getBrands(token: string): Promise<any> {
    // TODO: integrate API
    // return await apiUtils.requestWithRetry(() => axios('/list-asset', {
    //   method: 'POST',
    //   data: {
    //     type: 'design',
    //     token,
    //     data,
    //     order_by: `${sortByField}:${sortByDescending ? 'desc' : 'asc'}`,
    //     path: path,
    //     ...params
    //   }
    // }))
  },
  async getTestingBrands(token: string): Promise<IBrand[]> {
    return new Promise<IBrand[]>(resolve => {
      setTimeout(() => resolve([brandkitUtils.createDefaultBrand()]), 1000)
    })
  },
  async updateBrands(token: string, locale: string, teamId: string, updateType: string, srcAsset: string | null, srcFolder: string | null, target: string): Promise<any> {
    // TODO: integrate API
    // return await apiUtils.requestWithRetry(() => {
    //   const payload: any = {
    //     method: 'POST',
    //     data: {
    //       type: 'design',
    //       token,
    //       locale,
    //       team_id: teamId,
    //       update_type: updateType,
    //       target
    //     }
    //   }
    //   if (srcAsset != null) payload.data.src_asset = srcAsset
    //   if (srcFolder != null) payload.data.src_folder = srcFolder
    //   return axios('/update-asset', payload)
    // })
  }
}
