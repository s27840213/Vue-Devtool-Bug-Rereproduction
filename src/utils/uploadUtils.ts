import { IAssetPhoto } from '@/interfaces/api'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import text from '@/store/text'
import generalUtils from './generalUtils'
import LayerUtils from './layerUtils'
class UploadUtils {
  loginOutput: any
  get token(): string { return store.getters['user/getToken'] }
  get downloadUrl(): string { return store.getters['user/getDownloadUrl'] }
  get images(): Array<IAssetPhoto> { return store.getters['user/getImages'] }
  get supportTypes(): Array<string> {
    return ['jpeg', 'gif', 'png', 'apng', 'svg', 'bmp', 'png', 'ico']
  }
  // private handleEvent(e: any) {
  //   console.log(`${e.type}: ${e.loaded} bytes transferred, and total ${e.total}\n`)
  // }

  // private addListeners(xhr: XMLHttpRequest) {
  //   xhr.addEventListener('loadstart', this.handleEvent)
  //   xhr.addEventListener('load', this.handleEvent)
  //   xhr.addEventListener('loadend', this.handleEvent)
  //   xhr.addEventListener('progress', this.handleEvent)
  //   xhr.addEventListener('error', this.handleEvent)
  //   xhr.addEventListener('abort', this.handleEvent)
  // }

  setLoginOutput(loginOutput: any) {
    this.loginOutput = loginOutput
    this.getTmpJSON()
  }

  uploadAsset() {
    // Because inputNode won't be appended to DOM, so we don't need to release it
    // It will be remove by JS garbage collection system sooner or later
    const inputNode = document.createElement('input')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', '.jpg,.jpeg,.png,.webp,.gif,.svg,.tiff,.tif,.heic')
    inputNode.setAttribute('multiple', 'true')
    inputNode.click()
    inputNode.addEventListener('change', (evt: Event) => {
      if (evt) {
        const files = (<HTMLInputElement>evt.target).files
        this.uploadImageAsset(files as FileList)
      }
    }, false)
  }

