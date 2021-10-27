import { IAssetPhoto, IListServiceContentDataItem } from '@/interfaces/api'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import generalUtils from './generalUtils'
import LayerUtils from './layerUtils'
import ShapeUtils from './shapeUtils'
import ImageUtils from '@/utils/imageUtils'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp, jsonVer } from '@/interfaces/layer'
import groupUtils from './groupUtils'
import modalUtils from './modalUtils'
import { IMarker } from '@/interfaces/shape'
import zindexUtils from './zindexUtils'
import assetUtils from './assetUtils'

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
    // pageJSON.layers
    //   .forEach((l: ILayer) => {
    //     l = this.layerInfoFilter(l)
    //   })

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
      navigator.clipboard.writeText(designId)
      modalUtils.setIsPending(false)
      modalUtils.setModalInfo('上傳成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`, '已複製 Design ID 到剪貼簿'])
    }
  }

  updateTemplate() {
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    const pageIndex = store.getters.getLastSelectedPageIndex
    const designId = store.getters.getPage(pageIndex).designId

    const pageJSON = this.default(generalUtils.deepCopy(store.getters.getPage(pageIndex))) as IPage
    for (const [i, layer] of pageJSON.layers.entries()) {
      if (layer.type === 'shape' && (layer.designId || layer.category === 'D' || layer.category === 'E')) {
        pageJSON.layers[i] = this.layerInfoFilter(layer)
      } else if (layer.type !== 'shape') {
        pageJSON.layers[i] = this.layerInfoFilter(layer)
      }
    }
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
          if (layer.styles.scale !== 1) {
            layer.styles.imgWidth = layer.styles.width as number
            layer.styles.imgHeight = layer.styles.height as number
            layer.styles.scale = 1
          }
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
          layer.type = 'group'
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

    page.appVer = new Date().toISOString()
    page.jsonVer = jsonVer
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
    if (type === 'template') {
      const json = await response.json()
      assetUtils.addTemplate(json)
    } else {
      response.json().then(async (json) => {
        if (type !== 'template') {
          await ShapeUtils.addComputableInfo(json.layers[0])
        }
        store.commit('SET_pages', [json])
      })
    }
  }

  async getExport(params: URLSearchParams) {
    const designId = params.get('design_id')
    const teamId = params.get('team_id') || ''
    const background = params.get('background') || '0'
    const index = params.get('index') ? `_${params.get('index')}` : ''
    const fileName = background === '0' ? `page${index}.json` : `page_trans${index}.json`

    // if one of them is missing
    if (![designId, teamId].every(Boolean)) return

    const response = await fetch(`https://template.vivipic.com/admin/${teamId}/export/${designId}/${fileName}`)
    response.json().then(async (pages) => {
      await ShapeUtils.addComputableInfo(pages[0].layers[0])
      store.commit('SET_pages', pages)
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

  private layerInfoFilter(layer: ILayer): any {
    const styleFilter = (styles: any, type = 'general') => {
      const general = {
        x: styles.x,
        y: styles.y,
        width: styles.width,
        height: styles.height,
        scale: styles.scale,
        scaleX: styles.scaleX,
        scaleY: styles.scaleY,
        rotate: styles.rotate,
        zindex: styles.zindex,
        opacity: styles.opacity,
        horizontalFlip: styles.horizontalFlip,
        verticalFlip: styles.verticalFlip
      }
      switch (type) {
        case 'image':
          if (general.scale !== 1) {
            general.width = styles.imgWidth
            general.height = styles.imgHeight
            general.scale = 1
          }
          return {
            ...general,
            imgX: styles.imgX,
            imgY: styles.imgY,
            imgWidth: styles.imgWidth,
            imgHeight: styles.imgHeight
          }
        case 'text':
          return {
            ...general,
            writingMode: styles.writingMode,
            align: styles.align,
            textShape: styles.textShape,
            textEffect: styles.textEffect
          }
        default:
          return general
      }
    }

    switch (layer.type) {
      case 'image': {
        const image = layer as IImage
        const { type, srcObj, styles } = image
        return {
          type,
          srcObj,
          styles: styleFilter(styles, 'image')
        }
      }
      case 'shape': {
        const shape = layer as IShape
        switch (shape.category) {
          case 'D': {
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
            return shape
          }
          case 'E':
            delete layer.styleArray
            delete layer.svg
            delete layer.pDiff
            delete layer.pSize
            delete layer.cSize
            delete layer.className
            return shape
          default: {
            const { type, designId, pDiff, ratio, color, styles, category } = shape
            return {
              type,
              category,
              designId,
              pDiff,
              ratio,
              color,
              styles: styleFilter(styles)
            }
          }
        }
      }
      case 'frame': {
        const frame = layer as IFrame
        const { type, designId, clips, decoration, decorationTop, styles } = frame
        return {
          type,
          designId,
          clips: [
            ...clips.map(img => {
              const { isFrameImg } = img
              return {
                ...this.layerInfoFilter(img),
                isFrameImg,
                styles: styleFilter(img.styles, 'image')
              }
            })
          ],
          decoration: decoration ? {
            color: decoration.color
          } : undefined,
          decorationTop: decorationTop ? {
            color: decorationTop.color
          } : undefined,
          styles: styleFilter(styles)
        }
      }
      case 'text': {
        const text = layer as IText
        const { type, widthLimit, isEdited, paragraphs, styles } = text
        return {
          type,
          widthLimit,
          isEdited,
          paragraphs: paragraphs,
          styles: styleFilter(styles, 'text')
        }
      }
      case 'group': {
        const group = layer as IGroup
        const { type, layers, styles } = group
        const filteredLayers = layers
          .map(layer => {
            return this.layerInfoFilter(layer)
          })
        console.log(generalUtils.deepCopy(styles))
        return {
          type,
          layers: filteredLayers,
          styles: styleFilter(styles)
        }
      }
    }
  }

  uploadExportJSON(exportId: string, json?: any) {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_map.path}export/${exportId}/page.json`)
      // only for template
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      formData.append('x-amz-meta-tn', this.userId)
      const xhr = new XMLHttpRequest()
      // console.log(this.loginOutput)
      const pagesJSON = json || store.getters.getPages
      const blob = new Blob([JSON.stringify(pagesJSON)], { type: 'application/json' })
      if (formData.has('file')) {
        formData.set('file', blob)
      } else {
        formData.append('file', blob)
      }
      xhr.open('POST', this.loginOutput.upload_map.url, true)
      xhr.send(formData)
      xhr.onload = resolve
      xhr.onerror = reject
    })
  }
}

const uploadUtils = new UploadUtils()
export default uploadUtils
