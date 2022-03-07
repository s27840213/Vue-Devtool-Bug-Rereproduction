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
  async getBrands(token: string): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios('/list-brand', {
      method: 'POST',
      data: {
        token
      }
    }))
  },
  async getTestingBrands(token: string): Promise<IBrand[]> {
    return new Promise<IBrand[]>(resolve => {
      setTimeout(() => resolve([brandkitUtils.createDefaultBrand()]), 1000)
    })
  },
  async updateBrands(token: string, locale: string, teamId: string): Promise<any> {
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
    return { data: { flag: 0 } }
    // return new Promise<any>(resolve => {
    //   setTimeout(() => resolve({ data: { flag: 1 } }), 1000)
    // })
  },
  updateBrandsWrapper(params: Partial<IBrandParams>, updater: () => void, fallbacker: () => void, errorShower: () => void) {
    this.updateBrands(this.getToken(), this.getLocale(), this.getUserId())
      .then((response) => {
        if (response.data.flag !== 0) {
          fallbacker()
          errorShower()
        }
      }).catch((error) => {
        console.error(error)
        fallbacker()
        errorShower()
      })
    updater()
  }
}