  uploadImageAsset(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      const assetId = generalUtils.generateAssetId()
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_map.fields[key])
      })
      formData.append('key', `${this.loginOutput.upload_map.path}asset/image/${assetId}/original`)
      // only for template
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(files[i].name)}`)
      const xhr = new XMLHttpRequest()

      if (formData.has('file')) {
        formData.set('file', files[i])
      } else {
        formData.append('file', files[i])
      }

      reader.onload = (evt) => {
        const img = new Image()
        img.src = evt.target?.result as string
        img.onload = (evt) => {
          store.commit('user/ADD_PREVIEW', {
            imageFile: img,
            assetId: assetId
          })
          xhr.open('POST', this.loginOutput.upload_map.url, true)
          let increaseInterval = undefined as any
          xhr.upload.onprogress = (event) => {
            const uploadProgress = Math.floor(event.loaded / event.total * 100)
            store.commit('user/UPDATE_PROGRESS', {
              assetId: assetId,
              progress: uploadProgress / 2
            })
            if (uploadProgress === 100) {
              increaseInterval = setInterval(() => {
                const targetIndex = this.images.findIndex((img: IAssetPhoto) => {
                  return img.id === assetId
                })
                const curr = this.images[targetIndex].progress as number
                const increaseNum = (90 - curr) * 0.05
                this.images[targetIndex].progress = curr + increaseNum
              }, 10)
            }
          }
          xhr.send(formData)
          xhr.onload = () => {
            const token = this.token
            const interval = setInterval(() => {
              fetch(this.downloadUrl.replace('*', `asset/image/${assetId}/prev`)).then((response) => {
                if (response.status !== 200) {
                  console.log('The preview image has not been created yet.')
                } else {
                  store.commit('user/UPDATE_PROGRESS', {
                    assetId: assetId,
                    progress: 100
                  })
                  store.commit('user/UPDATE_IMAGE_URLS', { assetId })
                  clearInterval(interval)
                  clearInterval(increaseInterval)
                }
              })
            }, 2000)
          }
        }
      }

      reader.readAsDataURL(files[i])
    }
  }

  uploadText() {
    const designId = generalUtils.generateRandomString(20)
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
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
    const xhr = new XMLHttpRequest()

    const textInfo = generalUtils.deepCopy(currSelectedInfo.layers[0])
    Object.assign(textInfo, { active: false })
    // console.log(textInfo)

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
      const pageJSON = generalUtils.deepCopy(store.getters.getPage(currSelectedInfo.pageIndex)) as IPage
      const targetLayer = pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)[0]
      targetLayer.active = false
      targetLayer.isTyping = false
      targetLayer.locked = false
      targetLayer.dragging = false
      targetLayer.editing = false

      console.log(targetLayer)
      pageJSON.layers = [targetLayer]
      pageJSON.backgroundColor = 'transparent'
      pageJSON.backgroundImage.srcObj = { type: '', userId: '', assetId: '' }

      // console.log(pageJSON)
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_admin_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_admin_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_admin_map.path}text/${designId}/page.json`)
      // only for template
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      const xhrReq = new XMLHttpRequest()

      const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
      formData.append('file', blob)

      xhrReq.open('POST', this.loginOutput.upload_admin_map.url, true)
      xhrReq.send(formData)
      xhrReq.onload = () => {
        console.log(designId)
        // console.log(xhrReq)
      }
    }
  }

  updateText() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const designId = currSelectedInfo.layers[0].designId

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}text/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
    const xhr = new XMLHttpRequest()

    const textInfo = generalUtils.deepCopy(currSelectedInfo.layers[0])

    textInfo.active = false
    textInfo.isTyping = false
    textInfo.locked = false
    textInfo.dragging = false
    textInfo.editing = false

    Object.assign(textInfo, { active: false })
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
      const pageJSON = generalUtils.deepCopy(store.getters.getPage(currSelectedInfo.pageIndex)) as IPage
      const targetLayer = pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)[0]
      targetLayer.active = false
      pageJSON.layers = [targetLayer]
      pageJSON.backgroundColor = 'transparent'
      pageJSON.backgroundImage.srcObj = { type: '', userId: '', assetId: '' }

      // console.log(pageJSON)
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_admin_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_admin_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_admin_map.path}text/${designId}/page.json`)
      // only for template
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      const xhrReq = new XMLHttpRequest()

      const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
      formData.append('file', blob)

      xhrReq.open('POST', this.loginOutput.upload_admin_map.url, true)
      xhrReq.send(formData)
      xhrReq.onload = () => {
        // console.log(xhrReq)
        // console.log(designId)
      }
    }
  }

  uploadTemplate() {
    const designId = generalUtils.generateRandomString(20)
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const pageIndex = store.getters.getLastSelectedPageIndex
    store.commit('SET_pageDesignId', {
      pageIndex: pageIndex,
      designId: designId
    })
    const pageJSON = generalUtils.deepCopy(store.getters.getPage(pageIndex))

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_admin_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}template/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
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
      console.log(designId)
      // console.log(`https://template.vivipic.com/template/${designId}/config.json?ver=${generalUtils.generateRandomString(6)}`)
      // console.log(xhr)
    }
  }

  updateTemplate() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const pageIndex = store.getters.getLastSelectedPageIndex
    const designId = store.getters.getPage(pageIndex).designId

    const pageJSON = generalUtils.deepCopy(store.getters.getPage(pageIndex))

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}template/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
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
      console.log(designId)
      // console.log(xhr)
    }
  }

  uploadTmpJSON() {
    const assetId = generalUtils.generateAssetId()

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_map.path}edit/temp.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('temp.json')}`)
    const xhr = new XMLHttpRequest()
    // console.log(this.loginOutput)
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
    // console.log(`${this.loginOutput.download_url}&ver=${generalUtils.generateRandomString(6)}`)
    const response = await fetch(`${this.loginOutput.download_url}&ver=${generalUtils.generateRandomString(6)}`)
    // const response = await fetch(this.loginOutput.download_url)
    response.json().then((json) => {
      store.commit('SET_pages', json)
    })
  }

  async getDesign(type: string, designId: string) {
    const jsonName = type === 'template' ? 'config.json' : 'page.json'
    const response = await fetch(`https://template.vivipic.com/${type}/${designId}/${jsonName}?ver=${generalUtils.generateRandomString(6)}`)
    response.json().then((json) => {
      console.log(json)
      store.commit('SET_pages', [json])
    })
  }
}

const uploadUtils = new UploadUtils()
export default uploadUtils
