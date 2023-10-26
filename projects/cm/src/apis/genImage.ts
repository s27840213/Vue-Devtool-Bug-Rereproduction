import axios from '@/apis'
import type { ApiResponse } from '@/types/api'
import apiUtils from '@/utils/apiUtils'

export default new (class Utils {
  async genImage(userId: string, requestId: string, prompt: string, action: string) {
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
