import type * as Api from '@/interfaces/api'
import Axios from 'axios'

const options = {
  baseURL: `${process.env.VUE_APP_UNSPLASH_BASE_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Version': 'v1',
    Authorization: `Client-ID ${process.env.VUE_APP_UNSPLASH_ACCESS_KEY}`
  }
}

const axios = Axios.create(options)

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
    vendor: 'Unsplash'
  }))
}

export default {
  getPopularPhoto: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage || 25,
      order_by: 'popular',
      lang: 'zh-TW'
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
      per_page: params.perPage || 25,
      query: params.query || 'random',
      order_by: params.orderBy || 'relevant',
      lang: 'zh-TW'
    }
    const { data } = await axios.request<Api.IUnsplashSearchResponse>({
      url: '/search/photos',
      method: 'GET',
      params: searchParams
    })
    return { results: normalized(data.results) }
  }
}
