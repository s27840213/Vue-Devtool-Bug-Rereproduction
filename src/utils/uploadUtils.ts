import { IAssetPhoto, IListServiceContentDataItem } from '@/interfaces/api'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import generalUtils from './generalUtils'
import LayerUtils from './layerUtils'
import ImageUtils from '@/utils/imageUtils'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp } from '@/interfaces/layer'
import groupUtils from './groupUtils'
import modalUtils from './modalUtils'
import shapeUtils from './shapeUtils'
import AssetUtils from './assetUtils'
import { IMarker } from '@/interfaces/shape'
import zindexUtils from './zindexUtils'

class UploadUtils {
  loginOutput: any
  get token(): string { return store.getters['user/getToken'] }
  get downloadUrl(): string { return store.getters['user/getDownloadUrl'] }
  get userId(): string { return store.getters['user/getUserId'] }
  get images(): Array<IAssetPhoto> { return store.getters['user/getImages'] }
  get supportTypes(): Array<string> {
    return ['jpeg', 'gif', 'png', 'apng', 'svg', 'bmp', 'png', 'ico']
  }

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
      console.log(this.userId)
      formData.append('x-amz-meta-tn', this.userId)
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

  uploadLayer(type: string) {
    const targetBucket = type === 'shape' ? 'svg' : type
    console.log(targetBucket)
    const designId = generalUtils.generateRandomString(20)
    const currSelectedInfo = store.getters.getCurrSelectedInfo

    LayerUtils.updateLayerProps(currSelectedInfo.pageIndex, currSelectedInfo.index, {
      designId: designId
    })

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}${targetBucket}/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
    formData.append('x-amz-meta-tn', this.userId)
    const xhr = new XMLHttpRequest()

    const layerInfo = generalUtils.deepCopy(currSelectedInfo.layers[0])
    Object.assign(layerInfo, { active: false })
    this.removeComputableInfo(layerInfo)

    const blob = new Blob([JSON.stringify(layerInfo)], { type: 'application/json' })
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
      this.removeComputableInfo(targetLayer)

      pageJSON.layers = [targetLayer]
      pageJSON.backgroundColor = 'transparent'
      pageJSON.backgroundImage.config.srcObj = { type: '', userId: '', assetId: '' }

