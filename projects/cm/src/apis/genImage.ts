import type { ApiResponse, GenImageParams } from '@/types/api'
import axios from '@nu/vivi-lib/apis'
import apiUtils from '@nu/vivi-lib/utils/apiUtils'
import type { AxiosResponse } from 'axios'

type IGenImageV2Response = ApiResponse<{
  urls: { expire: string; url: string }[]
}>

export default new (class Utils {
  async genImage(
    userId: string,
    requestId: string,
    params: GenImageParams,
    num: number,
    us: boolean,
  ): Promise<AxiosResponse<IGenImageV2Response>> {
    return apiUtils.requestWithRetry(() =>
      axios.request<IGenImageV2Response>({
        url: '/gen-image-v2',
        method: 'POST',
        data: {
          user_id: userId,
          request_id: requestId,
          ...params,
          num,
          us: us ? '1' : '0',
        },
      }),
    )
  }
})()
