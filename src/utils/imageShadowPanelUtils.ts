import { SrcObj } from '@/interfaces/gallery'
import { IBlurEffect, IFloatingEffect, IImageMatchedEffect, IShadowEffect, ShadowEffectType } from '@/interfaces/imgShadow'
import { IGroup, IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import store from '@/store'
import { ColorEventType, FunctionPanelType, ILayerInfo, LayerProcessType, LayerType } from '@/store/types'
import vivistickerUtils from '@/utils/vivistickerUtils'
import colorUtils from './colorUtils'
import generalUtils from './generalUtils'
import imageShadowUtils, { CANVAS_MAX_SIZE, CANVAS_SPACE, fieldRange, setMark } from './imageShadowUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import logUtils from './logUtils'
import pageUtils from './pageUtils'

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
      if (currentEffect === ShadowEffectType.none) {
        return false
      }

      const isSameAttrs = Object.entries(shadow.effects[currentEffect] as IShadowEffect | IBlurEffect | IFloatingEffect | IImageMatchedEffect)
        .every(([k, v]) => {
          return (shadow.srcState as any).effects[currentEffect][k] === v
        })

      const isSameLayerProps = ((!shadow.isTransparent && shadow.currentEffect !== ShadowEffectType.imageMatched) ||
        (
          shadow.srcState.layerState && Object.entries(shadow.srcState.layerState)
            .every(([k, v]) => {
              return (config.styles as any)[k] === v
            })
        )
      )

      const isSameColor = shadow.currentEffect === ShadowEffectType.frame
        ? shadow.effects.frameColor === shadow.srcState.effects.frameColor : shadow.effects.color === shadow.srcState.effects.color

      const isSameImgMatchedSrc = shadow.currentEffect !== ShadowEffectType.imageMatched ||
        (
          shadow.srcState.layerSrcObj.type === config.srcObj.type &&
          shadow.srcState.layerSrcObj.userId === config.srcObj.userId &&
          shadow.srcState.layerSrcObj.assetId === config.srcObj.assetId
        )

      return shadow.currentEffect === shadow.srcState.effect &&
        isSameAttrs &&
        isSameLayerProps &&
        isSameColor &&
        isSameImgMatchedSrc
    }
  }

  async handleShadowUpload(_layerData?: any, forceUpload = false) {
    try {
      this._handleShadowUpload(_layerData, forceUpload)
    } catch {
      imageShadowUtils.clearLayerData()
      imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
      imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
      imageShadowUtils.setUploadProcess(false)
    }
  }

  async _handleShadowUpload(_layerData?: any, forceUpload = false) {
    console.warn('_handleShadowUpload')
    colorUtils.event.off(ColorEventType.photoShadow, (color: string) => this.handleColorUpdate(color))
    let layerData = (() => {
      const handleId = store.state.shadow.handleId
      if (handleId) {
        const { pageId, layerId, subLayerId } = handleId
        const isSubLayer = subLayerId && layerId !== subLayerId
        if (isSubLayer) {
          const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
          const config = (layerUtils.getLayer(pageIndex, layerIndex) as IGroup).layers[subLayerIdx]
          return {
            pageId,
            primarylayerId: handleId.layerId,
            config
          }
        } else {
          const { pageIndex, layerIndex } = layerUtils.getLayerInfoById(pageId, layerId)
          const config = layerUtils.getLayer(pageIndex, layerIndex)
          if (pageId) {
            return {
              pageId,
              parimarylayerId: '',
              config
            }
          } else {
            return undefined
          }
        }
      }
    })()
    layerData = layerData ?? _layerData ?? imageShadowUtils.layerData
    logUtils.setLog('phase: start upload shadow')
    setMark('upload', 0)
    if (layerData) {
      imageShadowUtils.clearHandler()
      const { config: _config, primarylayerId, pageId } = layerData
      const config = generalUtils.deepCopy(_config) as IImage
      const layerId = primarylayerId || config.id || ''
      const subLayerId = primarylayerId ? config.id : ''
      const shadow = config.styles.shadow
      const { pageIndex: _pageIndex, layerIndex: _layerIndex, subLayerIdx: _subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)

      if (!forceUpload && config.styles.shadow.srcState && this.checkIfSameEffect(config)) {
        /**
         * Check if the state of the shadow is the same
         */
        const { shadowSrcObj } = config.styles.shadow.srcState
        const layerInfo = {
          pageIndex: _pageIndex,
          layerIndex: _layerIndex,
          subLayerIdx: _subLayerIdx
        }
        imageShadowUtils.clearLayerData()
        imageShadowUtils.updateShadowSrc(layerInfo, shadowSrcObj)
        imageShadowUtils.setUploadProcess(false)
        imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
        return
      }

      if (shadow.currentEffect === ShadowEffectType.none) {
        imageShadowUtils.clearLayerData()
        imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setUploadProcess(false)
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

      imageShadowUtils.setUploadProcess(true)
      imageShadowUtils.setHandleId({ pageId, layerId, subLayerId })
      imageShadowUtils.setUploadId({
        pageId: pageId,
        layerId: primarylayerId || config.id || '',
        subLayerId: primarylayerId ? config.id || '' : ''
      })

      const updateCanvas = document.createElement('canvas')
      let params = {} as any
      let drawCanvasH = 0
      let drawCanvasW = 0
      const isStaticShadow = shadow.currentEffect === ShadowEffectType.floating ||
        (!shadow.isTransparent && [ShadowEffectType.shadow, ShadowEffectType.frame, ShadowEffectType.blur].includes(shadow.currentEffect))

      setMark('upload', 1)
      const img = new Image()
      img.crossOrigin = 'anonynous'
      img.src = imageUtils.getSrc(config, ['unsplash', 'pexles'].includes(config.srcObj.type) ? 1600 : 'larg') +
        `${img.src.includes('?') ? '&' : '?'}ver=${generalUtils.generateRandomString(6)}`
      await new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          const isSVG = await this.isSVG(img.src, config)
          if (isSVG) {
            await this.svgImageSizeFormatter(img, CANVAS_MAX_SIZE, () => {
              img.onload = () => {
                resolve()
              }
              img.onerror = () => {
                const log = 'error: isSVG img loading error, src: ' + img.src
                logUtils.setLog(log)
                console.log(log)
              }
            })
          } else {
            resolve()
          }
        }
        img.onerror = (e) => {
          const log = 'error: img is svg check error, can not load img. ' + 'img.src: ' + img.src + 'error:' + e.toString()
          logUtils.setLog(log)
          console.log(log, e)
          reject(e)
        }
      })
      logUtils.setLog('phase: finish load max size img')

      setMark('upload', 2)
      if (isStaticShadow) {
        const { width, height, imgWidth, imgHeight } = config.styles
        const ratio = shadow.currentEffect === ShadowEffectType.floating ? imgWidth / imgHeight : width / height
        drawCanvasW = Math.round(ratio > 1 ? 1600 : 1600 * ratio)
        drawCanvasH = Math.round(ratio > 1 ? 1600 / ratio : 1600)
        const canvasW = drawCanvasW + CANVAS_SPACE
        const canvasH = drawCanvasH + CANVAS_SPACE
        updateCanvas.setAttribute('width', `${canvasW}`)
        updateCanvas.setAttribute('height', `${canvasH}`)
      } else {
        const { width, height, imgWidth, imgHeight } = config.styles
        drawCanvasW = Math.round(width / imgWidth * img.naturalWidth)
        drawCanvasH = Math.round(height / imgHeight * img.naturalHeight)
        const canvasW = Math.round(img.naturalWidth + CANVAS_SPACE)
        const canvasH = Math.round(img.naturalHeight + CANVAS_SPACE)
        updateCanvas.setAttribute('width', `${canvasW}`)
        updateCanvas.setAttribute('height', `${canvasH}`)
      }

      params = { timeout: 0, drawCanvasW, drawCanvasH }
      imageShadowUtils.drawingInit(updateCanvas, img, config, params)

      switch (config.styles.shadow.currentEffect) {
        case ShadowEffectType.shadow:
        case ShadowEffectType.blur:
        case ShadowEffectType.frame: {
          await imageShadowUtils.drawShadow([updateCanvas], img, config, params)
          break
        }
        case ShadowEffectType.imageMatched:
          await imageShadowUtils.drawImageMatchedShadow([updateCanvas], img, config, params)
          break
        case ShadowEffectType.floating:
          await imageShadowUtils.drawFloatingShadow([updateCanvas], img, config, params)
          break
        case ShadowEffectType.none:
          return
        default:
          logUtils.setLog('Error: effect type error: ' + config.styles.shadow.currentEffect)
          generalUtils.assertUnreachable(config.styles.shadow.currentEffect)
      }
      logUtils.setLog('phase: finish drawing')
      setMark('upload', 3)

      const { right, left, top, bottom } = imageShadowUtils.getImgEdgeWidth(updateCanvas)
      const leftShadowThickness = ((updateCanvas.width - drawCanvasW) * 0.5 - left) / drawCanvasW
      const topShadowThickness = ((updateCanvas.height - drawCanvasH) * 0.5 - top) / drawCanvasH
      logUtils.setLog('phase: finish calculate edge')
      setMark('upload', 4)

      const uploadCanvas = document.createElement('canvas')
      uploadCanvas.setAttribute('width', (updateCanvas.width - left - right).toString())
      uploadCanvas.setAttribute('height', (updateCanvas.height - top - bottom).toString())
      const ctxUpload = uploadCanvas.getContext('2d') as CanvasRenderingContext2D
      ctxUpload.drawImage(updateCanvas, left, top, uploadCanvas.width, uploadCanvas.height, 0, 0, uploadCanvas.width, uploadCanvas.height)

      logUtils.setLog('phase: start uploading result')
      setMark('upload', 5)
      imageShadowUtils.saveToIOS(uploadCanvas, (data, path) => {
        const srcObj = {
          type: 'ios',
          userId: '',
          assetId: path,
        }
        const _width = config.styles.width / config.styles.scale
        const _height = config.styles.height / config.styles.scale
        const newWidth = Math.ceil((updateCanvas.width - right - left) / drawCanvasW * _width)
        const newHeight = Math.ceil((updateCanvas.height - top - bottom) / drawCanvasH * _height)
        let newX = newWidth * 0.5 - _width * (leftShadowThickness + 0.5)
        let newY = newHeight * 0.5 - _height * (topShadowThickness + 0.5)
        if ([ShadowEffectType.frame, ShadowEffectType.blur].includes(shadow.currentEffect) && !shadow.isTransparent) {
          newX = 0
          newY = 0
        }
        const { pageIndex, layerIndex, subLayerIdx } = layerUtils.getLayerInfoById(pageId, layerId, subLayerId)
        layerUtils.updateLayerProps(pageIndex, layerIndex, { isUploading: false, inProcess: LayerProcessType.none }, subLayerIdx)
        const shadowImgStyles = {
          imgWidth: newWidth,
          imgHeight: newHeight,
          imgX: newX,
          imgY: newY
        }
        imageShadowUtils.updateShadowSrc({ pageIndex, layerIndex, subLayerIdx }, srcObj)
        imageShadowUtils.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, shadowImgStyles)
        console.log(config, config.styles.shadow.srcObj.type)
        if (config.styles.shadow.srcState?.shadowSrcObj.type === 'ios') {
          this.delIosOldImg(config.styles.shadow.srcState?.shadowSrcObj)?.then((data) => {
            console.warn('delete ios old img', data)
          })
        }
        imageShadowUtils.setShadowSrcState({ pageIndex, layerIndex, subLayerIdx }, {
          effect: shadow.currentEffect,
          effects: shadow.effects,
          shadowSrcObj: srcObj,
          layerSrcObj: config.srcObj,
          layerState: {
            imgWidth: config.styles.imgWidth,
            imgHeight: config.styles.imgHeight,
            imgX: config.styles.imgX,
            imgY: config.styles.imgY
          }
        })
        vivistickerUtils.saveDesign()
        imageShadowUtils.clearLayerData()
        imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
        imageShadowUtils.setUploadProcess(false)
      })
    } else {
      logUtils.setLog('layerData is undefined')
      console.log('layerData is undefined')
      imageShadowUtils.clearLayerData()
      imageShadowUtils.setHandleId({ pageId: '', layerId: '', subLayerId: '' })
      imageShadowUtils.setUploadId({ pageId: '', layerId: '', subLayerId: '' })
      imageShadowUtils.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
    }
  }

  delIosOldImg(srcObj: SrcObj) {
    console.log('delIosOldImg delIosOldImgdelIosOldImgdelIosOldImgdelIosOldImg')
    if (srcObj.type !== 'ios') return
    console.log('delIosOldImg delIosOldImgdelIosOldImgdelIosOldImgdelIosOldImg 222')
    const key = `mydesign-${vivistickerUtils.mapEditorType2MyDesignKey(vivistickerUtils.editorType)}`
    const designId = store.getters['vivisticker/getEditingDesignId']
    // need discuss: is type always png
    return vivistickerUtils.deleteImage(key, designId, 'png')
  }

  async isSVG(src: string, config: IImage) {
    if (src.includes('https') && ['public', 'public-logo', 'private', 'private-logo', 'background'].includes(config.srcObj.type)) {
      if (src.includes('?')) {
        src += `&isSvgRand=${generalUtils.generateRandomString(6)}`
      } else {
        src += `?isSvgRand=${generalUtils.generateRandomString(6)}`
      }
      const res = await new Promise<Response>((resolve) => resolve(fetch(src, { method: 'HEAD' })))
      return await res.headers.get('Content-Type') === 'image/svg+xml'
    } else return false
  }

  async svgImageSizeFormatter(img: HTMLImageElement, size = CANVAS_MAX_SIZE, cb?: () => void) {
    return new Promise<void>((resolve) => {
      fetch(img.src)
        .then(async (response) => {
          const data = await response.text()
          const container = document.createElement('div')
          container.innerHTML = data
          const svg = container.getElementsByTagName('svg')[0]
          if (svg) {
            const pngScaleRation = size / Math.max(img.naturalWidth, img.naturalHeight)
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
      const oldEffect = generalUtils.deepCopy((layerUtils.getCurrConfig as IImage).styles.shadow.effects[currentEffect])
      imageShadowUtils.setEffect(currentEffect, {
        [currentEffect]:
          Object.assign(oldEffect as any, { [name]: +value > max ? max : (+value < min ? min : +value) })
      })
    }
  }

  handleColorUpdate(color: string, currentEffect: ShadowEffectType = this.currentEffect): void {
    if (currentEffect === ShadowEffectType.frame) {
      imageShadowUtils.setEffect(currentEffect, { frameColor: color })
    } else {
      imageShadowUtils.setEffect(currentEffect, { color })
    }
  }

  reset(effect: ShadowEffectType = ShadowEffectType.none, layerInfo?: ILayerInfo) {
    let { pageIndex, layerIndex, subLayerIdx } = layerUtils
    if (layerInfo) {
      ({ pageIndex, layerIndex, subLayerIdx = -1 } = layerInfo)
    }
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
      }, { pageIndex, layerIndex, subLayerIdx })
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
