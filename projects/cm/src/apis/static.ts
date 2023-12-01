import type { StaticResponse } from '@/types/api'
import axios from '@nu/vivi-lib/apis'
import apiUtils from '@nu/vivi-lib/utils/apiUtils'
import type { AxiosResponse } from 'axios'

export default new (class Utils {
  async getStatic(): Promise<AxiosResponse<StaticResponse>> {
    return apiUtils.requestWithRetry(() => axios.request<StaticResponse>({
      url: '/get-charmix-static',
      method: 'GET',
      params: {
        us: 1
      },
    }))
  }
})()
