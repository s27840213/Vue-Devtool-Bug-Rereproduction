import { IAssetPhoto, IGroupDesignInputParams, IListServiceContentDataItem } from '@/interfaces/api'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import generalUtils from './generalUtils'
import LayerUtils from './layerUtils'
import ShapeUtils from './shapeUtils'
import ImageUtils from '@/utils/imageUtils'
import { IFrame, IGroup, IImage, ILayer, IShape, IText, ITmp, jsonVer } from '@/interfaces/layer'
import groupUtils from './groupUtils'
import modalUtils from './modalUtils'
import assetUtils from './assetUtils'
import stepsUtils from './stepsUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import pageUtils from './pageUtils'
import router from '@/router'
import { EventEmitter } from 'events'
import themeUtils from './themeUtils'
import designUtils from './designUtils'
import { SidebarPanelType } from '@/store/types'
import i18n from '@/i18n'
import logUtils from './logUtils'
import listService from '@/apis/list'

// 0 for update db, 1 for update prev, 2 for update both
enum PutAssetDesignType {
  UPDATE_DB,
  UPDATE_PREV,
  UPDATE_BOTH
}

// 0 for upload new one, 1 for update prev
enum GroupDesignUpdateFlag {
  UPLOAD,
  UPDATE_GROUP,
  UPDATE_COVER
}

enum GetDesignType {
  TEMPLATE = 'template',
  TEXT = 'text',
  ASSET_DESIGN = 'design',
  NEW_DESIGN_TEMPLATE = 'new-design-template',
  PRODUCT_PAGE_TEMPLATE = 'product-page-template'
}
/**
 * @todo do the house keeping for upload and update logic
 */

class UploadUtils {
  static readonly PutAssetDesignType = PutAssetDesignType
  readonly PutAssetDesignType = UploadUtils.PutAssetDesignType
  static readonly GroupDesignUpdateFlag = GroupDesignUpdateFlag
  readonly GroupDesignUpdateFlag = UploadUtils.GroupDesignUpdateFlag
  static readonly GetDesignType = GetDesignType
  readonly GetDesignType = UploadUtils.GetDesignType
  loginOutput: any
  /**
   * @param getDesignInfo
   *  - the reason why we need this param is that if  the url contain the infomation of type=design, and design_id, we need to get the design "after" logining
   *  - However, the getDeisgn function trigger in handler.ts is before the login infomation setup.
   *  - Thus, we need to record the information and call the getDesign function after logining
   */

  getDesignInfo: {
    flag: number,
    type: string,
    id: string,
    teamId: string
  }

  event: any
  eventHash: { [index: string]: (param: any) => void }
  hasGottenDesign: boolean
  designStatusTimer: number

  get token(): string { return store.getters['user/getToken'] }
  get userId(): string { return store.getters['user/getUserId'] }
  get teamId(): string { return store.getters['user/getTeamId'] || this.userId }
  get groupId(): string { return store.getters.getGroupId }
  get assetId(): string { return store.getters.getAssetId }
  get images(): Array<IAssetPhoto> { return store.getters['user/getImages'] }
  get isAdmin(): boolean { return store.getters['user/isAdmin'] }
  get isLogin(): boolean { return store.getters['user/isLogin'] }

  constructor() {
    this.getDesignInfo = {
      flag: 0,
      type: GetDesignType.ASSET_DESIGN,
      id: '',
      teamId: ''
    }
    this.hasGottenDesign = false
    this.event = new EventEmitter()
    this.eventHash = {}
    this.designStatusTimer = -1
  }

  setLoginOutput(loginOutput: any) {
    this.loginOutput = loginOutput
    if (this.getDesignInfo.flag) {
      this.getDesign(this.getDesignInfo.type, { designId: this.getDesignInfo.id, teamId: this.getDesignInfo.teamId })
    }
  }

  onFontUploadStatus(callback: (status: 'none' | 'uploading' | 'success' | 'fail') => void) {
    this.event.on('fontUploadStatus', callback)
  }

