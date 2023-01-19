import axios from '@/apis'
import apiUtils from '@/utils/apiUtils'
import store from '@/store'
import { IDesign, IFolder } from '@/interfaces/design'
import i18n from '@/i18n'

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
  getAssetIndex(design: IDesign): string {
    return design.asset_index.toString()
  },
  getAssetIndices(designs: IDesign[]): string {
    return designs.map((design) => this.getAssetIndex(design)).join(',')
  },
  getFolderIds(folders: IFolder[]): string {
    return folders.map((folder) => folder.id).join(',')
  },
  async getDesign(teamId: string, assetId: string): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios('/list-asset', {
      method: 'POST',
      data: {
        token: this.getToken(),
        type: 'design',
        team_id: teamId,
        asset_id: assetId
      }
    }))
  },
  async getDesigns(token: string, path: string, data: number, sortByField: string, sortByDescending: boolean, params: { [key: string]: any } = {}): Promise<any> {
    return await apiUtils.requestWithRetry(() => axios('/list-asset', {
      method: 'POST',
      data: {
        type: 'design',
        token,
        data,
        order_by: `${sortByField}:${sortByDescending ? 'desc' : 'asc'}`,
        path: path,
        ...params
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
