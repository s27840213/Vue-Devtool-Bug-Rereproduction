import axios from '@/apis'
import localeUtils from './localeUtils'
import store from '@/store'

class FontTagUtils {
  getFontTags() {
    const params = {
      token: '1',
      locale: localeUtils.currLocale(),
      type: 'fonttag',
      cache: true,
      platform: window.location.host,
      ver: store.getters['user/getVerApi']
    }
    return axios.request<{
      data: {
        content: string[]
      }
      flag: number
    }>({
      url: '/list-design',
      method: 'GET',
      params
    })
  }
}

export default new FontTagUtils()