  emitFontUploadEvent(status: 'none' | 'uploading' | 'success' | 'fail') {
    this.event.emit('fontUploadStatus', status)
  }

  onDesignUploadStatus(callback: (status: 'none' | 'uploading' | 'success' | 'fail') => void) {
    if (this.eventHash.designUploadStatus) {
      delete this.eventHash.designUploadStatus
    }
    this.event.on('designUploadStatus', callback)
    this.eventHash.designUploadStatus = callback
    this.event.on('designUploadStatus', callback)
  }

  emitDesignUploadEvent(status: 'none' | 'uploading' | 'success' | 'fail') {
    this.event.emit('designUploadStatus', status)
  }

  offDesignUploadStatus() {
    this.event.off('designUploadStatus', this.eventHash.designUploadStatus)
  }

  chooseAssets(type: 'image' | 'font' | 'avatar') {
    // Because inputNode won't be appended to DOM, so we don't need to release it
    // It will be remove by JS garbage collection system sooner or later
    const acceptHash = {
      image: '.jpg,.jpeg,.png,.webp,.gif,.svg,.tiff,.tif,.heic',
      font: '.ttf,.ttc,.otf,.woff2',
      avatar: '.jpg,.jpeg,.png,.webp,.gif,.svg,.tiff,.tif,.heic'
    }
    const inputNode = document.createElement('input')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', acceptHash[type])
    inputNode.setAttribute('multiple', `${type === 'image'}`)
    inputNode.click()
    inputNode.addEventListener('change', (evt: Event) => {
      if (evt) {
        const files = (<HTMLInputElement>evt.target).files
        this.uploadAsset(type, files as FileList)
      }
    }, false)
  }

