import { IBlurEffect, IFloatingEffect, IImageMatchedEffect, IShadowEffect, IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { ColorEventType, FunctionPanelType, LayerProcessType, LayerType } from '@/store/types'
import colorUtils from './colorUtils'
import imageShadowUtils, { CANVAS_SIZE, CANVAS_SPACE, fieldRange } from './imageShadowUtils'
import layerUtils from './layerUtils'
import pageUtils from './pageUtils'
import store from '@/store'
import { IGroup, IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import generalUtils from './generalUtils'
import stepsUtils from './stepsUtils'
import imageUtils from './imageUtils'
import uploadUtils from './uploadUtils'
import { IUploadAssetResponse } from '@/interfaces/upload'
import logUtils from './logUtils'
import shadow from '@/store/module/shadow'

export default new class ImageShadowPanelUtils {
  private get fieldRange() {
    return fieldRange
  }

  get currentStyle(): IImageStyle {
    const { styles } = layerUtils.getCurrConfig as IImage
    return styles || {}
  }

  get currentEffect(): ShadowEffectType {
    const { shadow } = this.currentStyle as IImageStyle
    if (shadow) {
      return shadow.currentEffect || ShadowEffectType.none
    }
    return ShadowEffectType.none
  }

  mount() {
    colorUtils.on(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    store.commit('SET_currFunctionPanelType', FunctionPanelType.photoShadow)
    const target = layerUtils.getCurrConfig as IImage
    if (target && target.type === LayerType.image) {
      if (typeof layerUtils.subLayerIdx !== 'undefined' && layerUtils.subLayerIdx !== -1) {
        imageShadowUtils.setHandleId({
          pageId: pageUtils.currFocusPage.id,
          layerId: layerUtils.getCurrLayer.id || '',
          subLayerId: target.id || ''
        })
      } else {
        imageShadowUtils.setHandleId({
          pageId: pageUtils.currFocusPage.id,
          layerId: target.id || '',
          subLayerId: ''
        })
      }
    } else {
      console.error('The layer should be image layer')
    }
  }

  checkIfSameEffect(config: IImage) {
    if (config.type !== LayerType.image) return false

    const shadow = config.styles.shadow
    if (!shadow.srcState) {
      return false
    } else {
      const currentEffect = shadow.currentEffect
      return currentEffect !== ShadowEffectType.none &&
        shadow.currentEffect === shadow.srcState.effect &&
        shadow.effects.color === shadow.srcState.effects.color &&
        Object.entries(shadow.effects[currentEffect] as IShadowEffect | IBlurEffect | IFloatingEffect | IImageMatchedEffect)
          .every(([k, v]) => {
            return (shadow.srcState as any).effects[currentEffect][k] === v
          }) &&
        (!shadow.isTransparent ||
          (
            shadow.srcState.layerState && Object.entries(shadow.srcState.layerState)
              .every(([k, v]) => {
                return (config.styles as any)[k] === v
              })
          )
        ) &&
        (shadow.currentEffect !== ShadowEffectType.imageMatched ||
          (
            shadow.srcState.srcObj.type === config.srcObj.type &&
            shadow.srcState.srcObj.userId === config.srcObj.userId &&
            shadow.srcState.srcObj.assetId === config.srcObj.assetId
          )
        )
    }
  }

  async handleShadowUpload(_layerData?: any) {
    colorUtils.event.off(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    const layerData = _layerData ?? imageShadowUtils.layerData
    logUtils.setLog('phase: start upload shadow')
    console.log(layerData)
    if (layerData) {
      imageShadowUtils.setUploadProcess(true)
      const { config: _config, primarylayerId, pageId } = layerData
      const config = generalUtils.deepCopy(_config) as IImage
      const layerId = primarylayerId || config.id || ''
      const subLayerId = primarylayerId ? config.id : ''
      const { pageIndex: _pageIndex, layerIndex: _layerIndex, subLayerIdx: _subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
      /** If the shadow effct has already got the img src, return */

      if (config.type !== LayerType.image) {
        return
      }
      if (this.checkIfSameEffect(config) && config.styles.shadow.srcState) {
        const { srcObj } = config.styles.shadow.srcState
        const layerInfo = {
          pageIndex: _pageIndex,
          layerIndex: _layerIndex,
          subLayerIdx: _subLayerIdx
        }
        imageShadowUtils.updateShadowSrc(layerInfo, srcObj)
        imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
        return
      }
      if (primarylayerId) {
        this.setIsUploading(pageId, primarylayerId, config.id as string, true)
      } else {
        this.setIsUploading(pageId, config.id as string, '', true)
      }
      /** uploadAssetId used to identify the upload-shadow-img in undo/redo step */
      const uploadAssetId = generalUtils.generateRandomString(6)
      this.setUploadingData({ pageId, layerId, subLayerId }, uploadAssetId)
      stepsUtils.record()

      const assetId = generalUtils.generateAssetId()
      store.commit('file/SET_UPLOADING_IMGS', {
        id: assetId,
        adding: true,
        pageIndex: _pageIndex
      })

      imageShadowUtils.setUploadId({
        pageId: pageId,
        layerId: primarylayerId || config.id || '',
        subLayerId: primarylayerId ? config.id || '' : ''
      })

      // Handle the params for drawing
      const img = new Image()
      let MAXSIZE = 1600
      img.crossOrigin = 'anonynous'
      img.src = imageUtils.getSrc(config, ['private', 'public', 'logo-private', 'logo-public', 'background'].includes(config.srcObj.type) ? 'larg' : 1600)
      img.src += `${img.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      await new Promise<void>((resolve) => {
        img.onload = async () => {
          const isSVG = await this.isSVG(img, config)
          if (isSVG) {
            await this.svgImageSizeFormatter(img, () => {
              img.onload = () => {
                MAXSIZE = Math.max(img.naturalWidth, img.naturalHeight)
                resolve()
              }
            })
          } else {
            MAXSIZE = Math.max(img.naturalWidth, img.naturalHeight)
            resolve()
          }
        }
      })

      logUtils.setLog('phase: finish load max size img')
      const updateCanvas = document.createElement('canvas')
      const { width, height, imgWidth, imgHeight } = config.styles
      const drawCanvasW = width / imgWidth * img.naturalWidth
      const drawCanvasH = height / imgHeight * img.naturalHeight
      let spaceScale = Math.max((height > width ? height : width) / CANVAS_SIZE, 0.3)
      const _canvasW = (width + CANVAS_SPACE * spaceScale)
      const _canvasH = (height + CANVAS_SPACE * spaceScale)
      const canvasRatio = _canvasH / _canvasW
      const canvasWOri = _canvasW >= _canvasH ? CANVAS_SIZE : CANVAS_SIZE / canvasRatio
      const canvasHOri = _canvasW < _canvasH ? CANVAS_SIZE : CANVAS_SIZE * canvasRatio
      const drawCanvasWOri = width * canvasWOri / _canvasW
      const drawCanvasHOri = height * canvasHOri / _canvasH

      spaceScale *= width > height ? CANVAS_SIZE / _canvasW : CANVAS_SIZE / _canvasH
      spaceScale *= imgWidth > imgHeight
        ? (width / imgWidth) * MAXSIZE / drawCanvasWOri
        : (height / imgHeight) * MAXSIZE / drawCanvasHOri

      const canvasW = drawCanvasW + CANVAS_SPACE * spaceScale
      const canvasH = drawCanvasH + CANVAS_SPACE * spaceScale
      updateCanvas.setAttribute('width', `${canvasW}`)
      updateCanvas.setAttribute('height', `${canvasH}`)
      console.log(updateCanvas.width, updateCanvas.height)
      console.log(drawCanvasW, drawCanvasH)
      switch (config.styles.shadow.currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.blur:
        case ShadowEffectType.frame: {
          await imageShadowUtils.drawShadow([updateCanvas], img, config, { timeout: 0, drawCanvasW, drawCanvasH })
          break
        }
        case ShadowEffectType.imageMatched:
          await imageShadowUtils.drawImageMatchedShadow([updateCanvas], img, config, { timeout: 0, drawCanvasW, drawCanvasH })
          break
        case ShadowEffectType.floating: {
          await imageShadowUtils.drawFloatingShadow([updateCanvas], img, config, { timeout: 0, drawCanvasW, drawCanvasH })
          break
        }
        case ShadowEffectType.none:
          return
        default:
          generalUtils.assertUnreachable(config.styles.shadow.currentEffect)
      }
      logUtils.setLog('phase: finish drawing')
      const { right, left, top, bottom } = await imageShadowUtils.getImgEdgeWidth(updateCanvas)
      const leftShadowThickness = ((updateCanvas.width - drawCanvasW) * 0.5 - left) / drawCanvasW
      const topShadowThickness = ((updateCanvas.height - drawCanvasH) * 0.5 - top) / drawCanvasH
      logUtils.setLog('phase: finish calculate edge')

      const uploadCanvas = document.createElement('canvas')
      uploadCanvas.setAttribute('width', (updateCanvas.width - left - right).toString())
      uploadCanvas.setAttribute('height', (updateCanvas.height - top - bottom).toString())
      const ctxUpload = uploadCanvas.getContext('2d') as CanvasRenderingContext2D
      ctxUpload.drawImage(updateCanvas, left, top, updateCanvas.width - right - left, updateCanvas.height - bottom - top, 0, 0, uploadCanvas.width, uploadCanvas.height)

      logUtils.setLog('phase: start uploading result')
      const uploadImg = [uploadCanvas.toDataURL('image/png;base64', 1)]
      uploadUtils.uploadAsset('image', uploadImg, {
        addToPage: false,
        needCompressed: false,
        id: assetId,
        isShadow: true,
        pollingCallback: (json: IUploadAssetResponse) => {
          logUtils.setLog('phase: finish uploading')
          const isAdmin = store.getters['user/isAdmin']
          imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
          imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
          const srcObj = {
            type: isAdmin ? 'public' : 'shadow-private',
            userId: json.data.team_id || '',
            assetId: isAdmin ? json.data.id || json.data.asset_index : json.data.asset_index
          }
          const _width = config.styles.width / config.styles.scale
          const _height = config.styles.height / config.styles.scale
          const newWidth = (updateCanvas.width - right - left) / drawCanvasW * _width
          const newHeight = (updateCanvas.height - top - bottom) / drawCanvasH * _height
          console.log(updateCanvas.width, right, left)
          console.log(newWidth, newHeight)
          new Promise<void>((resolve) => {
            if (!isAdmin) {
              store.dispatch('shadow/ADD_SHADOW_IMG', [srcObj.assetId], { root: true })
                .then(() => resolve())
            } else {
              resolve()
            }
          }).then(() => {
            const newImg = new Image()
            newImg.crossOrigin = 'anonynous'
            newImg.onload = () => {
              const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
              layerUtils.updateLayerProps(pageIndex, layerIndex, { isUploading: false, inProcess: LayerProcessType.none }, subLayerIdx)
              const shadowImgStyles = {
                imgWidth: newWidth,
                imgHeight: newHeight,
                imgX: newWidth * 0.5 - _width * (leftShadowThickness + 0.5),
                imgY: newHeight * 0.5 - _height * (topShadowThickness + 0.5)
              }
              /** update the upload img in shadow module */
              imageShadowUtils.addUploadImg({
                id: uploadAssetId,
                owner: { pageId, layerId, subLayerId },
                srcObj,
                styles: shadowImgStyles
              })
              imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, srcObj)
              imageShadowUtils.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, shadowImgStyles)
              const shadow = config.styles.shadow
              const layerState = shadow.isTransparent ? {
                imgWidth: config.styles.imgWidth,
                imgHeight: config.styles.imgHeight,
                imgX: config.styles.imgX,
                imgY: config.styles.imgY
              } : undefined
              imageShadowUtils.setShadowSrcState({ pageIndex, layerIndex, subLayerIdx }, shadow.currentEffect, shadow.effects, srcObj, layerState)

              logUtils.setLog(`phase: finish whole process, srcObj: { userId: ${srcObj.userId}, assetId: ${srcObj.assetId}}
              src: ${imageUtils.getSrc(srcObj, imageUtils.getSrcSize(srcObj.type, Math.max(newWidth, newHeight)))}
              pageIndex: ${pageIndex}, layerIndex: ${layerIndex}, subLayerIndex: ${subLayerIdx}
              pageId: ${pageId}, layerId: ${layerId}, subLayerId: ${subLayerId}`)
            }
            newImg.onerror = () => {
              console.error('can not load the uploaded image shadow')
              logUtils.setLog('error' + 'can not load the uploaded image shadow')

              const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
              imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, { type: '', assetId: '', userId: '' })
              imageShadowUtils.updateEffectState({ pageIndex, layerIndex, subLayerIdx }, ShadowEffectType.none)
            }
            newImg.src = imageUtils.getSrc(srcObj, imageUtils.getSrcSize(srcObj.type, Math.max(newWidth, newHeight)))
          }).catch((e: Error) => {
            console.error(e)
            logUtils.setLog('error' + e.message)
          }).finally(() => {
            imageShadowUtils.clearLayerData()
            imageShadowUtils.setUploadProcess(false)
          })
        }
      })
    } else {
      imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
    }
  }

  async isSVG(img: HTMLImageElement, config: IImage) {
    if (img.src.includes('https') && ['public', 'public-logo', 'private', 'private-logo', 'background'].includes(config.srcObj.type)) {
      const res = await new Promise<Response>((resolve) => resolve(fetch(img.src, { method: 'HEAD' })))
      return await res.headers.get('Content-Type') === 'image/svg+xml'
    } else return false
  }

  async svgImageSizeFormatter(img: HTMLImageElement, cb?: () => void) {
    return new Promise<void>((resolve) => {
      fetch(img.src)
        .then(async (response) => {
          const data = await response.text()
          const container = document.createElement('div')
          container.innerHTML = data
          const svg = container.getElementsByTagName('svg')[0]
          if (svg) {
            const pngScaleRation = 1600 / Math.max(img.naturalWidth, img.naturalHeight)
            // drawImgWidth *= pngScaleRation
            // drawImgHeight *= pngScaleRation
            // imgX *= pngScaleRation
            // imgY *= pngScaleRation
            svg.setAttribute('width', (img.naturalWidth * pngScaleRation).toString() + 'px')
            svg.setAttribute('height', (img.naturalHeight * pngScaleRation).toString() + 'px')
            const blob = new Blob([container.innerHTML], { type: 'image/svg+xml;charset=utf-8' })
            const URL = window.URL || window.webkitURL || window
            const blobURL = URL.createObjectURL(blob)
            img.src = blobURL
            cb && cb()
          }
          resolve()
        })
    })
  }

  handleEffectUpdate(name: string, value: string): void {
    const { currentEffect, fieldRange } = this
    const { max, min } = (fieldRange as any)[this.currentEffect][name]
    if (currentEffect !== ShadowEffectType.none) {
      const oldEffect = generalUtils
        .deepCopy((layerUtils.getCurrConfig as IImage).styles.shadow.effects[currentEffect]) as IShadowProps
      imageShadowUtils.setEffect(currentEffect, {
        [currentEffect]:
          Object.assign(oldEffect, { [name]: +value > max ? max : (+value < min ? min : +value) })
      })
    }
  }

  handleColorUpdate(color: string, currentEffect: ShadowEffectType = this.currentEffect): void {
    imageShadowUtils.setEffect(currentEffect, { color })
  }

  reset(effect: ShadowEffectType = ShadowEffectType.none, pageIndex = -1, layerIndex = -1, subLayerIdx = -1) {
    if (effect === ShadowEffectType.none) {
      if (subLayerIdx === -1) {
        effect = pageIndex !== -1 && layerIndex !== -1
          ? (layerUtils.getLayer(pageIndex, layerIndex) as IImage).styles.shadow.currentEffect
          : this.currentEffect
      } else if (pageIndex !== -1 && layerIndex !== -1) {
        effect = ((layerUtils.getLayer(pageIndex, layerIndex) as IGroup)
          .layers[subLayerIdx] as IImage)
          .styles.shadow.currentEffect
      }
    }
    if (effect !== ShadowEffectType.none) {
      const defaultProps = imageShadowUtils.getDefaultEffect(effect)[effect]
      imageShadowUtils.setEffect(effect, {
        [effect]: defaultProps,
        color: '#000000'
      }, pageIndex, layerIndex, subLayerIdx)
    }
  }

  setIsUploading(pageId: string, layerId: string, subLayerId: string, isUploading: boolean) {
    const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
    layerUtils.updateLayerProps(pageIndex, layerIndex, {
      isUploading
    }, subLayerIdx)
  }

  setUploadingData(layerIdentifier: ILayerIdentifier, id: string) {
    const { pageId, layerId, subLayerId } = layerIdentifier
    const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId || '')
    imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, {
      type: 'upload',
      assetId: id,
      userId: ''
    })
  }
}()
