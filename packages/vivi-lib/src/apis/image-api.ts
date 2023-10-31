
import axios from '@/apis'
import authToken from './auth-token'
import { AxiosPromise } from 'axios'
import { IGetImageSize } from '@/interfaces/api'
import store from '@/store'

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
