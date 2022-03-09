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
  async getBrands(token?: string, teamId?: string): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios('/list-brand', {
      method: 'POST',
      data: {
        token: token ?? this.getToken(),
        team_id: teamId ?? this.getTeamId()
      }
    }))
  },
  async getTestingBrands(token: string): Promise<IBrand[]> {
    return new Promise<IBrand[]>(resolve => {
      setTimeout(() => resolve([brandkitUtils.createDefaultBrand()]), 1000)
    })
  },
  async updateBrands(token: string, locale: string, teamId: string, params: Partial<IBrandParams>): Promise<any> {
    // TODO: integrate API
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
    } else { // for testing (not implemented APIs)
      return { data: { flag: 0 } }
    }
    // return new Promise<any>(resolve => {
    //   setTimeout(() => resolve({ data: { flag: 1 } }), 1000)
    // })
  },
  updateBrandsWrapper(params: Partial<IBrandParams>, updater: () => void, fallbacker: () => void, errorShower: () => void) {
    this.updateBrands(this.getToken(), this.getLocale(), this.getUserId(), params)
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
