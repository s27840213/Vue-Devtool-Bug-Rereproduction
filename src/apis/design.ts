import axios from '@/apis'
import apiUtils from '@/utils/apiUtils'
import store from '@/store'
import { IDesign } from '@/interfaces/design'

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
  getAssetIndex(design: IDesign): string {
    return design.asset_index.toString()
  },
  getAssetIndices(designs: IDesign[]): string {
    return designs.map((design) => this.getAssetIndex(design)).join(',')
  },
  async getDesigns(token: string, path: string, folderOnly: boolean, sortByField: string, sortByDescending: boolean): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios('/list-asset', {
      method: 'POST',
      data: {
        type: 'design',
        token,
        data: folderOnly ? 1 : 2,
        order_by: `${sortByField}:${sortByDescending ? 'desc' : 'asc'}`,
        path: path
      }
    }))
  },
  async updateDesigns(token: string, locale: string, teamId: string, updateType: string, srcAsset: string | null, srcFolder: string | null, target: string): Promise<any> {
    return await apiUtils.requestWithRetry(() => {
      const payload: any = {
        method: 'POST',
        data: {
          type: 'design',
          token,
          locale,
          team_id: teamId,
          update_type: updateType,
          target
        }
      }
      if (srcAsset != null) payload.data.src_asset = srcAsset
      if (srcFolder != null) payload.data.src_folder = srcFolder
      return axios('/update-asset', payload)
    })
  }
}
