import useBaseCanvas from '@/composable/useBaseCanvas'
import i18n from '@/i18n'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IBgRemoveInfo, ITrimmedCanvasInfo } from '@/interfaces/image'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IImage, IImageStyle } from '@/interfaces/layer'
import { IUploadAssetResponse } from '@/interfaces/upload'
import store from '@/store'
import { LayerProcessType, LayerType, SidebarPanelType } from '@/store/types'
import logUtils from '@/utils/logUtils'
import stkWVUtils from '@/utils/stkWVUtils'
import { notify } from '@kyvg/vue3-notification'
import editorUtils from './editorUtils'
import generalUtils from './generalUtils'
import imageShadowPanelUtils from './imageShadowPanelUtils'
import imageShadowUtils from './imageShadowUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import pageUtils from './pageUtils'
import paymentUtils from './paymentUtils'
import stepsUtils from './stepsUtils'
import uploadUtils from './uploadUtils'

class BgRemoveUtils {
  get prevPageScaleRatio(): number {
    return store.getters['bgRemove/getPrevPageScaleRatio']
  }

  get canvas(): HTMLCanvasElement {
    return store.getters['bgRemove/getCanvas']
  }

  get modifiedFlag(): boolean {
    return store.getters['bgRemove/getModifiedFlag']
  }

  get autoRemoveResult(): IBgRemoveInfo {
    return store.getters['bgRemove/getAutoRemoveResult']
  }

  get bgRemoveIdInfo(): { pageId: string, layerId: string } {
    return store.getters['bgRemove/getIdInfo']
  }

  get isAdmin(): boolean {
    return store.getters['user/isAdmin']
  }

  private setPrevScrollPos(pos: { top: number, left: number }) {
    store.commit('bgRemove/SET_prevScrollPos', pos)
  }

  private setAutoRemoveResult(info: IBgRemoveInfo) {
    store.commit('bgRemove/SET_autoRemoveResult', info)
  }

  private reduceBgrmRemain() {
    store.commit('payment/REDUCE_bgrmRemain')
  }

  setInBgRemoveMode(inBgRemoveMode: boolean) {
    store.commit('bgRemove/SET_inBgRemoveMode', inBgRemoveMode)
  }

  setPreviewImage(previewImage: { src: string, width: number, height: number }) {
    store.commit('bgRemove/SET_previewImage', previewImage)
  }

  private setLoading(bool: boolean) {
    store.commit('bgRemove/SET_loading', bool)
  }

  private setIsProcessing(isProcessing: boolean) {
    store.commit('bgRemove/SET_isProcessing', isProcessing)
  }

  private setIdInfo(idInfo: { pageId: string, layerId: string }) {
    store.commit('bgRemove/SET_idInfo', idInfo)
  }

  removeBg(): void {
    console.time('removeBg total time')
    logUtils.setLogAndConsoleLog('start removing bg')
    const { layers, pageIndex, index } = pageUtils.currSelectedInfo as ICurrSelectedInfo

    this.setIsProcessing(true)
    layerUtils.updateLayerProps(pageIndex, index, {
      inProcess: LayerProcessType.bgRemove
    })

    const targetLayer = layers[0] as IImage
    const targetPageId = pageUtils.currFocusPage.id
    const targetLayerId = targetLayer.id

    this.setIdInfo({
      pageId: targetPageId,
      layerId: targetLayerId
    })

    const type = targetLayer.srcObj.type

    const { imgWidth, imgHeight } = targetLayer.styles
    const aspect = imgWidth >= imgHeight ? 0 : 1
    const isThirdPartyImage = type === 'unsplash' || type === 'pexels'
    const initSrc = imageUtils.getSrc((pageUtils.currSelectedInfo as ICurrSelectedInfo).layers[0] as IImage, 'larg', undefined, true)
    logUtils.setLogAndConsoleLog('send API')
    console.time('send API')
    store.dispatch('user/removeBg', { srcObj: targetLayer.srcObj, ...(isThirdPartyImage && { aspect }) }).then((data) => {
      logUtils.setLogAndConsoleLog('get API response')
      console.timeEnd('send API')

      logUtils.setLogAndConsoleLog(JSON.stringify(data))
      if (data.flag === 0) {
        logUtils.setLogAndConsoleLog('API success, start polling')
        console.time('polling')
        uploadUtils.polling(data.url, (json: any) => {
          if (json.flag === 0 && json.data) {
            logUtils.setLogAndConsoleLog('polling success')
            this.reduceBgrmRemain()
            const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
            const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')
            logUtils.setLogAndConsoleLog(`pageIndex: ${targetPageIndex}, layerIndex: ${targetLayerIndex}`)

            if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
              layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
                inProcess: LayerProcessType.none
              })
              const editorView = document.querySelector('.editor-view')
              const { scrollTop, scrollLeft } = editorView as HTMLElement

              this.setPrevScrollPos({
                top: scrollTop,
                left: scrollLeft
              })
              this.setAutoRemoveResult(imageUtils.getBgRemoveInfo(json.data, initSrc))
              this.setInBgRemoveMode(true)
              editorUtils.setCurrActivePanel('remove-bg')
            }

            console.timeEnd('polling')
            console.timeEnd('removeBg total time')
            this.setIsProcessing(false)
            return true
          }
          if (json.flag === 1) {
            logUtils.setLogAndConsoleLog('polling failed')


            const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
            const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')
            logUtils.setLogAndConsoleLog(`pageIndex: ${targetPageIndex}, layerIndex: ${targetLayerIndex}`)

            if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
              layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
                inProcess: LayerProcessType.none
              })
              notify({ group: 'error', text: `${i18n.global.t('NN0349')}` })
            }

            console.timeEnd('polling')
            return true
          }

