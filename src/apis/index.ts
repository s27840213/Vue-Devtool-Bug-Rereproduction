import Axios from 'axios'

const options = {
  baseURL: `${process.env.VUE_APP_BASE_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}

const instance = Axios.create(options)

export default instance
