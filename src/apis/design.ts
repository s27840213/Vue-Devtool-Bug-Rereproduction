import axios from '@/apis'
import apiUtils from '@/utils/apiUtils'

export default {
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
  }
}