          return false
        })
      } else {
        logUtils.setLogAndConsoleLog('Bg remove failed')
        const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
        const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')
        logUtils.setLogAndConsoleLog(`pageIndex: ${targetPageIndex}, layerIndex: ${targetLayerIndex}`)

        if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
          layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
            inProcess: false
          })
        }
        paymentUtils.errorHandler(data.msg)
        this.setIsProcessing(false)
      }
    })
  }

  async removeBgStk(uuid: string, assetId: string, initSrc: string, initWidth: number, initHeight: number, type: string): Promise<void> {
    console.time('send API ~ get response time')

    this.setIsProcessing(true)
    this.setPreviewImage({ src: initSrc, width: initWidth, height: initHeight })
    logUtils.setLogAndConsoleLog('start removing bg')
    const data = await store.dispatch('user/removeBgStk', { uuid, assetId, type })
    console.timeEnd('send API ~ get response time')

    console.time('generate frontend data time')
    if (data.flag === 0) {
      editorUtils.setCurrActivePanel('remove-bg')
      logUtils.setLogAndConsoleLog('finish removing bg')
      const autoRemoveResult = await imageUtils.getBgRemoveInfoStk(data.url, initSrc)
      this.setAutoRemoveResult(autoRemoveResult)
      this.setInBgRemoveMode(true)
      this.setIsProcessing(false)
    } else {
      logUtils.setLogAndConsoleLog('failed to remove bg: ' + data.msg)
      notify({ group: 'error', text: data.msg })
      this.setIsProcessing(false)
      this.setPreviewImage({ src: '', width: 0, height: 0 })
    }
    console.timeEnd('generate frontend data time')
    console.timeEnd('removeBg total time')
    // duration_db => 確認使用者身份的資料庫查詢
    // duration_download => 從s3下載使用者要去背的圖到lambda
    // duration_process => 將圖片送給第三方去背api並接收結果
    // duration_upload => 將去背結果寫回s3，並產生前端可以下載的signed url
    const { duration_db, duration_download, duration_process, duration_upload } = data

    console.log(`total backend process time: ${duration_db + duration_download + duration_process + duration_upload}ms`)
    console.log(data)

    // return data
  }

  async removeBgCm(uuid: string, assetId: string, initSrc: string, initWidth: number, initHeight: number, type: string, alphaPercentages: number): Promise<void> {
    console.time('send API ~ get response time')

    this.setIsProcessing(true)
    this.setPreviewImage({ src: initSrc, width: initWidth, height: initHeight })
    logUtils.setLogAndConsoleLog('start removing bg')
    const data = alphaPercentages < 0.1 ? await store.dispatch('user/removeBgCm', { uuid, assetId, type }) : {
      flag: 0,
      url: initSrc,
      msg: ''
    }
    console.timeEnd('send API ~ get response time')

    // const data = {
    //   flag: 0,
    //   url: `https://template.vivipic.com/admin/NuVCei56OafXuls19X6r/asset/image/231113094035241OsdlRsXg/full?rand=${generalUtils.generateRandomString(4)}`,
    //   msg: ''
    // }

    if (data.flag === 0) {
      logUtils.setLogAndConsoleLog('finish removing bg')
      const autoRemoveResult = await imageUtils.getBgRemoveInfoStk(data.url, initSrc)
      this.setAutoRemoveResult(autoRemoveResult)
      this.setInBgRemoveMode(true)
      this.setIsProcessing(false)
    } else {
      logUtils.setLogAndConsoleLog('failed to remove bg: ' + data.msg)
      editorUtils.setCurrActivePanel('none')
      notify({ group: 'error', text: data.msg })
      this.setIsProcessing(false)
      this.setInBgRemoveMode(false)
      this.setPreviewImage({ src: '', width: 0, height: 0 })
    }
    // duration_db => 確認使用者身份的資料庫查詢
    // duration_download => 從s3下載使用者要去背的圖到lambda
    // duration_process => 將圖片送給第三方去背api並接收結果
    // duration_upload => 將去背結果寫回s3，並產生前端可以下載的signed url
    // const { duration_db, duration_download, duration_process, duration_upload } = data

    // console.log(`total backend process time: ${duration_db + duration_download + duration_process + duration_upload}ms`)
    // return data
  }

  cancel() {
    this.setIsProcessing(false)
    this.setInBgRemoveMode(false)
    pageUtils.setScaleRatio(this.prevPageScaleRatio)
    if (generalUtils.isTouchDevice()) {
      editorUtils.setCurrActivePanel('none')
    }
  }

  save() {
    const { index, pageIndex } = pageUtils.currSelectedInfo as ICurrSelectedInfo
    imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex: index }, { type: 'after-bg-remove', userId: '', assetId: '' })
    imageShadowUtils.updateEffectProps({ pageIndex, layerIndex: index }, { isTransparent: true })

    const { teamId, id } = (this.autoRemoveResult as IBgRemoveInfo)
    const privateId = (this.autoRemoveResult as IBgRemoveInfo).urls.larg.match(/asset\/image\/([\w]+)\/larg/)?.[1]
    const targetLayerStyle = layerUtils.getLayer(pageIndex, index).styles as IImageStyle
    const { trimCanvas } = useBaseCanvas(targetLayerStyle)
    const { remainingHeightPercentage, remainingWidthPercentage, xShift, yShift, cropJSON, bound } = trimCanvas(this.canvas)
    const previewSrc = this.canvas.toDataURL('image/png;base64')

    const { pageId, layerId } = this.bgRemoveIdInfo
    layerUtils.updateLayerProps(pageIndex, index, {
      previewSrc,
      trace: 1
    })
    layerUtils.updateLayerStyles(pageIndex, index, {
      x: targetLayerStyle.x + xShift,
      y: targetLayerStyle.y + yShift,
      ...this.getTrimmedCropStyles(targetLayerStyle, {
        percentage: { w: remainingWidthPercentage, h: remainingHeightPercentage },
        bound,
        originSize: { w: this.canvas.width, h: this.canvas.height },
      })
    })
    this.setInBgRemoveMode(false)
    pageUtils.setScaleRatio(this.prevPageScaleRatio)
    // If the result image is still uploading, we need to prevent the bg-remove btn from being clicked.
    // The reason is if the image is still uploading, then the image in the page is dataUrl.
    // So we need to set isProcessing to true
    this.setIsProcessing(true)
    store.commit('SET_currSidebarPanelType', SidebarPanelType.file)
    const targetPageIndex = pageUtils.getPageIndexById(pageId)
    const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, layerId)
    layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
      tmpId: id,
      srcObj: {
        type: '',
        userId: '',
        assetId: ''
      }
    })
    try{
      uploadUtils.uploadAsset('image', [previewSrc], {
        addToPage: false,
        pollingCallback: (json: IUploadAssetResponse) => {
          const targetPageIndex = pageUtils.getPageIndexById(pageId)
          const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, layerId)
          const srcObj = {
            type: this.isAdmin ? 'public' : 'private',
            userId: teamId,
            assetId: this.isAdmin ? json.data.id : json.data.asset_index
          }
          layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
            srcObj,
            trace: 1
          })
          store.commit('DELETE_previewSrc', {
            type: this.isAdmin ? 'public' : 'private',
            userId: teamId,
            assetId: this.isAdmin ? json.data.id : json.data.asset_index,
            assetIndex: json.data.asset_index
          })
          const image = layerUtils.getLayer(pageIndex, index) as IImage
          if (image.type === LayerType.image) {
            if (image.styles.shadow.currentEffect !== ShadowEffectType.none) {
              const layerInfo = { pageIndex: targetPageIndex, layerIndex: targetLayerIndex }
              const layerData = {
                config: image,
                layerInfo
              }
              imageShadowPanelUtils.handleShadowUpload({ layerData, forceUpload: true })
              notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
            }
          }
          stepsUtils.record()
          this.setLoading(false)
          this.setIsProcessing(false)
        },
        id: id ?? privateId,
        needCompressed: false,
        pollingJsonName: 'result2.json'
      })
    } catch (error) {
      console.log(error)
    }
  }

  getTrimmedCropStyles(styles: IImageStyle, data: {
    percentage: { w: number, h: number },
    bound: { top: number, left: number, right: number, bottom: number }
    originSize: { w: number, h: number }
  }) {
    const { percentage, bound, originSize } = data
    const trimmedSizeRatio = (bound.right - bound.left) / (bound.bottom - bound.top)
    const width = styles.width * percentage.w
    const height = width / trimmedSizeRatio
    const imgWidth = width / percentage.w
    const imgHeight = height / percentage.h
    const imgX = -bound.left / originSize.w * imgWidth
    const imgY = -bound.top / originSize.h * imgHeight
    return { width, height, imgWidth, imgHeight, imgX, imgY }
  }

  downloadCanvas() {
    const src = this.canvas.toDataURL('image/png;base64')

    generalUtils.downloadImage(src, `vivistiker-${generalUtils.generateRandomString}.png`)
  }

  getBgRemoveResultSrc() {
    return this.canvas.toDataURL('image/png;base64')
  }

  getTrimmedCanvasInfo(targetLayerStyle?: IImageStyle) {
    const { trimCanvas } = useBaseCanvas(targetLayerStyle)
    const trimmedCanvasInfo = trimCanvas(this.canvas)
    return trimmedCanvasInfo
  }

  // #region used for vivisticker
  screenshot() {
    const src = this.canvas.toDataURL('image/png;base64')
    stkWVUtils.sendToIOS('COPY_IMAGE_FROM_URL', {
      type: 'png',
      url: src
    })
  }

  // this is for IOS version < 1.35
  saveToIOSOld(callback?: (data: { flag: string, msg: string, imageId: string }, assetId: string, aspectRatio: number, trimCanvasInfo: ITrimmedCanvasInfo) => any, targetLayerStyle?: IImageStyle) {
    const { trimCanvas } = useBaseCanvas(targetLayerStyle)
    const trimmedCanvasInfo = trimCanvas(this.canvas)
    const { canvas: trimedCanvas, width, height } = trimmedCanvasInfo
    const src = trimedCanvas.toDataURL('image/png;base64')

    const assetId = generalUtils.generateAssetId()
    return stkWVUtils.callIOSAsAPI('SAVE_IMAGE_FROM_URL', { type: 'png', url: src, key: 'bgRemove', name: assetId, toast: false }, 'save-image-from-url').then((data) => {
      const _data = data as { flag: string, msg: string, imageId: string }
      if (callback) {
        return callback(_data, assetId, width / height, trimmedCanvasInfo)
      }
    })
  }

  saveToIOS(designId:string, callback?: (data: { flag: string, msg: string, imageId: string }, path: string, aspectRatio: number, trimCanvasInfo: ITrimmedCanvasInfo) => any, targetLayerStyle?: IImageStyle) {
    const { trimCanvas } = useBaseCanvas(targetLayerStyle)
    const trimmedCanvasInfo = trimCanvas(this.canvas)
    const { canvas: trimedCanvas, width, height } = trimmedCanvasInfo
    const src = trimedCanvas.toDataURL('image/png;base64')

    const name = generalUtils.generateAssetId()

    const key = `mydesign-${stkWVUtils.mapEditorType2MyDesignKey(stkWVUtils.editorType)}`
    return stkWVUtils.callIOSAsAPI('SAVE_IMAGE_FROM_URL', { type: 'png', url: src, key, name, toast: false, designId }, 'save-image-from-url').then((data) => {
      const _data = data as { flag: string, msg: string, imageId: string }
      if (callback) {
        return callback(_data, `${key}/${designId}/${name}`, width / height, trimmedCanvasInfo)
      }
    })
  }


  moveOldBgRemoveImages(src: string, callback?: (path: string) => void) {
    const key = `mydesign-${stkWVUtils.mapEditorType2MyDesignKey(stkWVUtils.editorType)}`
    const editingDesignId = store.getters['vivisticker/getEditingDesignId']
    const name = generalUtils.generateAssetId()
    return stkWVUtils.callIOSAsAPI('SAVE_IMAGE_FROM_URL', { type: 'png', url: src, key, name, toast: false, designId: editingDesignId }, 'save-image-from-url').then((data) => {
      if (callback) {
        const path = `${key}/${editingDesignId}/${name}`
        return callback(path)
      }
    })
  }
  // #endregion

  exportCanvasResultInfo(targetLayerStyle?: IImageStyle) {
    const { trimCanvas } = useBaseCanvas(targetLayerStyle)
    const trimmedCanvasInfo = trimCanvas(this.canvas)
    const { canvas: trimedCanvas, width, height } = trimmedCanvasInfo
    const src = trimedCanvas.toDataURL('image/png;base64')

    return {
      src,
      width,
      height,
      aspectRatio: width / height,
      trimmedCanvasInfo
    }
  }

  undo() {
      // BgRemoveArea will listen to Ctrl/Cmd + Z event, so I dispatch an event to make the undo function in BgRemoveArea.vue conducted
      const event = new KeyboardEvent('keydown', {
        ctrlKey: true,
        metaKey: true,
        shiftKey: false,
        key: 'z',
        repeat: false
      })
      window.dispatchEvent(event)
  }

  redo() {
    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      key: 'z',
      repeat: false
    })
    window.dispatchEvent(event)
  }
}

export default new BgRemoveUtils()
