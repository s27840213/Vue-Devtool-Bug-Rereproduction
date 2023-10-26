import Axios from 'axios'

const options = {
  baseURL: 'https://apiv2.vivipic.com/',
  headers: {
    Accept: 'text/plain',
    'Content-Type': 'text/plain'
  }
}

const instance = Axios.create(options)

export default instance
