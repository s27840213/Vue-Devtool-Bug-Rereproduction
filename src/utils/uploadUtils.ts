import store from '@/store'

class UploadUtils {
  loginOutput: any
  token: string

  constructor() {
    this.token = ''
  }

  setLoginOutput(loginOutput: any) {
    this.loginOutput = loginOutput
    this.getTmpJSON()
  }

  setToken(token: string) {
    this.token = token
  }

  uploadJSON() {
    const assetId = this.generateAssetId()

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_map.path}edit/temp.json`)
    formData.append('Content-Disposition', `attachment filename*=UTF-8''${encodeURIComponent('temp.json')}`)
    const xhr = new XMLHttpRequest()

    setInterval(() => {
      const pagesJSON = store.getters.getPages
      console.log(pagesJSON)
      const blob = new Blob([JSON.stringify(pagesJSON)], { type: 'application/json' })
      if (formData.has('file')) {
        console.log(blob)
        formData.set('file', blob)
      } else {
        console.log(blob)
        formData.append('file', blob)
      }

      xhr.open('POST', this.loginOutput.upload_map.url, true)
      xhr.send(formData)
      xhr.onload = function () {
        console.log(this)
      }
    }, 5000)
  }

  async getTmpJSON() {
    this.loginOutput.download_url = this.loginOutput.download_url.replace('*', 'edit/temp.json')
    console.log(this.loginOutput.download_url)
    const response = await fetch(this.loginOutput.download_url)
    response.json().then((json) => {
      console.log(json)
      // store.commit('SET_pages', json)
    })
  }

  generateAssetId() {
    const date = new Date()
    const year = this.formatStr((date.getFullYear() - 2000).toString(), 2)
    const month = this.formatStr((date.getMonth() + 1).toString(), 2)
    const _date = this.formatStr((date.getDate()).toString(), 2)
    const hours = this.formatStr((date.getHours()).toString(), 2)
    const mins = this.formatStr((date.getMinutes()).toString(), 2)
    const sec = this.formatStr((date.getSeconds()).toString(), 2)
    const msec = this.formatStr((date.getMilliseconds()).toString(), 3)
    return year + month + _date + hours + mins + sec + msec + this.generateRandomString(8)
  }

  generateRandomString(length: number) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength))
    }
    return result
  }

  formatStr(str: string, len: number) {
    if (str.length === len) {
      return str
    } else {
      const diff = len - str.length
      const complement = new Array(diff).fill(0).join('')
      return complement + str
    }
  }
}

const uploadUtils = new UploadUtils()
export default uploadUtils
