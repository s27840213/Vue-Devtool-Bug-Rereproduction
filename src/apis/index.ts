import Axios from 'axios'

const options = {
  baseURL: `${process.env.VUE_APP_UNSPLASH_BASE_URL}`,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Version': 'v1',
    Authorization: `Client-ID ${process.env.VUE_APP_UNSPLASH_ACCESS_KEY}`
  }
}

const instance = Axios.create(options)

export default instance
