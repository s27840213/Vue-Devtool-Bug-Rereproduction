import store from '@/store'
import text from '@/store/text'
import generalUtils from './generalUtils'
import LayerUtils from './layerUtils'

class UploadUtils {
  loginOutput: any
  token: string

  constructor() {
    this.token = ''
  }

  setLoginOutput(loginOutput: any) {
    this.loginOutput = loginOutput
    // this.getTmpJSON()
  }

  setToken(token: string) {
    this.token = token
  }

  uploadText() {
    const designId = this.generateRandomString(20)
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    LayerUtils.updateLayerProps(currSelectedInfo.pageIndex, currSelectedInfo.index, {
      designId: designId
    })

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}text/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment filename*=UTF-8''${encodeURIComponent('config.json')}`)
    const xhr = new XMLHttpRequest()

    const textInfo = Object.assign(generalUtils.deepCopy(currSelectedInfo.layers[0]), { active: false })

    console.log(textInfo)

    const blob = new Blob([JSON.stringify(textInfo)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)
    xhr.onload = () => {
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      const pageJSON = generalUtils.deepCopy(store.getters.getPage(currSelectedInfo.pageIndex))
      pageJSON.layers = pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)

      console.log(pageJSON)
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_admin_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_admin_map.path}text/${designId}/page.json`)
      // only for template
      formData.append('Content-Disposition', `attachment filename*=UTF-8''${encodeURIComponent('page.json')}`)
      const xhrReq = new XMLHttpRequest()

      const textInfo = Object.assign(generalUtils.deepCopy(currSelectedInfo.layers[0]), { active: false })

      const blob = new Blob([JSON.stringify(textInfo)], { type: 'application/json' })
      formData.append('file', blob)

      xhrReq.open('POST', this.loginOutput.upload_admin_map.url, true)
      xhrReq.send(formData)
      xhrReq.onload = () => {
        console.log(xhrReq)
      }
    }
  }

  uploadTemplate() {
    const designId = this.generateRandomString(20)
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const pageIndex = store.getters.getLastSelectedPageIndex
    store.commit('SET_pageDesignId', {
      pageIndex: pageIndex,
      designId: designId
    })
    const pageJSON = [generalUtils.deepCopy(store.getters.getPage(pageIndex))]

    console.log(pageJSON)

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}template/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment filename*=UTF-8''${encodeURIComponent('config.json')}`)
    const xhr = new XMLHttpRequest()

    const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)
    xhr.onload = () => {
      console.log(xhr)
    }
  }

  updateTemplate() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const pageIndex = store.getters.getLastSelectedPageIndex
    const designId = store.getters.getPage(pageIndex).designId

    const pageJSON = [generalUtils.deepCopy(store.getters.getPage(pageIndex))]

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}template/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment filename*=UTF-8''${encodeURIComponent('config.json')}`)
    const xhr = new XMLHttpRequest()

    const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)
    xhr.onload = () => {
      console.log(xhr)
    }
  }

  uploadTmpJSON() {
    const assetId = this.generateAssetId()

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_map.path}edit/temp.json`)
    // only for template
    formData.append('Content-Disposition', `attachment filename*=UTF-8''${encodeURIComponent('temp.json')}`)
    const xhr = new XMLHttpRequest()
    console.log(this.loginOutput)
    setInterval(() => {
      const pagesJSON = store.getters.getPages
      const blob = new Blob([JSON.stringify(pagesJSON)], { type: 'application/json' })
      if (formData.has('file')) {
        formData.set('file', blob)
      } else {
        formData.append('file', blob)
      }

      xhr.open('POST', this.loginOutput.upload_map.url, true)
      xhr.send(formData)
      xhr.onload = function () {
        // console.log(this)
      }
    }, 5000)
  }

  async getTmpJSON() {
    this.loginOutput.download_url = this.loginOutput.download_url.replace('*', 'edit/temp.json')
    console.log(`${this.loginOutput.download_url}&ver=${this.generateRandomString(6)}`)
    const response = await fetch(`${this.loginOutput.download_url}&ver=${this.generateRandomString(6)}`)
    // const response = await fetch(this.loginOutput.download_url)
    response.json().then((json) => {
      store.commit('SET_pages', json)
    })
  }

  async getTemplate(type: string, designId: string) {
    const jsonName = type === 'template' ? 'config.json' : 'page.json'
    const response = await fetch(`https://template.vivipic.com/${type}/${designId}/${jsonName}?ver=${this.generateRandomString(6)}`)
    response.json().then((json) => {
      console.log(json)
      store.commit('SET_pages', json)
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
