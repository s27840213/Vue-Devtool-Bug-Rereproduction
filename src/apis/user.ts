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
      password,
      ver: '2'
    }
  }),
  putAssets: (assetId: string, categoryId: string): AxiosPromise => axios(`/put-asset/${assetId}/${categoryId}`, {
    method: 'POST',
    data: {
    }
  }),
  deleteAssets: (token: string, keyList: string): AxiosPromise => axios('/delete-asset', {
    method: 'POST',
    data: {
      token,
      key_list: keyList
    }
  }),
  register: (token: string, meta: string): AxiosPromise => axios('/register', {
    method: 'POST',
    data: {
      token,
      meta
    }
  }),
  /* eslint-disable camelcase */
  sendVcode: (uname: string, account: string, upass: string, register: string, vcode_only: string): AxiosPromise => axios('/send-vcode', {
    method: 'POST',
    data: {
      uname,
      account,
      upass,
      register,
      vcode_only
    }
  }),
  verifyVcode: (account: string, vcode: string): AxiosPromise => axios('/verify-vcode', {
    method: 'POST',
    data: {
      account,
      vcode
    }
  }),
  resetPassword: (token: string, account: string, upass: string): AxiosPromise => axios('/reset-password', {
    method: 'POST',
    data: {
      token,
      account,
      upass
    }
  }),
  fbLogin: (code: string, redirect_uri: string): AxiosPromise => axios('/fb-login', {
    method: 'POST',
    data: {
      code,
      redirect_uri
    }
  }),
  googleLogin: (id_token: string): AxiosPromise => axios('/google-login', {
    method: 'POST',
    data: {
      id_token
    }
  })
}
