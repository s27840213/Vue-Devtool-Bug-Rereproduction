import axios from '@/apis'
import { AxiosPromise } from 'axios'

export default {
  /* eslint-disable camelcase */
  getTemplateInfo: (token: string, type: string, key_id: string, query: string, data: string): AxiosPromise => axios('/update-design', {
    method: 'POST',
    data: {
      token,
      key_id,
      type,
      query,
      data
    }
  }),
  updateTemplateInfo: (token: string, type: string, key_id: string, query: string, data: string): AxiosPromise => axios('/update-design', {
    method: 'POST',
    data: {
      token,
      key_id,
      type,
      query,
      data
    }
  })
}
