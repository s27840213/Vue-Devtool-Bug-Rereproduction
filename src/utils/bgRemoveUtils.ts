import useCanvasUtils from '@/composable/useCanvasUtils'
import i18n from '@/i18n'
import { ICurrSelectedInfo } from '@/interfaces/editor'
import { IBgRemoveInfo } from '@/interfaces/image'
import { ShadowEffectType } from '@/interfaces/imgShadow'
import { IImage } from '@/interfaces/layer'
import { IUploadAssetResponse } from '@/interfaces/upload'
import store from '@/store'
import { LayerProcessType, LayerType, SidebarPanelType } from '@/store/types'
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
    console.log(info)
    store.commit('bgRemove/SET_autoRemoveResult', info)
  }

  private reduceBgrmRemain() {
    store.commit('payment/REDUCE_bgrmRemain')
  }

  setInBgRemoveMode(inBgRemoveMode: boolean) {
    store.commit('bgRemove/SET_inBgRemoveMode', inBgRemoveMode)
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
    store.dispatch('user/removeBg', { srcObj: targetLayer.srcObj, ...(isThirdPartyImage && { aspect }) }).then((data) => {
      if (data.flag === 0) {
        uploadUtils.polling(data.url, (json: any) => {
          console.log(json.flag, json.data)
          if (json.flag === 0 && json.data) {
            this.reduceBgrmRemain()
            const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
            const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')

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
            return true
          }
          if (json.flag === 1) {
            const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
            const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')

            if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
              layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
                inProcess: LayerProcessType.none
              })

              notify({ group: 'error', text: `${i18n.global.t('NN0349')}` })
            }

            return true
          }

          return false
        })
      } else {
        const targetPageIndex = pageUtils.getPageIndexById(targetPageId)
        const targetLayerIndex = layerUtils.getLayerIndexById(targetPageIndex, targetLayerId ?? '')

        if (targetPageIndex !== -1 && targetLayerIndex !== -1) {
          layerUtils.updateLayerProps(targetPageIndex, targetLayerIndex, {
            inProcess: false
          })
        }
        this.setIsProcessing(false)
        paymentUtils.errorHandler(data.msg)
      }
    })
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
    if (!this.modifiedFlag) {
      layerUtils.updateLayerProps(pageIndex, index, {
        srcObj: {
          type: this.isAdmin ? 'public' : 'private',
          userId: (this.autoRemoveResult as IBgRemoveInfo).teamId,
          assetId: this.isAdmin ? (this.autoRemoveResult as IBgRemoveInfo).id : (this.autoRemoveResult as IBgRemoveInfo).assetIndex
        },
        previewSrc: (this.autoRemoveResult as IBgRemoveInfo).urls.larg,
        trace: 1
      })
      const image = layerUtils.getLayer(pageIndex, index) as IImage
      if (image.type === LayerType.image) {
        if (image.styles.shadow.currentEffect !== ShadowEffectType.none) {
          const layerInfo = { pageIndex, layerIndex: index }
          const layerData = {
            config: image,
            layerInfo
          }
          imageShadowPanelUtils.handleShadowUpload(layerData, true)
          notify({ group: 'copy', text: `${i18n.global.t('NN0665')}` })
        }
      }
      store.commit('file/UPDATE_IMAGE_URLS', Object.assign({ assetId: this.autoRemoveResult.id }, this.autoRemoveResult))
      this.setInBgRemoveMode(false)
      this.setIsProcessing(false)
      pageUtils.setScaleRatio(this.prevPageScaleRatio)
      stepsUtils.record()
    } else {
      const { teamId, id } = (this.autoRemoveResult as IBgRemoveInfo)
      const privateId = (this.autoRemoveResult as IBgRemoveInfo).urls.larg.match(/asset\/image\/([\w]+)\/larg/)?.[1]
      const targetLayerStyle = layerUtils.getLayer(pageIndex, index).styles
      const { width, height } = targetLayerStyle
      const { trimCanvas } = useCanvasUtils(targetLayerStyle)
      const { canvas: trimedCanvas, remainingHeightPercentage, remainingWidthPercentage, xShift, yShift } = trimCanvas(this.canvas)
      const previewSrc = trimedCanvas.toDataURL('image/png;base64')

      const { pageId, layerId } = this.bgRemoveIdInfo
      layerUtils.updateLayerProps(pageIndex, index, {
        previewSrc,
        trace: 1
      })
      const newImageWidth = width * remainingWidthPercentage
      const newImageHeight = height * remainingHeightPercentage
      layerUtils.updateLayerStyles(pageIndex, index, {
        x: targetLayerStyle.x + xShift,
        y: targetLayerStyle.y + yShift,
        width: newImageWidth,
        height: newImageHeight,
        imgWidth: newImageWidth,
        imgHeight: newImageHeight,
        imgX: 0,
        imgY: 0
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
        tmpId: id
      })
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
              imageShadowPanelUtils.handleShadowUpload(layerData, true)
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
    }
  }
}

export default new BgRemoveUtils()
