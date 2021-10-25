import type * as Api from '@/interfaces/api'
import Axios from 'axios'

const options = {
  baseURL: `${process.env.VUE_APP_UNSPLASH_BASE_URL}`
}

const axios = Axios.create(options)
const REGEX_JAPANESE = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f]/

function normalized (photos: Api.IUnsplashPhoto[]): Api.IPhoto[] {
  return photos.map(photo => ({
    width: photo.width,
    height: photo.height,
    id: `${photo.id}`,
    user: {
      name: photo.user.name,
      link: photo.user.links.html
    },
    tags: photo.tags?.map((tag: any) => tag.title) || [],
    urls: { ...photo.urls },
    vendor: 'unsplash'
  }))
}

export default {
  getPopularPhoto: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage,
      order_by: 'popular',
      lang: 'zh-TW',
      client_id: process.env.VUE_APP_UNSPLASH_ACCESS_KEY
    }
    const { data } = await axios.request<Api.IUnsplashPhoto[]>({
      url: '/photos',
      method: 'GET',
      params: searchParams
    })
    return { results: normalized(data) }
  },
  getPhotos: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage,
      query: params.query || 'random',
      order_by: params.orderBy || 'relevant',
      lang: 'zh-TW',
      client_id: process.env.VUE_APP_UNSPLASH_ACCESS_KEY
    }
    if (REGEX_JAPANESE.test(params.query)) {
      searchParams.lang = 'ja'
    }
    const { data } = await axios.request<Api.IUnsplashSearchResponse>({
      url: '/search/photos',
      method: 'GET',
      params: searchParams
    })
    return { results: normalized(data.results) }
  }
}
