import type { ApiResponse } from '@/types/api'
import axios from '@nu/vivi-lib/apis'
import apiUtils from '@nu/vivi-lib/utils/apiUtils'
import type { AxiosResponse } from 'axios'

export default new (class Utils {
  async genImage(
    userId: string,
    requestId: string,
    prompt: string,
    action: string): Promise<AxiosResponse<ApiResponse<Record<string, never>>>> {
    return apiUtils.requestWithRetry(() => axios.request<ApiResponse<Record<string, never>>>({
      url: '/gen-image',
      method: 'POST',
      data: {
        user_id: userId,
        request_id: requestId,
        prompt,
        action,
      }
    }))
  }
})()
