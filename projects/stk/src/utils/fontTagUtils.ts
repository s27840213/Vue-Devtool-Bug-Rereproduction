import axios from '@nu/vivi-lib/apis'
import localeUtils from './localeUtils'
import store from '@/store'
import { IListServiceResponse } from '@nu/vivi-lib/interfaces/api'

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
    return axios.request<IListServiceResponse>({
      url: '/list-design',
      method: 'GET',
      params
    })
  }
}

export default new FontTagUtils()
