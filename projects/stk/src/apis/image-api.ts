
import axios from '@/apis'
import authToken from '@/apis/auth-token'
import { IGetImageSize } from '@/interfaces/api'
import store from '@/store'
import { AxiosPromise } from 'axios'

export default new class {
  getImgSize(params: IGetImageSize): AxiosPromise {
    const { token, type, asset_index, team_id, asset_id, key_id, cache } = params
    return axios.request<void>({
      url: '/get-image-size',
      method: 'GET',
      params: {
        token: token || authToken().token,
        type,
        asset_index,
        team_id,
        asset_id,
        key_id,
        cache,
        ver: cache ? store.getters['user/getVerApi'] : null
      }
    })
  }
}()
