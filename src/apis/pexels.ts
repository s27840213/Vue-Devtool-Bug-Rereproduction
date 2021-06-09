import Axios, { AxiosPromise } from 'axios'
import type * as Api from '@/interfaces/api'

const options = {
  baseURL: `${process.env.VUE_APP_PEXELS_BASE_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: process.env.VUE_APP_PEXELS_ACCESS_KEY
  }
}

const axios = Axios.create(options)

function normalized (photos: Api.IPexelsPhoto[]): Api.IUnsplashPhoto[] {
  return photos.map(photo => ({
    width: photo.width,
    height: photo.height,
    id: `${photo.id}`,
    urls: {
      full: photo.src.original,
      raw: photo.src.medium,
      regular: photo.src.portrait,
      small: photo.src.small,
      thumb: photo.src.small
    }
  }))
}

export default {
  getCuratedPhoto: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage || 15,
      locale: 'zh-TW'
    }
    const { data } = await axios.request<Api.IPexelsSearchResponse>({
      url: '/curated',
      method: 'GET',
      params: searchParams
    })
    return { results: normalized(data.photos) }
  },
  getPhotos: async (params: Api.ISearchPhotoParams) => {
    const searchParams = {
      page: params.page || 1,
      per_page: params.perPage || 15,
      query: params.query || 'random',
      locale: 'zh-TW'
    }
    const { data } = await axios.request<Api.IPexelsSearchResponse>({
      url: '/search',
      method: 'GET',
      params: searchParams
    })
    return { results: normalized(data.photos) }
  }
}
