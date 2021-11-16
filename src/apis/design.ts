import axios from '@/apis'
import { AxiosPromise } from 'axios'

const DEFAULT_RETRY_LIMIT = 3

export default {
  async requestWithRetry(api: () => AxiosPromise, retryLimit = DEFAULT_RETRY_LIMIT, retriedTimes = 0): Promise<any> {
    try {
      return await api()
    } catch (error) {
      console.log('design API failed:', error)
      if (retriedTimes >= retryLimit) {
        throw error
      }
      console.log(`retrying: ${retriedTimes + 1}/${retryLimit}`)
      return await new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve(this.requestWithRetry(api, retryLimit, retriedTimes + 1))
        }, 1000)
      })
    }
  },
  async getDesigns(token: string, path: string, folderOnly: boolean, sortByField: string, sortByDescending: boolean): Promise<any> {
    return await this.requestWithRetry(() => axios('/list-asset', {
      method: 'POST',
      data: {
        type: 'design',
        token,
        data: folderOnly ? 1 : 2,
        order_by: `${sortByField}:${sortByDescending ? 'desc' : 'asc'}`,
        path: path.replace('/', ',')
      }
    }))
  }
}
