import type { ApiResponse, GenImageParams } from '@/types/api'
import axios from '@nu/vivi-lib/apis'
import apiUtils from '@nu/vivi-lib/utils/apiUtils'
import type { AxiosResponse } from 'axios'

type IGenImageV3Response = ApiResponse<{
  urls: { expire: string; url: string }[]
  ai_credit: number
}>

export default new (class Utils {
  async genImage(
    userId: string,
    requestId: string,
    token: string,
    params: GenImageParams,
    num: number,
    us: boolean,
  ): Promise<AxiosResponse<IGenImageV3Response>> {
    return apiUtils.requestWithRetry(() =>
      axios.request<IGenImageV3Response>({
        url: '/gen-image-v3',
        method: 'POST',
        data: {
          user_id: userId,
          request_id: requestId,
          token,
          ...params,
          num,
          us: us ? '1' : '0',
          accelerate: '1',
        },
      }),
    )
  }
})()
