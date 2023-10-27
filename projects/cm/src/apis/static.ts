import axios from '@/apis'
import type { StaticResponse } from '@/types/api'
import apiUtils from '@nu/vivi-lib/utils/apiUtils'

export default new (class Utils {
  async getStatic() {
    return apiUtils.requestWithRetry(() => axios.request<StaticResponse>({
      url: '/get-charmix-static',
      method: 'GET',
    }))
  }
})()
