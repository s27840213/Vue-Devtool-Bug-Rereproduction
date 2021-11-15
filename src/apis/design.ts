import axios from '@/apis'
import { AxiosPromise } from 'axios'

export default {
  getDesigns: (token: string, path: string, folderOnly: boolean, sortByField: string, sortByDescending: boolean): AxiosPromise => axios('/list-asset', {
    method: 'POST',
    data: {
      type: 'design',
      token,
      data: folderOnly ? 1 : 2,
      order_by: `${sortByField}:${sortByDescending ? 'desc' : 'asc'}`,
      path: path.replace('/', ',')
    }
  })
}
