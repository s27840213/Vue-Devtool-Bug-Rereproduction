import axios from '@/apis'
import { AxiosPromise } from 'axios'

export default {
  getRandomPhoto: (count: number): AxiosPromise => axios('/photos/random', {
    method: 'GET',
    params: {
      count: count
    }
  })
}
