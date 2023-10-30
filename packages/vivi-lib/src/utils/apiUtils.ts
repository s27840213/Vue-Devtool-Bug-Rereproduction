import { AxiosPromise } from 'axios'

const DEFAULT_RETRY_LIMIT = 3

class ApiUtils {
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
  }
}

export default new ApiUtils()
