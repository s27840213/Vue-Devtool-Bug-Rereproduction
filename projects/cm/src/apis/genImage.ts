import type { ApiResponse } from '@/types/api'
import axios from '@nu/vivi-lib/apis'
import apiUtils from '@nu/vivi-lib/utils/apiUtils'
import type { AxiosResponse } from 'axios'

export default new (class Utils {
  async genImage(
    userId: string,
    requestId: string,
    prompt: string,
    action: string): Promise<AxiosResponse<ApiResponse<{ url: { expire: string, url: string } }>>> {
    return apiUtils.requestWithRetry(() => axios.request<ApiResponse<{ url: { expire: string, url: string } }>>({
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
