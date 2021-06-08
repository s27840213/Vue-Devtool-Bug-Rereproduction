import axios from '@/apis'
import { AxiosPromise } from 'axios'
import type * as Api from '@/interfaces/api'

export default {
  getRandomPhoto: (count: number): AxiosPromise => axios('/photos/random', {
    method: 'GET',
    params: {
      count: count
    }
  }),
  getPhotos: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage || 10,
      query: params.query || 'random',
      order_by: params.orderBy || 'relevant'
    }
    const { data } = await axios.request<Api.ISearchPhotoResponse>({
      url: '/search/photos',
      method: 'GET',
      params: searchParams
    })
    return data
  }
}
