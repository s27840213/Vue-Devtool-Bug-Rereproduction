import Vue from 'vue'
import { IAssetPhoto, IGroupDesignInputParams, IListServiceContentData, IListServiceContentDataItem } from '@/interfaces/api'
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
import { IUploadAssetFontResponse, IUploadAssetLogoResponse, IUploadAssetResponse } from '@/interfaces/upload'
import pageUtils from './pageUtils'
import router from '@/router'
import { EventEmitter } from 'events'
import themeUtils from './themeUtils'
import designUtils from './designUtils'
import { SidebarPanelType } from '@/store/types'
import i18n from '@/i18n'
import logUtils from './logUtils'
import listService from '@/apis/list'
import designInfoApis from '@/apis/design-info'
import brandkitUtils from './brandkitUtils'
import paymentUtils from '@/utils/paymentUtils'
import networkUtils from './networkUtils'
import _ from 'lodash'
import editorUtils from './editorUtils'
import designApis from '@/apis/design'

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
  isGettingDesign: boolean
  designStatusTimer: number
  DEFAULT_POLLING_RETRY_LIMIT = 15

  get token(): string { return store.getters['user/getToken'] }
  get userId(): string { return store.getters['user/getUserId'] }
  get teamId(): string { return store.getters['user/getTeamId'] || this.userId }
  get groupId(): string { return store.getters.getGroupId }
  get assetId(): string { return store.getters.getAssetId }
  get exportIds(): string { return store.state.exportIds }
  get images(): Array<IAssetPhoto> { return store.getters['file/getImages'] }
  get isAdmin(): boolean { return store.getters['user/isAdmin'] }
  get isOutsourcer(): boolean { return store.getters['user/isOutsourcer'] }
  get isLogin(): boolean { return store.getters['user/isLogin'] }

  constructor() {
    this.getDesignInfo = {
      flag: 0,
      type: GetDesignType.ASSET_DESIGN,
      id: '',
      teamId: ''
    }
    this.isGettingDesign = false
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
    if (this.eventHash.fontUploadStatus) {
      delete this.eventHash.fontUploadStatus
    }
    this.eventHash.fontUploadStatus = callback
    this.event.on('fontUploadStatus', callback)
  }

  emitFontUploadEvent(status: 'none' | 'uploading' | 'success' | 'fail') {
    this.event.emit('fontUploadStatus', status)
  }

  offFontUploadStatus() {
    this.event.off('fontUploadStatus', this.eventHash.fontUploadStatus)
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

  chooseAssets(type: 'image' | 'font' | 'avatar' | 'logo') {
    // Because inputNode won't be appended to DOM, so we don't need to release it
    // It will be remove by JS garbage collection system sooner or later
    const acceptHash = {
      image: '.jpg,.jpeg,.png,.webp,.gif,.svg,.tiff,.tif,.heic',
      font: '.ttf,.ttc,.otf,.woff2',
      avatar: '.jpg,.jpeg,.png,.webp,.gif,.svg,.tiff,.tif,.heic',
      logo: '.jpg,.jpeg,.png,.webp,.gif,.svg,.tiff,.tif,.heic'
    }
    const inputNode = document.createElement('input')
    document.body.appendChild(inputNode)
    inputNode.setAttribute('class', 'inputNode')
    inputNode.setAttribute('type', 'file')
    inputNode.setAttribute('accept', acceptHash[type])
    inputNode.setAttribute('multiple', `${type === 'image'}`)
    inputNode.click()

    inputNode.addEventListener('change', (evt: Event) => {
      // const files = (<HTMLInputElement>evt.target).files
      const files = inputNode.files
      const params: { brandId?: string } = {}
      if (type === 'logo') {
        params.brandId = store.getters['brandkit/getCurrentBrandId']
      }
      this.uploadAsset(type, files as FileList, params)
      document.body.removeChild(inputNode)
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
        store.commit('file/ADD_PREVIEW', {
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
          store.commit('file/UPDATE_PROGRESS', {
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
        xhr.onerror = networkUtils.notifyNetworkError
        xhr.onload = () => {
          // polling the JSON file of uploaded image
          const interval = setInterval(() => {
            const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json?ver=${generalUtils.generateRandomString(6)}`
            fetch(pollingTargetSrc).then((response) => {
              if (response.status === 200) {
                clearInterval(interval)
                clearInterval(increaseInterval)
                response.json().then((json: IUploadAssetResponse) => {
                  if (json.flag === 0) {
                    console.log('Successfully upload the file')
                    store.commit('file/UPDATE_PROGRESS', {
                      assetId: assetId,
                      progress: 100
                    })
                    store.commit('file/UPDATE_IMAGE_URLS', { assetId, urls: json.url, assetIndex: json.data.asset_index })
                    store.commit('DELETE_previewSrc', { type: this.isAdmin ? 'public' : 'private', userId: this.userId, assetId, assetIndex: json.data.asset_index })
                    store.commit('file/SET_UPLOADING_IMGS', { id: assetId, adding: false })
                    // the reason why we upload here is that if user refresh the window immediately after they succefully upload the screenshot
                    // , the screenshot image in the page will get some problem
                    this.uploadDesign()
                  } else if (json.flag === 1) {
                    store.commit('file/DEL_PREVIEW', { assetId })
                    LayerUtils.deleteLayerByAssetId(assetId)
                    paymentUtils.errorHandler(json.msg)
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
  uploadAsset(type: 'image' | 'font' | 'avatar' | 'logo', files: FileList | Array<string>, { addToPage = false, id, pollingCallback, needCompressed = true, brandId, isShadow = false }: {
    addToPage?: boolean,
    id?: string,
    pollingCallback?: (json: IUploadAssetResponse) => void,
    needCompressed?: boolean,
    brandId?: string
    isShadow?: boolean
  } = {}) {
    if (type === 'font') {
      this.emitFontUploadEvent('uploading')
    }

    // Check if file size over limit.
    for (let i = 0; i < files.length; i++) {
      const fileSize = (typeof files[i] === 'string'
        ? (files[i] as string).length / 4 * 3
        : (files[i] as File).size) / 1024 / 1024
      const fileSizeLimit = // 50 for font, BGremove and shadow.
        (typeof files[i] === 'string' || type === 'font') ? 50 : 25
      const modalDesc = typeof files[i] === 'string'
        ? i18n.t('NN0705',
          { size: fileSizeLimit }
        )
        : i18n.t('NN0696',
          { file: (files[i] as File)?.name, size: fileSizeLimit }
        )

      if (fileSize > fileSizeLimit) {
        modalUtils.setModalInfo(
          i18n.t('NN0137') as string,
          [modalDesc as string]
        )
        return
      }
    }

    const isFile = typeof files[0] !== 'string'
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      const assetId = id ?? generalUtils.generateAssetId()
      const formData = new FormData()
      Object.keys(this.loginOutput.upload_map.fields).forEach(key => {
        formData.append(key, this.loginOutput.upload_map.fields[key])
      })
      if (type === 'avatar') {
        formData.append('key', `${this.loginOutput.upload_map.path}asset/${type}/original`)
      } else if (type === 'font') {
        formData.append('key', `${this.loginOutput.upload_map.path}asset/${type}/${assetId}/${i18n.locale}_original`)
      } else if (type === 'logo') {
        if (!brandId) return
        formData.append('key', `${this.loginOutput.upload_map.path}asset/${type}/${brandId}/${assetId}/original`)
      } else {
        formData.append('key', `${this.loginOutput.upload_map.path}asset/${type}/${assetId}/original`)
      }
      formData.append('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(isFile ? (files[i] as File).name : 'original')}`)
      formData.append('x-amz-meta-tn', needCompressed ? this.userId : (isShadow ? `${this.userId},2` : `${this.userId},1`))
      const xhr = new XMLHttpRequest()

      const file = isFile ? files[i] : generalUtils.dataURLtoBlob(files[i] as string)
      if (formData.has('file')) {
        formData.set('file', file)
      } else {
        formData.append('file', file)
      }

      const assetHandler = (src: string, imgType?: string) => {
        if (type === 'image') {
          const img = new Image()
          img.src = src
          const isUnknown = imgType === 'unknown'
          const imgCallBack = (src: string) => {
            store.commit('file/SET_UPLOADING_IMGS', {
              id: assetId,
              adding: true,
              pageIndex: pageUtils.currFocusPageIndex
            })
            if (addToPage) {
              assetUtils.addImage(src, isUnknown ? 1 : img.width / img.height, {
                pageIndex: pageUtils.currFocusPageIndex,
                // The following props is used for preview image during polling process
                isPreview: true,
                assetId
              })
            }
            xhr.open('POST', this.loginOutput.upload_map.url, true)
            let increaseInterval = undefined as any
            if (!isShadow) {
              store.commit('file/ADD_PREVIEW', {
                width: isUnknown ? 250 : img.width,
                height: isUnknown ? 250 : img.height,
                src,
                assetId: assetId
              })
              xhr.upload.onprogress = (event) => {
                const uploadProgress = Math.floor(event.loaded / event.total * 100)
                store.commit('file/UPDATE_PROGRESS', {
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
            }
            xhr.send(formData)
            xhr.onerror = networkUtils.notifyNetworkError
            xhr.onload = () => {
              // polling the JSON file of uploaded image
              const interval = setInterval(() => {
                const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json?ver=${generalUtils.generateRandomString(6)}`
                fetch(pollingTargetSrc).then((response) => {
                  if (response.status === 200) {
                    clearInterval(interval)
                    clearInterval(increaseInterval)
                    response.json().then((json: IUploadAssetResponse) => {
                      if (json.flag === 0) {
                        const { width, height, asset_index } = json.data
                        if (type === 'image') {
                          if (!isShadow) {
                            store.commit('file/UPDATE_PROGRESS', {
                              assetId: assetId,
                              progress: 100
                            })
                            store.commit('file/UPDATE_IMAGE_URLS', { assetId, urls: json.url, assetIndex: asset_index, ...(isUnknown && { width, height }) })
                          }
                          store.commit('DELETE_previewSrc', { type: this.isAdmin ? 'public' : 'private', userId: this.userId, assetId, assetIndex: json.data.asset_index })
                          store.commit('file/SET_UPLOADING_IMGS', { id: assetId, adding: false })
                          if (pollingCallback) {
                            pollingCallback(json)
                          }
                        }
                      } else {
                        store.commit('file/DEL_PREVIEW', { assetId })
                        LayerUtils.deleteLayerByAssetId(assetId)
                        paymentUtils.errorHandler(json.msg)
                      }
                    })
                  }
                })
              }, 2000)
            }
          }
          if (!isUnknown) {
            img.onload = (evt) => {
              imgCallBack(img.src)
            }
          } else {
            imgCallBack(require('@/assets/img/svg/image-preview.svg'))
          }
        } else if (type === 'font') {
          const tempId = brandkitUtils.createTempFont(assetId)
          xhr.open('POST', this.loginOutput.upload_map.url, true)
          xhr.send(formData)
          xhr.onerror = networkUtils.notifyNetworkError
          xhr.onload = () => {
            // polling the JSON file of uploaded image
            const interval = setInterval(() => {
              const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json?ver=${generalUtils.generateRandomString(6)}`
              fetch(pollingTargetSrc).then((response) => {
                if (response.status === 200) {
                  clearInterval(interval)
                  response.json().then((json: IUploadAssetFontResponse) => {
                    if (json.flag === 0) {
                      this.emitFontUploadEvent('success')
                      console.log('Successfully upload the file')
                      brandkitUtils.replaceFont(tempId, json.data)
                      setTimeout(() => {
                        this.emitFontUploadEvent('none')
                      }, 2000)
                    } else {
                      paymentUtils.errorHandler(json.msg)
                      brandkitUtils.deleteFont(tempId)
                    }
                  })
                }
              })
            }, 2000)
          }
        } else if (type === 'avatar') {
          xhr.open('POST', this.loginOutput.upload_map.url, true)
          xhr.send(formData)
          modalUtils.setIsPending(true)
          modalUtils.setModalInfo(`${i18n.t('NN0136')}`, [])
          xhr.onerror = networkUtils.notifyNetworkError
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
                      modalUtils.setModalInfo(`${i18n.t('NN0224')}`, [])
                    } else {
                      modalUtils.setModalInfo(`${i18n.t('NN0223')}`, [])
                    }
                    modalUtils.setIsPending(false)
                  })
                }
              })
            }, 2000)
          }
        } else if (type === 'logo') {
          if (!brandId) return
          const tempId = brandkitUtils.createTempLogo(brandId, assetId)
          xhr.open('POST', this.loginOutput.upload_map.url, true)
          xhr.send(formData)
          xhr.onerror = networkUtils.notifyNetworkError
          xhr.onload = () => {
            // polling the JSON file of uploaded image
            const interval = setInterval(() => {
              const pollingTargetSrc = `https://template.vivipic.com/export/${this.teamId}/${assetId}/result.json?ver=${generalUtils.generateRandomString(6)}`
              fetch(pollingTargetSrc).then((response) => {
                if (response.status === 200) {
                  clearInterval(interval)
                  response.json().then((json: IUploadAssetLogoResponse) => {
                    if (json.flag === 0) {
                      Vue.notify({
                        group: 'copy',
                        text: `${i18n.t('NN0135')}`
                      })
                      console.log('Successfully upload the file')
                      brandkitUtils.replaceLogo(tempId, json.data, brandId)
                    } else {
                      paymentUtils.errorHandler(json.msg)
                      brandkitUtils.deleteLogo(brandId, tempId)
                    }
                  })
                }
              })
            }, 2000)
          }
        }
      }
      if (isFile) {
        generalUtils.getFileImageTypeByByte(files[i] as File).then((imgType: string) => {
          reader.onload = (evt) => {
            assetHandler(evt.target?.result as string, imgType)
          }
          reader.readAsDataURL(files[i] as File)
        })
      } else {
        assetHandler(files[i] as string)
      }
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
    xhr.onerror = networkUtils.notifyNetworkError
    xhr.onload = () => {
      // console.log(xhr)
    }
  }

  async uploadDesign(putAssetDesignType?: PutAssetDesignType) {
    const typeMap = ['UPDATE_DB', 'UPDATE_PREV', 'UPDATE_BOTH']
    let type = router.currentRoute.query.type
    let designId = router.currentRoute.query.design_id
    let teamId = router.currentRoute.query.team_id
    let isNewDesign = false
    // const exportIds = router.currentRoute.query.export_ids
    const assetId = this.assetId.length !== 0 ? this.assetId : generalUtils.generateAssetId()

    if (this.isGettingDesign) {
      return
    }
    logUtils.setLog(`Query Info:
      type: ${type},
      designId: ${designId}
      teamId: ${teamId},
      needAppendQuery: ${!type || !designId || !teamId}`)

    if (!type || !designId || !teamId) {
      logUtils.setLog(`Append Query & Upload BOTH:
      AssetId: ${assetId},
      TeamId: ${teamId}`)
      putAssetDesignType = PutAssetDesignType.UPDATE_BOTH
      router.replace({ query: Object.assign({}, router.currentRoute.query, { type: 'design', design_id: assetId, team_id: this.teamId }) })
      type = router.currentRoute.query.type
      designId = router.currentRoute.query.design_id
      teamId = router.currentRoute.query.team_id
      isNewDesign = true
    }

    store.commit('SET_assetId', assetId)
    const pages = generalUtils.deepCopy(pageUtils.getPages) as Array<IPage>

    logUtils.setLog(`Upload Design:
      Type: ${putAssetDesignType ? typeMap[putAssetDesignType] : 'UPLOAD JSON'}
      AssetId: ${assetId},
      TeamId: ${teamId}
      PageNum: ${pages.length}`)

    const pagesJSON = pages.map((page: IPage) => {
      const newPage = this.default(page)
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
      pages: pagesJSON,
      groupId: store.state.groupId,
      groupType: store.state.groupType,
      exportIds: this.exportIds
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
      .then(async () => {
        if (this.designStatusTimer !== -1) {
          clearTimeout(this.designStatusTimer)
        }
        this.designStatusTimer = setTimeout(() => {
          this.emitDesignUploadEvent('success')
        }, 300)
        if (putAssetDesignType !== undefined) {
          logUtils.setLog(`Put asset design (Type: ${typeMap[putAssetDesignType]})`)
          const resPutAssetDesign = await store.dispatch('user/putAssetDesign', {
            assetId,
            type: putAssetDesignType,
            wait: 1
          })
          const { flag } = resPutAssetDesign
          if (flag !== 0) {
            Vue.notify({ group: 'error', text: `${i18n.t('NN0360')}` })
            return
          }

          // move new design to path
          const path = router.currentRoute.query.path as string
          if (isNewDesign && path) {
            const designAssetIndex = (await store.dispatch('design/fetchDesign', { teamId, assetId })).asset_index?.toString()
            if (!designAssetIndex) {
              Vue.notify({ group: 'error', text: `${i18n.t('NN0360')}` })
              return
            }
            await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
              'move', designAssetIndex, null, path).catch(async err => {
              // remove design if move failed
              console.error(err)
              await designApis.updateDesigns(designApis.getToken(), designApis.getLocale(), designApis.getUserId(),
                'delete', designAssetIndex, null, '2').catch(err => {
                console.error(err)
              })
              Vue.notify({ group: 'error', text: `${i18n.t('NN0360')}` })
            })
            // update design info
            designUtils.fetchDesign(teamId as string, assetId)
            // remove query for new design
            const query = Object.assign({}, router.currentRoute.query)
            delete query.width
            delete query.height
            delete query.path
            delete query.folderName
            router.replace({ query })
          }
          Vue.notify({ group: 'copy', text: `${i18n.t('NN0357')}` })
        }
      })
      .catch(async (error) => {
        // Error: 403: Forbidden
        logUtils.setLog(`Failed: ${error}`)
        console.error(error)
        await store.dispatch('user/login', { token: this.token })
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
    xhr.onerror = networkUtils.notifyNetworkError
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

  uploadLayer(type: string, id?: string) {
    const targetBucket = type === 'shape' ? 'svg' : type
    const designId = id ?? generalUtils.generateRandomString(20)
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

    // const layerInfo = generalUtils.deepCopy(currSelectedInfo.layers[0])
    // Object.assign(layerInfo, { active: false })
    // this.removeComputableInfo(layerInfo)
    const layerInfo = this.layerInfoFilter(generalUtils.deepCopy(currSelectedInfo.layers[0]))

    const blob = new Blob([JSON.stringify(layerInfo)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)
    xhr.onerror = networkUtils.notifyNetworkError
    xhr.onload = () => {
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      const pageJSON = generalUtils.deepCopy(store.getters.getPage(currSelectedInfo.pageIndex)) as IPage
      const targetLayer = this.layerInfoFilter(pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)[0])
      // const targetLayer = pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)[0]
      // targetLayer.active = false
      // targetLayer.isTyping = false
      // targetLayer.locked = false
      // targetLayer.dragging = false
      // targetLayer.editing = false
      // this.removeComputableInfo(targetLayer)

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
        navigator.clipboard.writeText(designId)
        modalUtils.setModalInfo('上傳成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`, '已複製 Design ID 到剪貼簿'])
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

    const layerInfo = this.layerInfoFilter(generalUtils.deepCopy(currSelectedInfo.layers[0]))
    // layerInfo.active = false
    // layerInfo.isTyping = false
    // layerInfo.locked = false
    // layerInfo.dragging = false
    // layerInfo.editing = false
    // this.layerInfoFilter(layerInfo)

    const blob = new Blob([JSON.stringify(layerInfo)], { type: 'application/json' })
    if (formData.has('file')) {
      formData.set('file', blob)
    } else {
      formData.append('file', blob)
    }

    xhr.open('POST', this.loginOutput.upload_admin_map.url, true)
    xhr.send(formData)
    xhr.onerror = networkUtils.notifyNetworkError
    xhr.onload = () => {
      const currSelectedInfo = store.getters.getCurrSelectedInfo
      const pageJSON = generalUtils.deepCopy(store.getters.getPage(currSelectedInfo.pageIndex)) as IPage
      // const targetLayer = pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)[0]
      // targetLayer.active = false
      // this.layerInfoFilter(targetLayer)
      const targetLayer = this.layerInfoFilter(pageJSON.layers.slice(currSelectedInfo.index, currSelectedInfo.index + 1)[0])
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
        navigator.clipboard.writeText(designId)
        modalUtils.setModalInfo('更新成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`, '已複製 Design ID 到剪貼簿'])
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

    const pageJSON = this.default(page)
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

    modalUtils.setIsPending(true)
    modalUtils.setModalInfo('上傳中', [])
    xhr.onerror = networkUtils.notifyNetworkError
    xhr.onload = () => {
      navigator.clipboard.writeText(designId)
      modalUtils.setIsPending(false)
      modalUtils.setModalInfo('上傳成功', [`Design ID: ${designId}`, `Status code: ${xhr.status}`, '已複製 Design ID 到剪貼簿'])
    }
  }

  async updateTemplate() {
    const pageIndex = pageUtils.currFocusPageIndex
    const designId = store.getters.getPage(pageIndex).designId
    if (this.isOutsourcer) {
      const res = await designInfoApis.getDesignInfo(this.token, 'template', designId, 'select', JSON.stringify({}))
      const { creator_id: creatorId } = res.data
      if (creatorId !== this.userId) {
        modalUtils.setModalInfo('更新失敗', ['無法更新他人模板'])
        return
      }
    }

    const pageJSON = this.default(store.getters.getPage(pageIndex))
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
    modalUtils.setIsPending(true)
    modalUtils.setModalInfo('更新模板中', [])
    xhr.onerror = networkUtils.notifyNetworkError
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

  private default(page: any): IPage {
    page = generalUtils.deepCopy(page)
    const basicDefault = (layer: any) => {
      layer.moved = false
      layer.shown = false
      layer.dragging = false
      layer.active = false
    }

    if (page.id) {
      delete page.id
    }

    if (page.backgroundImage.config.src) {
      const src = page.backgroundImage.config.src as string
      const type = ImageUtils.getSrcType(page.backgroundImage.config.src as any)
      page.backgroundImage.config.srcObj = {
        type,
        userId: ImageUtils.getUserId(src, type),
        assetId: ImageUtils.getAssetId(src, type),
        brandId: ImageUtils.getBrandId(src, type)
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
          layer.imgControl = false
          break
        case 'tmp': { // If there is group layer in tmp layer, cancel tmp layer.
          page.layers.splice(index, 1, ...groupUtils.mapLayersToPage((layer as ITmp).layers, layer as ITmp))
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
    page.isAutoResizeNeeded = false
    return page
  }

  async getDesign(type: string, designParams: { designId?: string, teamId?: string, signedUrl?: string, fetchTarget?: string }, params: { [index: string]: any } = {}) {
    let jsonName = ''
    let fetchTarget = ''
    const designId = designParams.designId ?? ''
    const teamId = designParams.teamId ?? this.teamId
    this.isGettingDesign = true
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
        fetchTarget = designParams.fetchTarget ? `${designParams.fetchTarget}&ver=${generalUtils.generateRandomString(6)}` : `https://template.vivipic.com/admin/${teamId}/asset/design/${designId}/${jsonName}?ver=${generalUtils.generateRandomString(6)}`
        break
      }

      case GetDesignType.PRODUCT_PAGE_TEMPLATE: {
        return listService.getList({ type: 'group', groupId: designId, cache: true })
          .then(result => {
            const { content } = result.data.data
            return new Promise<IListServiceContentData[]>((resolve) => {
              assetUtils.addTemplateToRecentlyUsedPure(content[0].list[0].id)
                .then(() => resolve(content))
            })
          })
          .then(content => {
            store.commit('SET_groupType', 1)
            return assetUtils.addGroupTemplate({
              id: '',
              type: 6,
              ver: 0,
              content_ids: content[0].list,
              group_id: designId
            })
          })
          .then(() => {
            // Reference from designUtils.newDesignWithTemplae
            store.commit('SET_assetId', generalUtils.generateAssetId())
            const query = _.omit(router.currentRoute.query,
              ['width', 'height'])
            query.type = 'design'
            query.design_id = uploadUtils.assetId
            query.team_id = uploadUtils.teamId

            router.replace({ query }).then(() => {
              uploadUtils.uploadDesign(uploadUtils.PutAssetDesignType.UPDATE_BOTH)
            })
            themeUtils.refreshTemplateState()
            stepsUtils.reset()
            this.isGettingDesign = false
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
          console.log('failed to get design')
          logUtils.setLog('Fail to get design')
          themeUtils.refreshTemplateState()
          router.replace({ query: Object.assign({}) })
          this.isGettingDesign = false
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
                if (router.currentRoute.query.team_id === this.teamId) {
                  store.commit('SET_assetId', designId)
                } else {
                  const id = generalUtils.generateAssetId()
                  store.commit('SET_assetId', id)
                  router.replace({ query: Object.assign({}, router.currentRoute.query, { design_id: id, team_id: this.teamId }) })
                }
                /**
                 * @todo fix the filter function below
                 */
                // json.pages = pageUtils.filterBrokenImageLayer(json.pages)
                router.replace({ query: Object.assign({}, router.currentRoute.query, { export_ids: json.exportIds }) })
                pageUtils.setAutoResizeNeededForPages(json.pages, true)
                store.commit('SET_pages', Object.assign(json, { loadDesign: true }))
                stepsUtils.reset() // make sure to record and upload json right away after json fetched, so that no temp state is uploaded.
                store.commit('file/SET_setLayersDone')
                logUtils.setLog(`Successfully get asset design (pageNum: ${json.pages.length})`)
                themeUtils.refreshTemplateState()
                break
              }
              case GetDesignType.NEW_DESIGN_TEMPLATE: {
                designUtils.newDesignWithTemplae(Number(params.width), Number(params.height), json, designId, params.groupId)
                logUtils.setLog('Successfully get new design template')
                break
              }
            }
          }).then(() => {
            this.isGettingDesign = false
            const editorView = document.querySelector('.editor-view') as HTMLElement
            if (editorUtils) {
              pageUtils.fitPage()
              generalUtils.scrollToCenter(editorView, false)
            }
          })
        }
      })
      .catch((err) => {
        router.replace({ query: Object.assign({}) })
        this.isGettingDesign = false
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

  prepareJsonToUpload(pages: IPage[]): IPage[] {
    return pages.map((page: IPage) => {
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
        delete styles.shadow.old
        return {
          ...general,
          imgX: styles.imgX,
          imgY: styles.imgY,
          imgWidth: styles.imgWidth,
          imgHeight: styles.imgHeight,
          shadow: styles.shadow,
          ...(Object.prototype.hasOwnProperty.call(styles, 'adjust') && { adjust: { ...styles.adjust } })
        }
      case 'text':
        return {
          ...general,
          writingMode: styles.writingMode,
          align: styles.align,
          textEffect: styles.textEffect,
          textBg: styles.textBg,
          textShape: styles.textShape,
          type: styles.type,
          userId: styles.userId
        }
      case 'frame':
        return {
          ...general,
          ...(Object.prototype.hasOwnProperty.call(styles, 'adjust') && { adjust: { ...styles.adjust } }),
          ...(Object.prototype.hasOwnProperty.call(styles, 'shadow') && { shadow: { ...styles.shadow } })
        }
      case 'shape': {
        return {
          ...general,
          blendMode: styles.blendMode
        }
      }
      default:
        return general
    }
  }

  layerInfoFilter(layer: ILayer): any {
    switch (layer.type) {
      case 'image': {
        const image = layer as IImage
        const { type, srcObj, styles, trace } = image
        return {
          type,
          srcObj,
          trace,
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
        const { type, layers, styles, designId, db } = group
        const filteredLayers = layers
          .map(layer => {
            return this.layerInfoFilter(layer)
          })
        return {
          type,
          designId,
          db,
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

  uploadExportJSON(exportId: string, json?: any | string) {
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
        ExportIds: ${this.exportIds},
        UserId: ${this.userId}
        Url: ${this.loginOutput.upload_map.path}export/${exportId}/page.json`)

      // this.resetControlStates(pagesJSON)
      const blob = new Blob([JSON.stringify(this.getPageJson(json))], { type: 'application/json' })
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

  getPageJson(json?: any): any {
    // ref: uploadUtils.ts:L466
    const pagesJSON = (generalUtils.deepCopy(json || store.getters.getPages)).map((page: IPage) => {
      const newPage = this.default(page)
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
    return pagesJSON
  }

  getSinglePageJson(page: IPage): any {
    const pagesJSON = this.getPageJson([page])
    return pagesJSON[0]
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

  polling(targetSrc: string, callback: (json: any) => boolean, retryLimit = this.DEFAULT_POLLING_RETRY_LIMIT, retryTime = 0) {
    const interval = setInterval(() => {
      if (retryTime === retryLimit) {
        clearInterval(interval)
        console.log('Polling failed')
        return
      }
      retryTime += 1
      fetch(`${targetSrc}?ver=${generalUtils.generateRandomString(6)}`).then((response) => {
        if (response.status === 200) {
          response.json().then((json: IUploadAssetResponse) => {
            if (callback(json)) {
              clearInterval(interval)
            }
          })
        }
      })
    }, 2000)
  }

  resetControlStates(json: IPage[]) {
    for (const page of json) {
      for (const layer of page.layers) {
        switch (layer.type) {
          case 'text':
            layer.editing = false
            break
          case 'tmp':
          case 'group':
            for (const subLayer of (layer as IGroup).layers) {
              if (subLayer.type === 'text') {
                subLayer.editing = false
              }
            }
            break
        }
      }
    }
  }
}

const uploadUtils = new UploadUtils()
export default uploadUtils
