import Axios from 'axios'

const options = {
  baseURL: `${process.env.VUE_APP_BASE_URL}`,
  headers: {
    Accept: 'text/plain',
    'Content-Type': 'text/plain'
  }
}

const instance = Axios.create(options)

export default instance
