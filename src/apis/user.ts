import axios from '@/apis'
import { AxiosPromise } from 'axios'

export default {
  getAssets: (token: string): AxiosPromise => axios('/list-asset', {
    method: 'POST',
    data: {
      token
    }
  }),
  login: (token: string, account: string, password: string): AxiosPromise => axios('/login', {
    method: 'POST',
    data: {
      token,
      account,
      password
    }
  }),
  putAssets: (assetId: string, categoryId: string): AxiosPromise => axios(`/put-asset/${assetId}/${categoryId}`, {
    method: 'POST',
    data: {
    }
  }),
  register: (token: string, meta: string): AxiosPromise => axios('/register', {
    method: 'POST',
    data: {
      token,
      meta
    }
  })
}
