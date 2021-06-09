import axios from '@/apis'
import type * as Api from '@/interfaces/api'

export default {
  getPopularPhoto: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage || 15,
      order_by: 'popular',
      lang: 'zh-TW'
    }
    const { data } = await axios.request<Api.IUnsplashPhoto[]>({
      url: '/photos',
      method: 'GET',
      params: searchParams
    })
    return { results: data }
  },
  getPhotos: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage || 15,
      query: params.query || 'random',
      order_by: params.orderBy || 'relevant',
      lang: 'zh-TW'
    }
    const { data } = await axios.request<Api.IUnsplashSearchResponse>({
      url: '/search/photos',
      method: 'GET',
      params: searchParams
    })
    return data
  }
}
