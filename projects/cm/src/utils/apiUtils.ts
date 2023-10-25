import type { AxiosPromise } from 'axios'

const DEFAULT_RETRY_LIMIT = 3

class ApiUtils {
  async requestWithRetry<T>(api: () => AxiosPromise<T>, retryLimit = DEFAULT_RETRY_LIMIT, retriedTimes = 0): Promise<AxiosPromise<T>> {
    try {
      return await api()
    } catch (error) {
      console.log('design API failed:', error)
      if (retriedTimes >= retryLimit) {
        throw error
      }
      console.log(`retrying: ${retriedTimes + 1}/${retryLimit}`)
      return await new Promise<AxiosPromise<T>>((resolve) => {
        setTimeout(() => {
          resolve(this.requestWithRetry(api, retryLimit, retriedTimes + 1))
        }, 1000)
      })
    }
  }
}

export default new ApiUtils()