      const formData = new FormData()
      Object.keys(this.loginOutput.upload_admin_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_admin_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_admin_map.path}${targetBucket}/${designId}/page.json`)
      // only for template
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      formData.append('x-amz-meta-tn', this.userId)
      const xhrReq = new XMLHttpRequest()

      const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
      formData.append('file', blob)

      xhrReq.open('POST', this.loginOutput.upload_admin_map.url, true)
      xhrReq.send(formData)
      xhrReq.onload = () => {
        console.log(designId)
      }
    }
  }

  updateLayer(type: string) {
    const targetBucket = type === 'shape' ? 'svg' : type
    console.log(targetBucket)
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const designId = currSelectedInfo.layers[0].designId

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}${targetBucket}/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
    formData.append('x-amz-meta-tn', this.userId)
    const xhr = new XMLHttpRequest()

    const layerInfo = generalUtils.deepCopy(currSelectedInfo.layers[0])
    layerInfo.active = false
    layerInfo.isTyping = false
    layerInfo.locked = false
    layerInfo.dragging = false
    layerInfo.editing = false
    this.removeComputableInfo(layerInfo)

    Object.assign(layerInfo, { active: false })

    const blob = new Blob([JSON.stringify(layerInfo)], { type: 'application/json' })
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
      this.removeComputableInfo(targetLayer)
      pageJSON.layers = [targetLayer]
      pageJSON.backgroundColor = 'transparent'
      pageJSON.backgroundImage.config.srcObj = { type: '', userId: '', assetId: '' }

      // console.log(pageJSON)
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_admin_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_admin_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_admin_map.path}${targetBucket}/${designId}/page.json`)
      // only for template
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      formData.append('x-amz-meta-tn', this.userId)
      const xhrReq = new XMLHttpRequest()

      const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
      formData.append('file', blob)

      xhrReq.open('POST', this.loginOutput.upload_admin_map.url, true)
      xhrReq.send(formData)
      xhrReq.onload = () => {
        console.log(designId)
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
    const pageJSON = this.default(generalUtils.deepCopy(store.getters.getPage(pageIndex)))

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_admin_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}template/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
    formData.append('x-amz-meta-tn', this.userId)
    const xhr = new XMLHttpRequest()

    const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)

    modalUtils.setIsModalOpen(true)
    modalUtils.setIsPending(true)
    modalUtils.setModalInfo('上傳中')
    xhr.onload = () => {
      modalUtils.setIsPending(false)
      modalUtils.setModalInfo('上傳成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`])
    }
  }

  updateTemplate() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const pageIndex = store.getters.getLastSelectedPageIndex
    const designId = store.getters.getPage(pageIndex).designId

    const pageJSON = this.default(generalUtils.deepCopy(store.getters.getPage(pageIndex)))
    console.log(pageJSON)
    console.log(designId)

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_admin_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_admin_map.path}template/${designId}/config.json`)
    // only for template
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('config.json')}`)
    formData.append('x-amz-meta-tn', this.userId)
    const xhr = new XMLHttpRequest()

    const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)
    modalUtils.setIsModalOpen(true)
    modalUtils.setIsPending(true)
    modalUtils.setModalInfo('更新模板中')
    xhr.onload = () => {
      modalUtils.setIsPending(false)
      modalUtils.setModalInfo('更新成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`])
    }
  }

  private default(page: any) {
    const basicDefault = (layer: any) => {
      layer.moved = false
      layer.shown = false
      layer.dragging = false
      layer.active = false
    }

    if (page.backgroundImage.config.src) {
      const src = page.backgroundImage.config.src
      const type = ImageUtils.getSrcType(page.backgroundImage.config.src)
      page.backgroundImage.config.srcObj = {
        type,
        userId: ImageUtils.getUserId(src, type),
        assetId: ImageUtils.getAssetId(src, type)
      }
      delete page.backgroundImage.config.src
    }

    for (const [index, layer] of (page.layers as Array<ILayer>).entries()) {
      switch (layer.type) {
        case 'image':
          layer.imgControl = false
          break
        case 'tmp': {
          const tmpLayer = layer as ITmp
          const layers = generalUtils.deepCopy(tmpLayer).layers
          if (tmpLayer.layers.filter(l => l.type === 'group').length) {
            for (let i = 0; i < tmpLayer.layers.length; i++) {
              if (tmpLayer.layers[i].type === 'group') {
                layers.splice(i, 1, ...groupUtils.mapGroupLayersToTmp(tmpLayer.layers[i] as IGroup))
              }
            }
          }
          LayerUtils.updateLayerProps(LayerUtils.pageIndex, index, {
            type: 'group',
            active: false,
            shown: false,
            layers
          })
          zindexUtils.reassignZindex(LayerUtils.pageIndex)
        }
      }
      basicDefault(layer)
    }
    groupUtils.reset()
    return page
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
    formData.append('x-amz-meta-tn', this.userId)
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
    const querySign = this.loginOutput.download_url.indexOf('?') !== -1 ? '&' : '?'
    const response = await fetch(`${this.loginOutput.download_url}${querySign}ver=${generalUtils.generateRandomString(6)}`)
    // const response = await fetch(this.loginOutput.download_url)
    response.json().then((json: Array<IPage>) => {
      store.commit('SET_pages', json)
      /**
       * @todo need to disable sub controller if we have
       */
      const hasTmp = json.some((page: IPage, pageIndex: number) => {
        return page.layers.some((layer: IText | IImage | IShape | IGroup | ITmp | IFrame, layerIndex: number) => {
          if (layer.active) {
            layer.type === 'tmp' ? groupUtils.set(pageIndex, layerIndex, (layer as ITmp).layers) : groupUtils.set(pageIndex, layerIndex, [layer])
            return true
          }
          return false
        })
      })
    })
  }

  async getDesign(type: string, designId: string) {
    const jsonName = type === 'template' ? 'config.json' : 'page.json'
    const response = await fetch(`https://template.vivipic.com/${type}/${designId}/${jsonName}?ver=${generalUtils.generateRandomString(6)}`)
    response.json().then(async (json) => {
      console.log(json)
      if (type !== 'template') {
        await this.addComputableInfo(json.layers[0])
      }
      store.commit('SET_pages', [json])
    })
  }

  removeComputableInfo(layer: ILayer) {
    if (layer.type === 'shape') {
      switch (layer.category) {
        case 'D':
          delete layer.markerTransArray
          delete layer.markerWidth
          delete layer.trimWidth
          delete layer.trimOffset
          delete layer.styleArray
          delete layer.svg
          delete layer.pDiff
          delete layer.pSize
          delete layer.cSize
          delete layer.vSize
          delete layer.className
          break
        case 'E':
          delete layer.styleArray
          delete layer.svg
          delete layer.pDiff
          delete layer.pSize
          delete layer.cSize
          delete layer.className
          break
      }
    }
  }

  async addComputableInfo(layer: ILayer) {
    if (layer.type === 'shape') {
      const theLayer = layer as IShape
      const svgs: string[] = []
      let dummy
      switch (theLayer.category) {
        case 'D':
          theLayer.styleArray = ['stroke:$color[0];stroke-width:$size[0];stroke-dasharray:$dash;stroke-linecap:$cap']
          theLayer.markerTransArray = [
            'transform: translate($txmspx, $tymspx) rotate($romsdeg) $finetunes scale($size[0]);',
            'transform: translate($txmepx, $tymepx) rotate($romedeg) $finetunee scale($size[0]);'
          ]
          theLayer.markerWidth = []
          theLayer.trimWidth = []
          theLayer.trimOffset = []
          for (const markerId of theLayer.markerId ?? []) {
            if (markerId === 'none') {
              theLayer.styleArray.push('')
              dummy = theLayer.markerWidth?.push(0)
              dummy = theLayer.trimWidth?.push(undefined)
              dummy = theLayer.trimOffset?.push(-1)
              svgs.push('')
            } else {
              const marker: IListServiceContentDataItem = {
                id: markerId,
                type: 9,
                ver: store.getters['user/getVerUni']
              }
              const markerContent = (await AssetUtils.fetch(marker)).jsonData as IMarker
              theLayer.styleArray.push(markerContent.styleArray[0])
              dummy = theLayer.markerWidth?.push(markerContent.vSize[0])
              dummy = theLayer.trimWidth?.push(markerContent.trimWidth)
              dummy = theLayer.trimOffset?.push(markerContent.trimOffset ?? -1)
              svgs.push(markerContent.svg)
            }
          }
          theLayer.svg = shapeUtils.genLineSvgTemplate(svgs[0], svgs[1])
          theLayer.pDiff = [0, 0]
          theLayer.pSize = [0, 0]
          theLayer.cSize = [0, 0]
          theLayer.vSize = [0, 0]
          theLayer.className = shapeUtils.classGenerator()
          break
        case 'E':
          theLayer.styleArray = ['fill:$fillcolor; stroke:$color[0]; stroke-width:calc(2*$size[0])']
          theLayer.svg = shapeUtils.genBasicShapeSvgTemplate(theLayer.shapeType ?? '')
          theLayer.pDiff = [0, 0]
          theLayer.pSize = [0, 0]
          theLayer.cSize = [0, 0]
          theLayer.className = shapeUtils.classGenerator()
          break
      }
    }
  }
}

const uploadUtils = new UploadUtils()
export default uploadUtils