  uploadScreenShotImage(blob: Blob) {
    store.commit('SET_currSidebarPanelType', SidebarPanelType.file)
    const reader = new FileReader()
    const assetId = generalUtils.generateAssetId()
    const fileName = `${generalUtils.generateRandomString(8)}.png`
    const formData = new FormData()

    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_map.fields[key])
    })
    formData.append('key', `${this.loginOutput.upload_map.path}asset/image/${assetId}/original`)
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${fileName}`)}`)
    formData.append('x-amz-meta-tn', this.userId)
    const xhr = new XMLHttpRequest()

    const file = new File([blob], fileName, { lastModified: Date.now() })

    if (formData.has('file')) {
      formData.set('file', file)
    } else {
      formData.append('file', file)
    }

    reader.onload = (evt) => {
      /**
       * @TODO -> simplify the codes below
       */
      const img = new Image()
      img.src = evt.target?.result as string
      img.onload = (evt) => {
        store.commit('user/ADD_PREVIEW', {
          imageFile: img,
          assetId: assetId
        })
        assetUtils.addImage(img.src, img.width / img.height, {
          pageIndex: pageUtils.currFocusPageIndex,
          // The following props is used for preview image during polling process
          isPreview: true,
          assetId
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
          // polling the JSON file of uploaded image
          const interval = setInterval(() => {
            const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json`
            fetch(pollingTargetSrc).then((response) => {
              if (response.status === 200) {
                clearInterval(interval)
                clearInterval(increaseInterval)
                response.json().then((json: IUploadAssetResponse) => {
                  /**
                   * @todo check the reason why the backend will return flag 1
                   * */
                  if (json.flag === 0) {
                    console.log('Successfully upload the file')
                    store.commit('user/UPDATE_PROGRESS', {
                      assetId: assetId,
                      progress: 100
                    })
                    store.commit('user/UPDATE_IMAGE_URLS', { assetId, urls: json.url })
                    store.commit('DELETE_previewSrc', { type: this.isAdmin ? 'public' : 'private', userId: this.userId, assetId, assetIndex: json.data.asset_index })
                    // the reason why we upload here is that if user refresh the window immediately after they succefully upload the screenshot
                    // , the screenshot image in the page will get some problem
                    this.uploadDesign(this.PutAssetDesignType.UPDATE_DB)
                  } else if (json.flag === 1) {
                    modalUtils.setIsModalOpen(true)
                    modalUtils.setModalInfo('上傳失敗', [`Asset ID: ${assetId}`])
                  }
                })
              }
            })
          }, 2000)
        }
      }
    }
    reader.readAsDataURL(blob)
  }

  // Upload the user's asset in my file panel
  uploadAsset(type: 'image' | 'font' | 'avatar', files: FileList, addToPage = false) {
    if (type === 'font') {
      this.emitFontUploadEvent('uploading')
    }
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      const assetId = generalUtils.generateAssetId()
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_map.fields[key])
      })
      if (type === 'avatar') {
        formData.append('key', `${this.loginOutput.upload_map.path}asset/${type}/original`)
      } else {
        formData.append('key', `${this.loginOutput.upload_map.path}asset/${type}/${assetId}/original`)
      }
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(files[i].name)}`)
      formData.append('x-amz-meta-tn', this.userId)
      const xhr = new XMLHttpRequest()

      if (formData.has('file')) {
        formData.set('file', files[i])
      } else {
        formData.append('file', files[i])
      }
      reader.onload = (evt) => {
        /**
         * @TODO -> simplify the codes below
         */
        if (type === 'image') {
          const img = new Image()
          img.src = evt.target?.result as string
          img.onload = (evt) => {
            store.commit('user/ADD_PREVIEW', {
              imageFile: img,
              assetId: assetId
            })
            if (addToPage) {
              assetUtils.addImage(img.src, img.width / img.height, {
                pageIndex: pageUtils.currFocusPageIndex,
                // The following props is used for preview image during polling process
                isPreview: true,
                assetId
              })
            }
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
              // polling the JSON file of uploaded image
              const interval = setInterval(() => {
                const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json`
                fetch(pollingTargetSrc).then((response) => {
                  if (response.status === 200) {
                    clearInterval(interval)
                    clearInterval(increaseInterval)
                    response.json().then((json: IUploadAssetResponse) => {
                      if (json.flag === 0) {
                        console.log('Successfully upload the file')
                        if (type === 'image') {
                          store.commit('user/UPDATE_PROGRESS', {
                            assetId: assetId,
                            progress: 100
                          })
                          store.commit('user/UPDATE_IMAGE_URLS', { assetId, urls: json.url })
                          store.commit('DELETE_previewSrc', { type: this.isAdmin ? 'public' : 'private', userId: this.userId, assetId, assetIndex: json.data.asset_index })
                        }
                      } else {
                        console.log('Failed to upload the file')
                      }
                    })
                  }
                })
              }, 2000)
            }
          }
        } else if (type === 'font') {
          xhr.open('POST', this.loginOutput.upload_map.url, true)
          xhr.send(formData)
          xhr.onload = () => {
            // polling the JSON file of uploaded image
            const interval = setInterval(() => {
              const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json`
              fetch(pollingTargetSrc).then((response) => {
                if (response.status === 200) {
                  clearInterval(interval)
                  response.json().then((json: IUploadAssetResponse) => {
                    if (json.flag === 0) {
                      this.emitFontUploadEvent('success')
                      console.log('Successfully upload the file')
                      store.dispatch('getAllAssets', { token: this.token })
                      setTimeout(() => {
                        this.emitFontUploadEvent('none')
                      }, 2000)
                    } else {
                      this.emitFontUploadEvent('fail')
                      console.log('Failed to upload the file')
                      setTimeout(() => {
                        this.emitFontUploadEvent('none')
                      }, 2000)
                    }
                  })
                }
              })
            }, 2000)
          }
        } else if (type === 'avatar') {
          xhr.open('POST', this.loginOutput.upload_map.url, true)
          xhr.send(formData)
          modalUtils.setIsModalOpen(true)
          modalUtils.setIsPending(true)
          modalUtils.setModalInfo(`${i18n.t('NN0136')}`)
          xhr.onload = () => {
            // polling the JSON file of uploaded image
            const interval = setInterval(() => {
              const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/avatar/result.json?ver=${generalUtils.generateRandomString(6)}`
              fetch(pollingTargetSrc).then((response) => {
                if (response.status === 200) {
                  clearInterval(interval)
                  response.json().then((json: IUploadAssetResponse) => {
                    if (json.flag === 0) {
                      console.log('Successfully upload the file')
                      const targetUrls = this.isAdmin ? {
                        prev: `https://template.vivipic.com/admin/${this.teamId || this.userId}/asset/avatar/prev`,
                        prev_2x: `https://template.vivipic.com/admin/${this.teamId || this.userId}/asset/avatar/prev_2x`,
                        prev_4x: `https://template.vivipic.com/admin/${this.teamId || this.userId}/asset/avatar/prev_4x`
                      } : json.url
                      store.commit('user/SET_STATE', {
                        avatar: targetUrls
                      })
                      modalUtils.setIsPending(false)
                      modalUtils.setModalInfo(`${i18n.t('NN0224')}`)
                    } else {
                      console.log('Failed to upload the file')
                      modalUtils.setModalInfo(`${i18n.t('NN0223')}`)
                    }
                  })
                }
              })
            }, 2000)
          }
        }
      }

      reader.readAsDataURL(files[i])
    }
  }

  uploadLog(logContent: string) {
    const formData = new FormData()
    Object.keys(this.loginOutput.upload_log_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_log_map.fields[key])
    })

    const logName = `log-${generalUtils.generateTimeStamp()}.txt`
    formData.append('key', `${this.loginOutput.upload_log_map.path}${this.userId}/${logName}`)
    formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(logName)}`)
    formData.append('x-amz-meta-tn', this.userId)
    const xhr = new XMLHttpRequest()

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' })

    formData.append('file', blob)

    xhr.open('POST', this.loginOutput.upload_log_map.url, true)
    xhr.send(formData)
    xhr.onload = () => {
      // console.log(xhr)
    }
  }

  async uploadDesign(putAssetDesignType?: PutAssetDesignType) {
    const typeMap = ['UPDATE_DB', 'UPDATE_PREV', 'UPDATE_BOTH']
    const type = router.currentRoute.query.type
    const designId = router.currentRoute.query.design_id
    const teamId = router.currentRoute.query.team_id
    const assetId = this.assetId.length !== 0 ? this.assetId : generalUtils.generateAssetId()

    if (designId && teamId && type && !this.hasGottenDesign) {
      return
    }
    if (!type || !designId || !teamId) {
      router.replace({ query: Object.assign({}, router.currentRoute.query, { type: 'design', design_id: assetId, team_id: this.teamId }) })
    }
    store.commit('SET_assetId', assetId)
    const pages = generalUtils.deepCopy(pageUtils.getPages) as Array<IPage>

    logUtils.setLog(`Upload Design:
      Type: ${putAssetDesignType ? typeMap[putAssetDesignType] : 'UPLOAD JSON'}
      AssetId: ${assetId},
      TeamId: ${teamId}
      PageNum: ${pages.length}`)

    const pagesJSON = pages.map((page: IPage) => {
      const newPage = this.default(generalUtils.deepCopy(page)) as IPage
      for (const [i, layer] of newPage.layers.entries()) {
        if (layer.type === 'shape' && (layer.designId || layer.category === 'D' || layer.category === 'E')) {
          newPage.layers[i] = this.layerInfoFilter(layer)
        } else if (layer.type !== 'shape') {
          newPage.layers[i] = this.layerInfoFilter(layer)
        }
      }
      newPage.backgroundImage.config.imgControl = false
      newPage.width = parseInt(newPage.width.toString(), 10)
      newPage.height = parseInt(newPage.height.toString(), 10)
      return newPage
    })

    const resultJSON = {
      name: pageUtils.pagesName,
      pages: pagesJSON,
      groupId: store.state.groupId,
      groupType: store.state.groupType
    }

    const formData = new FormData()
    Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
      formData.append(key, this.loginOutput.upload_map.fields[key])
    })

    formData.append('key', `${this.loginOutput.upload_map.path}asset/design/${assetId}/config.json`)
    formData.append('Content-Disposition', 'inline')

    formData.append('x-amz-meta-tn', this.userId)

    const blob = new Blob([JSON.stringify(resultJSON)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }
    this.emitDesignUploadEvent('uploading')
    await this.makeXhrRequest('POST', this.loginOutput.upload_map.url, formData)
      .then(() => {
        if (this.designStatusTimer !== -1) {
          clearTimeout(this.designStatusTimer)
        }
        this.designStatusTimer = setTimeout(() => {
          this.emitDesignUploadEvent('success')
        }, 300)
        if (putAssetDesignType !== undefined) {
          logUtils.setLog(`Put asset design (Type: ${typeMap[putAssetDesignType]})`)
          store.dispatch('user/putAssetDesign', {
            assetId,
            type: putAssetDesignType
          })
        }
      })
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
      console.log(this)
    }
  }

  async getTmpJSON() {
    const fetchTarget = `https://template.vivipic.com/admin/${this.teamId}/edit/temp.json`
    const response = await fetch(`${fetchTarget}?ver=${generalUtils.generateRandomString(6)}`)
    stepsUtils.reset()
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
      stepsUtils.record()
    })
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
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      formData.append('x-amz-meta-tn', this.userId)
      const xhrReq = new XMLHttpRequest()

      const blob = new Blob([JSON.stringify(pageJSON)], { type: 'application/json' })
      formData.append('file', blob)

      xhrReq.open('POST', this.loginOutput.upload_admin_map.url, true)
      xhrReq.send(formData)
      xhrReq.onload = () => {
        // console.log(designId)
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
        // console.log(designId)
      }
    }
  }

  uploadGroupDesign(update: GroupDesignUpdateFlag, ecomm: 0 | 1, deleteGroup = false as boolean, coverId?: string) {
    const groupId = (update === this.GroupDesignUpdateFlag.UPLOAD) ? '' : this.groupId
    // store.commit('SET_groupId', groupId)
    const pages = pageUtils.getPages
    /**
     * @param {string} list - template id list (separate by comma)
     */
    if (update === GroupDesignUpdateFlag.UPLOAD || update === GroupDesignUpdateFlag.UPDATE_GROUP) {
      // Could only delete group when updating group
      const list = deleteGroup && update === GroupDesignUpdateFlag.UPDATE_GROUP ? '' : pages.map((page: IPage) => page.designId).join(',')
      if (ecomm) {
        if (!pageUtils.isAllPageSizeEqual()) {
          modalUtils.setIsModalOpen(true)
          modalUtils.setModalInfo('上傳 or 更新詳情頁失敗', ['Page 寬度不一致'])
          return
        }
      }
      store.dispatch('user/groupDesign', {
        token: this.token,
        update,
        list,
        group_id: groupId,
        ecomm
      } as IGroupDesignInputParams)
    }

    if (update === GroupDesignUpdateFlag.UPDATE_COVER) {
      const coverType = 'Idontknow'
      const cover = `${coverType}:${coverId}`
      store.dispatch('user/groupDesign', {
        token: this.token,
        update,
        group_id: groupId,
        cover
      } as IGroupDesignInputParams).then(() => {
        // console.log(groupId)
      })
    }
  }

  uploadTemplate() {
    const designId = generalUtils.generateRandomString(20)
    const currSelectedInfo = store.getters.getCurrSelectedInfo
    /**
     * @Todo check the index valid or not
     */
    // const pageIndex = store.getters.getMiddlemostPageIndex
    const pageIndex = pageUtils.currFocusPageIndex
    const page = store.getters.getPage(pageIndex)
    const parentId = page.designId ?? ''
    store.commit('SET_pageDesignId', {
      pageIndex: pageIndex,
      designId: designId
    })

    const pageJSON = this.default(generalUtils.deepCopy(page))
    pageJSON.parentId = parentId
    for (const [i, layer] of pageJSON.layers.entries()) {
      if (layer.type === 'shape' && (layer.designId || layer.category === 'D' || layer.category === 'E')) {
        pageJSON.layers[i] = this.layerInfoFilter(layer)
      } else if (layer.type !== 'shape') {
        pageJSON.layers[i] = this.layerInfoFilter(layer)
      }
    }

    pageJSON.width = parseInt(pageJSON.width.toString(), 10)
    pageJSON.height = parseInt(pageJSON.height.toString(), 10)

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
    const pageIndex = store.getters.getMiddlemostPageIndex
    const designId = store.getters.getPage(pageIndex).designId

    const pageJSON = this.default(generalUtils.deepCopy(store.getters.getPage(pageIndex))) as IPage
    for (const [i, layer] of pageJSON.layers.entries()) {
      if (layer.type === 'shape' && (layer.designId || layer.category === 'D' || layer.category === 'E')) {
        pageJSON.layers[i] = this.layerInfoFilter(layer)
      } else if (layer.type !== 'shape') {
        pageJSON.layers[i] = this.layerInfoFilter(layer)
      }
    }

    pageJSON.width = parseInt(pageJSON.width.toString(), 10)
    pageJSON.height = parseInt(pageJSON.height.toString(), 10)

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
      const status = xhr.status
      if (status >= 200 && status < 300) {
        modalUtils.setModalInfo('更新成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`])
      } else if (status >= 400 && status < 500) {
        modalUtils.setModalInfo('更新失敗', [`Design ID: ${designId}`, `Status code: ${xhr.status}`, `Status Text: ${xhr.statusText}`, `Response Text: ${xhr.responseText}`, '已複製錯誤訊息至剪貼簿，麻煩將錯誤訊息貼至群組'])
        navigator.clipboard.writeText([`Design ID: ${designId}`, `Status code: ${xhr.status}`, `Status Text: ${xhr.statusText}`, `Response Text: ${xhr.responseText}`].join('\n'))
      }
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
      const src = page.backgroundImage.config.src as string
      const type = ImageUtils.getSrcType(page.backgroundImage.config.src as any)
      page.backgroundImage.config.srcObj = {
        type,
        userId: ImageUtils.getUserId(src, type),
        assetId: ImageUtils.getAssetId(src, type)
      }
      delete page.backgroundImage.config.src
    }

    if (!page.designId) {
      if (generalUtils.objHasOwnProperty(page, 'modified')) {
        delete page.modified
      }
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
        }
      }
      basicDefault(layer)
    }

    if (!page.appVer_origin) {
      page.appVer_origin = page.appVer || new Date().toISOString()
    }
    if (!page.jsonVer_origin) {
      page.jsonVer_origin = page.jsonVer || jsonVer
    }
    page.appVer = new Date().toISOString()
    page.jsonVer = jsonVer

    if (page.documentColors && page.documentColors.length && typeof page.documentColors[0] !== 'string') {
      const documentColors = (page.documentColors as Array<{ color: string, count: number }>).map(e => e.color)
      delete page.documentColors
      page.documentColors = documentColors
    }
    return page
  }

  async getDesign(type: string, designParams: { designId?: string, teamId?: string, signedUrl?: string, fetchTarget?: string }, params: { [index: string]: any } = {}) {
    let jsonName = ''
    let fetchTarget = ''
    const designId = designParams.designId ?? ''
    const teamId = designParams.teamId ?? this.teamId

    logUtils.setLog(`Get Design
      Type: ${type}
      DesignId: ${designId}
      TeamId: ${teamId}`)
    switch (type) {
      case GetDesignType.TEMPLATE:
      case GetDesignType.TEXT: {
        jsonName = type === GetDesignType.TEMPLATE ? 'config.json' : 'page.json'
        fetchTarget = `https://template.vivipic.com/${type}/${designId}/${jsonName}?ver=${generalUtils.generateRandomString(6)}`
        break
      }
      case GetDesignType.ASSET_DESIGN: {
        if (!this.isLogin) {
          this.getDesignInfo.flag = 1
          this.getDesignInfo.id = designId
          this.getDesignInfo.teamId = teamId
          this.getDesignInfo.type = GetDesignType.ASSET_DESIGN
          return
        }
        /**
         * @Note isAdmin -> fetch the public design, else fetch the private design
         */
        jsonName = 'config.json'
        fetchTarget = designParams.fetchTarget ?? `https://template.vivipic.com/admin/${teamId}/asset/design/${designId}/${jsonName}?ver=${generalUtils.generateRandomString(6)}`
        break
      }
      // case GetDesignType.PRIVATE_DESIGN: {
      //   if (!this.isLogin) {
      //     this.getDesignInfo.flag = 1
      //     this.getDesignInfo.id = designId
      //     this.getDesignInfo.type = GetDesignType.PRIVATE_DESIGN
      //     return
      //   }
      //   fetchTarget = signedUrl
      //   break
      // }
      case GetDesignType.PRODUCT_PAGE_TEMPLATE: {
        return listService.getList({ type: 'group', groupId: designId })
          .then(result => {
            const { content } = result.data.data
            return assetUtils.addGroupTemplate({
              id: '',
              type: 6,
              ver: 0,
              content_ids: content[0].list,
              group_id: designId,
              group_type: 1
            })
          })
          .then(() => {
            themeUtils.refreshTemplateState()
            stepsUtils.reset()
          })
      }
      case GetDesignType.NEW_DESIGN_TEMPLATE: {
        fetchTarget = `https://template.vivipic.com/template/${designId}/config.json?ver=${generalUtils.generateRandomString(6)}`
        break
      }
    }
    fetch(fetchTarget)
      .then((response) => {
        if (!response.ok) {
          /**
           * @Note remove the designId and type query if 404
           */
          logUtils.setLog('Fail to get design')
          themeUtils.refreshTemplateState()
          router.replace({ query: Object.assign({}) })
        } else {
          response.json().then(async (json) => {
            switch (type) {
              case GetDesignType.TEMPLATE: {
                assetUtils.addTemplate(json)
                logUtils.setLog('Successfully get template design')
                break
              }
              case GetDesignType.TEXT: {
                await ShapeUtils.addComputableInfo(json.layers[0])
                store.commit('SET_pages', [json])
                logUtils.setLog('Successfully get text design')
                break
              }
              case GetDesignType.ASSET_DESIGN: {
                /**
                 * @Todo add computableInfo if we need
                 */
                // await ShapeUtils.addComputableInfo(json.layers[0])
                store.commit('SET_assetId', designId)
                json.pages = pageUtils.filterBrokenImageLayer(json.pages)
                store.commit('SET_pages', Object.assign(json, { loadDesign: true }))
                logUtils.setLog(`Successfully get asset design (pageNum: ${json.pages.length})`)
                themeUtils.refreshTemplateState()
                //
                stepsUtils.reset()
                break
              }
              case GetDesignType.NEW_DESIGN_TEMPLATE: {
                designUtils.newDesignWithTemplae(Number(params.width), Number(params.height), json)
                logUtils.setLog('Successfully get new design template')
                stepsUtils.reset()
                break
              }
            }
          }).then(() => {
            this.hasGottenDesign = true
            pageUtils.fitPage()
          })
        }
      })
      .catch((err) => {
        router.replace({ query: Object.assign({}) })
        this.hasGottenDesign = true
        type === GetDesignType.ASSET_DESIGN && themeUtils.refreshTemplateState()
        logUtils.setLog(`Fetch error: ${err}`)
        console.error('fetch failed', err)
      })
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
    response.json().then(async (json) => {
      const pages = Array.isArray(json) ? json : json.pages
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

  private styleFilter(styles: any, type = 'general') {
    const general = {
      x: styles.x,
      y: styles.y,
      width: styles.width,
      height: styles.height,
      initWidth: styles.initWidth,
      initHeight: styles.initHeight,
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
        return {
          ...general,
          imgX: styles.imgX,
          imgY: styles.imgY,
          imgWidth: styles.imgWidth,
          imgHeight: styles.imgHeight,
          ...(Object.prototype.hasOwnProperty.call(styles, 'adjust') && { adjust: { ...styles.adjust } })
        }
      case 'text':
        return {
          ...general,
          writingMode: styles.writingMode,
          align: styles.align,
          textShape: styles.textShape,
          textEffect: styles.textEffect,
          type: styles.type,
          userId: styles.userId
        }
      case 'frame':
        return {
          ...general,
          ...(Object.prototype.hasOwnProperty.call(styles, 'adjust') && { adjust: { ...styles.adjust } })
        }
      default:
        return general
    }
  }

  layerInfoFilter(layer: ILayer): any {
    switch (layer.type) {
      case 'image': {
        const image = layer as IImage
        const { type, srcObj, styles } = image
        return {
          type,
          srcObj,
          styles: this.styleFilter(styles, 'image')
        }
      }
      case 'shape': {
        const shape = layer as IShape
        const { type, designId, ratio, color, styles, category } = shape
        switch (shape.category) {
          case 'D': {
            return {
              type,
              color,
              ratio,
              category,
              designId,
              size: shape.size,
              markerId: shape.markerId,
              dasharray: shape.dasharray,
              linecap: shape.linecap,
              point: shape.point,
              styles: this.styleFilter(styles)
            }
          }
          case 'E':
            styles.scale = 1
            styles.initWidth = styles.width
            styles.initHeight = styles.height
            shape.vSize = [styles.initWidth, styles.initHeight]
            return {
              type,
              color,
              ratio,
              category,
              designId,
              size: shape.size,
              scaleType: shape.scaleType,
              shapeType: shape.shapeType,
              vSize: shape.vSize,
              filled: shape.filled,
              styles: this.styleFilter(styles)
            }
          default: {
            if (designId) {
              return {
                type,
                category,
                designId,
                ratio,
                color,
                pDiff: shape.pDiff,
                styles: this.styleFilter(styles)
              }
            } else {
              // for downward compatible reason record the entire shape info
              return {
                ...shape
              }
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
                styles: this.styleFilter(img.styles, 'image')
              }
            })
          ],
          ...(decoration && {
            decoration: {
              color: decoration.color
            }
          }),
          ...(decorationTop && {
            decorationTop: {
              color: decorationTop.color
            }
          }),
          styles: this.styleFilter(styles, 'frame')
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
          styles: this.styleFilter(styles, 'text')
        }
      }
      case 'group': {
        const group = layer as IGroup
        const { type, layers, styles } = group
        const filteredLayers = layers
          .map(layer => {
            return this.layerInfoFilter(layer)
          })
        return {
          type,
          layers: filteredLayers,
          styles: this.styleFilter(styles)
        }
      }
      case 'tmp': {
        const tmp = layer as ITmp
        const { type, layers, styles } = tmp
        const filteredLayers = layers
          .map(layer => {
            return this.layerInfoFilter(layer)
          })
        return {
          type: 'group',
          layers: filteredLayers,
          styles: this.styleFilter(styles)

        }
      }
    }
  }

  uploadExportJSON(exportId: string, json?: any) {
    return new Promise((resolve) => {
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_map.fields[key])
      })

      formData.append('key', `${this.loginOutput.upload_map.path}export/${exportId}/page.json`)
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent('page.json')}`)
      formData.append('x-amz-meta-tn', this.userId)
      const xhr = new XMLHttpRequest()
      // console.log(this.loginOutput)
      logUtils.setLog(`Export Design:
        ExportId: ${exportId},
        UserId: ${this.userId}
        Url: ${this.loginOutput.upload_map.path}export/${exportId}/page.json`)
      const pagesJSON = json || store.getters.getPages
      const blob = new Blob([JSON.stringify(pagesJSON)], { type: 'application/json' })
      if (formData.has('file')) {
        formData.set('file', blob)
      } else {
        formData.append('file', blob)
      }
      xhr.onloadend = resolve
      xhr.open('POST', this.loginOutput.upload_map.url, true)
      xhr.send(formData)
    })
  }

  makeXhrRequest(method: string, url: string, data: FormData) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response)
        } else {
          reject(new Error(`${this.status}: ${this.statusText}`))
        }
      }
      xhr.onerror = function () {
        reject(new Error(`${this.status}: ${this.statusText}`))
      }
      xhr.send(data)
    })
  }
}

const uploadUtils = new UploadUtils()
export default uploadUtils
