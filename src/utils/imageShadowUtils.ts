import { SrcObj } from '@/interfaces/gallery'
import { IBlurEffect, IFloatingEffect, IFrameEffect, IImageMatchedEffect, IShadowEffect, IShadowEffects, IShadowProps, IShadowStyles, ShadowEffectType } from '@/interfaces/imgShadow'
import { IGroup, IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import store from '@/store'
import { IUploadShadowImg } from '@/store/module/shadow'
import { ILayerInfo, LayerProcessType, LayerType } from '@/store/types'
import _ from 'lodash'
import { getDilate } from './canvasAlgorithms'
import generalUtils from './generalUtils'
import imageShadowPanelUtils from './imageShadowPanelUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import logUtils from './logUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import { imageDataAChannel, imageDataRGBA } from './stackblur'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IImageMatchedEffect | IFloatingEffect

export const CANVAS_SIZE = 510
export const CANVAS_MAX_SIZE = 1600
export const CANVAS_SPACE = 400
export const CANVAS_FLOATING_SCALE = 2.2
export const DRAWING_TIMEOUT = 300
const FLOATING_SHADOW_SIZE = 100

/** These attrs are used to indicate the performance of each shadow effect */
const isProduction = process.env.NODE_ENV === 'production'
const marks = {
  shadow: [
    'start drawing shadow',
    'before handle spread',
    'after handle spread; before handle blur',
    'after handle blur; before handle overlay, opacity...',
    'finishing shadow drawing'
  ],
  imageMatched: [
    'start drawing imageMatched',
    'before handle blur',
    'after handle blur; before handle offset/overlay',
    'finishing imageMatched drawing'
  ],
  floating: [
    'start drawing floating',
    'before handle geometry and blur',
    'after handle geometry and blur; before handle distance/overlay',
    'finishing floating drawing'
  ],
  upload: [
    'start uploading',
    'before load max size img',
    'after load max size img, before drawing',
    'after drawing, before calculate edge',
    'after calculate edge , before drawing new canvas and convert to png',
    'png uploading',
    'finish uploading',
    'finish whole uploading process'
  ]
}
export const setMark = function (type: 'shadow' | 'imageMatched' | 'floating' | 'upload', i: number) {
  performance.mark(marks[type][i])
}
export const logMark = function (type: 'shadow' | 'imageMatched' | 'floating' | 'upload', ...logs: string[]) {
  logs.forEach(log => {
    logUtils.setLog(log)
  })
  for (let i = 0; i < marks[type].length - 1; i++) {
    performance.measure('FROM: ' + marks[type][i] + '\nTO:   ' + marks[type][i + 1], marks[type][i], marks[type][i + 1])
  }
  performance.measure('FROM: ' + marks[type][0] + '\nTO:   ' + marks[type][marks[type].length - 1], marks[type][0], marks[type][marks[type].length - 1])
  const measures = performance.getEntriesByType('measure')
  measures.forEach(measureItem => {
    const log = `${measureItem.name}\n-> ${measureItem.duration.toFixed(2)} ms`
    logUtils.setLog(log)
    // console.log(log)
  })
  performance.clearMeasures()
}
export interface DrawParams {
  drawCanvasW: number,
  drawCanvasH: number,
  pageId?: string,
  layerInfo?: ILayerInfo,
  timeout?: number,
  uploading?: boolean,
  cb?: () => void
}
class ImageShadowUtils {
  private readonly SPREAD_RADIUS = 1
  /**
   * canvasT used to draw the corresponding size of the input image,
   * as a temporarily operating canvas.
   */
  private canvasT = document.createElement('canvas')
  /**
   * canvasP used to draw the input image as a input img for canvasT
   */
  private canvasP = document.createElement('canvas')
  /**
   * canvasMaxSize used to handle/draw the parametera as blur or offset...,
   * as a parameter unified canvas for different size of image.
   */
  private canvasMaxSize = document.createElement('canvas')
  private _draw = undefined as number | undefined
  private handlerId = ''

  private _layerData = null as {
    config: IImage,
    pageId: string,
    /**
     * This identifier is used to indexing the sub-layer
     * */
    primarylayerId?: string,
    options?: DrawParams
  } | null

  private dataBuff = {
    spread: -1,
    radius: -1,
    size: -1,
    thinkness: -1,
    effect: ShadowEffectType.none as ShadowEffectType,
    layerIdentifier: '' as string,
    data: {} as ImageData
  }

  private _inUploadProcess = false
  private dilate = undefined as ((r: number) => Uint8ClampedArray) | undefined

  get layerData() { return this._layerData }
  get inUploadProcess() { return this._inUploadProcess }

  setUploadProcess(val: boolean) {
    this._inUploadProcess = val
  }

  getHandlerId(): string {
    return this?.handlerId || ''
  }

  drawingInit(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, params: DrawParams) {
    const { canvasT } = this
    if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
      canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.setAttribute('height', `${canvas.height}`)
    }
    this._layerData = { ...this._layerData, config, pageId: params.pageId || pageUtils.currFocusPage.id }
    const { layerInfo } = params || {}
    if (layerInfo) {
      const primarylayerId = layerUtils.getLayer(layerInfo.pageIndex, layerInfo.layerIndex).id
      this._layerData.primarylayerId = primarylayerId
      this.setProcessId({
        pageId: pageUtils.currFocusPage.id,
        layerId: primarylayerId || config.id || '',
        subLayerId: layerInfo.subLayerIdx !== -1 ? config.id || '' : ''
      })
      this.setHandleId({
        pageId: pageUtils.currFocusPage.id,
        layerId: primarylayerId || config.id || '',
        subLayerId: layerInfo.subLayerIdx !== -1 ? config.id || '' : ''
      })
    }
    if ([ShadowEffectType.shadow, ShadowEffectType.blur, ShadowEffectType.frame].includes(config.styles.shadow.currentEffect)) {
      const ctxT = this.canvasT.getContext('2d') as CanvasRenderingContext2D
      const { drawCanvasW, drawCanvasH, timeout = DRAWING_TIMEOUT } = params
      const { styles: { width, height, imgWidth, imgHeight, imgX, imgY, shadow: { maxsize = 1600, middsize = 510 } } } = config
      const drawImgWidth = width / imgWidth * img.naturalWidth
      const drawImgHeight = height / imgHeight * img.naturalHeight
      const scaleRatio = img.naturalWidth / imgWidth
      const x = (canvas.width - drawCanvasW) * 0.5
      const y = (canvas.height - drawCanvasH) * 0.5
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      ctxT.drawImage(img, -imgX * scaleRatio, -imgY * scaleRatio, drawImgWidth, drawImgHeight, x, y, drawCanvasW, drawCanvasH)

      // Show test canvas
      // const canvasTest = document.createElement('canvas')
      // canvasTest.setAttribute('width', canvasT.width.toString())
      // canvasTest.setAttribute('height', canvasT.height.toString())
      // const ctxText = canvasTest.getContext('2d') as CanvasRenderingContext2D
      // ctxText.drawImage(canvasT, 0, 0)
      // document.body.appendChild(canvasTest)
      // setTimeout(() => document.body.removeChild(canvasTest), 10000)
      // canvasTest.style.position = 'absolute'
      // canvasTest.style.top = '0'
      // canvasTest.style.zIndex = '10000'

      const imageData = ctxT.getImageData(0, 0, canvasT.width, canvasT.height)
      this.dilate = getDilate(imageData, !timeout ? maxsize / middsize : 1)
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    }
    if (params && params.timeout) {
      this._layerData.options = {
        ...this._layerData.options,
        ...params
      }
    }
    if (this._draw) {
      clearTimeout(this._draw)
    }
  }

  async drawFloatingShadow(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    if (!canvas || ![ShadowEffectType.floating].includes(config.styles.shadow.currentEffect)) {
      if (canvas) {
        logUtils.setLog('Error: drawFloatingShadow with wrong effect type:' + config.styles.shadow.currentEffect)
      } else {
        logUtils.setLog('Error: input canvas is undefined')
      }
      return
    }
    const { timeout = DRAWING_TIMEOUT } = params
    const handlerId = generalUtils.generateRandomString(6)
    if (!store.getters['shadow/isUploading'] || !params.timeout) {
      this.handlerId = handlerId
    }
    if (timeout) {
      clearTimeout(this._draw)
      this._draw = setTimeout(() => {
        this.floatingHandler(canvas_s, img, config, handlerId, params)
      }, timeout)
    } else {
      await this.floatingHandler(canvas_s, img, config, handlerId, params)
    }
  }

  floatingHandler(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, handlerId: string, params: DrawParams) {
    logUtils.setLog('canvas drawing: floatingHandler start:')
    const canvas = canvas_s[0] || undefined
    setMark('floating', 0)
    const { canvasT, canvasMaxSize } = this
    const ctxT = canvasT.getContext('2d')
    const ctxMaxSize = canvasMaxSize.getContext('2d')

    if (!ctxT || !ctxMaxSize) {
      logUtils.setLog('Error: ' + (ctxT ? 'canvasMaxSize' : 'ctxT') + 'is undefined')
      return
    }
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = params
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect, maxsize = 1600 } = shadow
    const { x, y, radius, opacity, size, thinkness } = (effects as any)[currentEffect] as IFloatingEffect

    console.warn('start drawing floating in ' + (timeout > 0 ? 'preview' : 'upload') + ' phase')
    console.warn('input: ', canvas_s[0], img, 'drawCanvasW: ', params.drawCanvasW, 'drawCanvasH', params.drawCanvasH)

    let { drawCanvasW, drawCanvasH, layerInfo } = params || {}
    if (!drawCanvasH || !drawCanvasW) {
      drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0 as number
      drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0 as number
    }
    if (!layerInfo || !Object.keys(layerInfo)) {
      layerInfo = this.layerData?.options?.layerInfo
    }
    if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
      canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.setAttribute('height', `${canvas.height}`)
    }

    const mappingScale = _imgWidth > _imgHeight
      ? (layerWidth / _imgWidth) * maxsize / drawCanvasW
      : (layerHeight / _imgHeight) * maxsize / drawCanvasH
    const attrFactor = maxsize / 1600

    const canvasMaxW = canvas.width * mappingScale
    const ellipseX = canvasMaxW * 0.5
    const ellipseY = ((canvas.height - drawCanvasH) * 0.5 + drawCanvasH) * mappingScale
    const layerIdentifier = (config.id ?? '') + `${layerWidth}${layerHeight}`
    const hasBuffRecorded = this.dataBuff.effect === ShadowEffectType.floating &&
      this.dataBuff.radius === radius && this.dataBuff.size === size &&
      this.dataBuff.layerIdentifier === layerIdentifier && this.dataBuff.thinkness === thinkness

    if (layerInfo && timeout && !hasBuffRecorded) {
      this.setIsProcess(layerInfo, true)
    }

    const offsetX = x * drawCanvasW * mappingScale * 0.0025
    const offsetY = y * drawCanvasH * mappingScale * 0.0025

    if ((this.handlerId === handlerId) || !timeout) {
      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)
      const shadowWidth = attrFactor * config.styles.initWidth * (size * 0.01)
      const shadowHeight = FLOATING_SHADOW_SIZE * attrFactor * (thinkness * 0.01)
      ctxMaxSize.ellipse(offsetX + ellipseX, offsetY + ellipseY, shadowWidth, shadowHeight, 0, 0, Math.PI * 2 + 20)
      ctxMaxSize.fill()
      const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      // radius: value bar is available in range of 0 ~ 100, which should be mapping to 50 ~ 100 as the actual computation radius
      setMark('floating', 1)
      const bluredData = imageDataAChannel(imageData, canvasMaxSize.width, canvasMaxSize.height, Math.floor((radius * 0.5) * attrFactor * fieldRange.floating.radius.weighting), handlerId)
      setMark('floating', 2)
      this.dataBuff.effect = ShadowEffectType.floating
      this.dataBuff.radius = radius
      this.dataBuff.size = size
      this.dataBuff.data = bluredData
      this.dataBuff.layerIdentifier = layerIdentifier
      this.dataBuff.thinkness = thinkness
    }

    if (this.handlerId === handlerId) {
      ctxMaxSize.putImageData(this.dataBuff.data, 0, 0)
      ctxT.drawImage(canvasMaxSize, 0, 0, canvasMaxSize.width, canvasMaxSize.height, 0, 0, canvasT.width, canvasT.height)
      ctxT.globalCompositeOperation = 'source-in'
      ctxT.globalAlpha = opacity * 0.01
      ctxT.fillStyle = effects.color
      ctxT.fillRect(0, 0, canvasT.width, canvasT.height)
      ctxT.globalAlpha = 1
      ctxT.globalCompositeOperation = 'source-over'

      canvas_s.forEach(c => {
        const ctx = c.getContext('2d') as CanvasRenderingContext2D
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(canvasT, 0, 0)
      })
      if (layerInfo) {
        timeout && this.setIsProcess(layerInfo, false)
      }
      this.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
      cb && cb()
    }
    setMark('floating', 3)
    logMark('floating', `CANVAS_MAX_SIZE: (${canvasMaxSize.width}, ${canvasMaxSize.height})`, `CANVANST: (${canvasT.width}, ${canvasT.height}) `)
  }

  drawImageMatchedShadow(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    if (!canvas || ![ShadowEffectType.imageMatched].includes(config.styles.shadow.currentEffect)) {
      if (canvas) {
        logUtils.setLog('Error: drawImageMatchedShadow with wrong effect type:' + config.styles.shadow.currentEffect)
      } else {
        logUtils.setLog('Error: input canvas is undefined')
      }
      return
    }
    const { timeout = DRAWING_TIMEOUT } = params
    const handlerId = generalUtils.generateRandomString(6)
    if (!store.getters['shadow/isUploading'] || !params.timeout) {
      this.handlerId = handlerId
    }
    if (timeout) {
      clearTimeout(this._draw)
      this._draw = setTimeout(() => {
        this.imageMathcedHandler(canvas_s, img, config, handlerId, params)
      }, timeout)
    } else {
      this.imageMathcedHandler(canvas_s, img, config, handlerId, params)
    }
  }

  imageMathcedHandler(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, handlerId: string, params: DrawParams) {
    logUtils.setLog('canvas drawing: drawImageMatchedShadow start:')
    const canvas = canvas_s[0] || undefined
    setMark('imageMatched', 0)
    const { canvasT, canvasMaxSize } = this
    const ctxT = canvasT.getContext('2d')
    const ctxMaxSize = canvasMaxSize.getContext('2d')

    if (!ctxT || !ctxMaxSize) {
      logUtils.setLog('Error: ' + (ctxT ? 'canvasMaxSize' : 'ctxT') + 'is undefined')
      return
    }
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = params
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect, maxsize = 1600 } = shadow
    const { distance, angle, radius, opacity, size } = (effects as any)[currentEffect] as IImageMatchedEffect

    console.warn('start drawing image-matched in ' + (timeout > 0 ? 'preview' : 'upload') + ' phase')
    console.warn('input: ', canvas_s[0], img, 'drawCanvasW: ', params.drawCanvasW, 'drawCanvasH', params.drawCanvasH)

    const scaleRatio = img.naturalWidth / _imgWidth
    const imgX = _imgX * scaleRatio
    const imgY = _imgY * scaleRatio
    const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
    const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight
    let { drawCanvasW, drawCanvasH, layerInfo } = params || {}
    if (!drawCanvasH || !drawCanvasW) {
      drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0 as number
      drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0 as number
    }
    drawCanvasW *= size * 0.01
    drawCanvasH *= size * 0.01
    const blurImgX = (canvas.width - drawCanvasW) * 0.5
    const blurImgY = (canvas.height - drawCanvasH) * 0.5

    const layerIdentifier = (config.id ?? '') + `${layerWidth}${layerHeight}${imgX}${imgY}${_imgHeight}${_imgWidth}${img.src}`
    const hasBuffRecorded = this.dataBuff.effect === ShadowEffectType.imageMatched && this.dataBuff.radius === radius && this.dataBuff.size === size && this.dataBuff.layerIdentifier === layerIdentifier

    if (!layerInfo || !Object.keys(layerInfo)) {
      layerInfo = this.layerData?.options?.layerInfo
    }
    if (layerInfo && timeout && !hasBuffRecorded) {
      this.setIsProcess(layerInfo, true)
    }
    if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
      canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.setAttribute('height', `${canvas.height}`)
    }

    ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, blurImgX, blurImgY, drawCanvasW as number, drawCanvasH as number)

    const mappingScale = _imgWidth > _imgHeight
      ? maxsize / drawCanvasW
      : maxsize / drawCanvasH
    const attrFactor = maxsize / 1600

    // if ((this.handlerId === handlerId && !hasBuffRecorded) || !timeout) {
    canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
    canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)

    ctxMaxSize.drawImage(canvasT, 0, 0, canvasT.width, canvasT.height, 0, 0, canvasMaxSize.width, canvasMaxSize.height)
    const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
    setMark('imageMatched', 1)
    const bluredData = imageDataRGBA(imageData, 0, 0, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * attrFactor * fieldRange.imageMatched.radius.weighting) + 1, handlerId)
    setMark('imageMatched', 2)
    this.dataBuff.effect = ShadowEffectType.imageMatched
    this.dataBuff.radius = radius
    this.dataBuff.size = size
    this.dataBuff.data = bluredData
    this.dataBuff.layerIdentifier = layerIdentifier
    // }
    if (this.handlerId === handlerId) {
      const offsetX = distance && distance > 0 ? distance * mathUtils.cos(angle) * attrFactor * fieldRange.imageMatched.distance.weighting : 0
      const offsetY = distance && distance > 0 ? distance * mathUtils.sin(angle) * attrFactor * fieldRange.imageMatched.distance.weighting : 0
      ctxMaxSize.putImageData(this.dataBuff.data, offsetX, offsetY)

      ctxT.clearRect(0, 0, canvas.width, canvas.height)
      ctxT.globalAlpha = opacity * 0.01
      ctxT.drawImage(canvasMaxSize, 0, 0, canvasMaxSize.width, canvasMaxSize.height, 0, 0, canvasT.width, canvasT.height)
      ctxT.globalAlpha = 1

      canvas_s.forEach(c => {
        const ctx = c.getContext('2d') as CanvasRenderingContext2D
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(canvasT, 0, 0)
      })
      if (layerInfo) {
        timeout && this.setIsProcess(layerInfo, false)
      }
      this.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
      cb && cb()
      setMark('imageMatched', 3)
      logMark('imageMatched', `CANVAS_MAX_SIZE: (${canvasMaxSize.width}, ${canvasMaxSize.height})`, `CANVANST: (${canvasT.width}, ${canvasT.height}) `)
    }
  }

  drawShadow(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    const { timeout = DRAWING_TIMEOUT, cb } = params
    const { imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = config.styles
    const { effects, currentEffect, maxsize = 1600, middsize } = shadow
    const { distance, angle, radius, spread, opacity } = (effects as any)[currentEffect] as IShadowEffect | IBlurEffect | IFrameEffect
    if (!canvas || ![ShadowEffectType.shadow, ShadowEffectType.blur, ShadowEffectType.frame].includes(currentEffect)) {
      if (canvas) {
        const log = 'Error: drawShadow with wrong effect type:' + currentEffect
        console.log(log)
        logUtils.setLog(log)
      } else {
        const log = 'Error: input canvas is undefined'
        console.log(log)
        logUtils.setLog(log)
      }
      return
    }
    const handlerId = generalUtils.generateRandomString(6)
    const handler = () => {
      logUtils.setLog('canvas drawing: draw shadow start:')
      setMark('shadow', 0)
      const { canvasT } = this
      const ctxT = canvasT.getContext('2d')
      if (!this.dilate) return
      if (!ctxT) {
        logUtils.setLog('Error: ' + (ctxT ? 'canvasMaxSize' : 'ctxT') + 'is undefined')
        return
      }
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)

      let { layerInfo } = params || {}
      if (!layerInfo || !Object.keys(layerInfo)) {
        layerInfo = this.layerData?.options?.layerInfo
      }

      let { drawCanvasW, drawCanvasH } = params || {}
      if (!drawCanvasH || !drawCanvasW) {
        drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0
        drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0
      }

      /**
       * Show the process icon as:
       * 1. this drawing is not an uploading draw -> timeout !== 0
       * 2. or, this drawing is an uploading draw and the canvas is empty
       */
      if (layerInfo && timeout) {
        this.setIsProcess(layerInfo, true)
      }

      setMark('shadow', 1)
      const start1 = Date.now()
      const _imageData = new ImageData(this.dilate(spread), canvasT.width, canvasT.height)
      ctxT.putImageData(_imageData, 0, 0)
      console.log('1: handle spread time: ', Date.now() - start1)
      setMark('shadow', 2)
      const arrtFactor = maxsize / 1600

      const start2 = Date.now()
      const imageData = ctxT.getImageData(0, 0, canvasT.width, canvasT.height)
      const bluredData = imageDataAChannel(imageData, canvasT.width, canvasT.height, Math.floor(radius * arrtFactor * fieldRange.shadow.radius.weighting) + 1, handlerId)
      console.log('2: handle blur time: ', Date.now() - start2)

      const offsetX = distance && distance > 0 ? distance * mathUtils.cos(angle) * arrtFactor * fieldRange.shadow.distance.weighting : 0
      const offsetY = distance && distance > 0 ? distance * mathUtils.sin(angle) * arrtFactor * fieldRange.shadow.distance.weighting : 0
      ctxT.putImageData(bluredData, offsetX, offsetY)

      setMark('shadow', 3)

      ctxT.globalCompositeOperation = 'source-in'
      ctxT.globalAlpha = opacity * 0.01
      ctxT.fillStyle = effects.color
      ctxT.fillRect(0, 0, canvasT.width, canvasT.height)
      ctxT.globalAlpha = 1
      ctxT.globalCompositeOperation = 'source-over'

      canvas_s.forEach(c => {
        const ctx = c.getContext('2d') as CanvasRenderingContext2D
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(canvasT, 0, 0)
      })
      if (layerInfo) {
        timeout && this.setIsProcess(layerInfo, false)
      }
      this.setProcessId({ pageId: '', layerId: '', subLayerId: '' })
      cb && cb()
      setMark('shadow', 4)
      logMark('shadow')
    }

    if (!store.getters['shadow/isUploading'] || !params.timeout) {
      this.handlerId = handlerId
    }
    if (timeout) {
      clearTimeout(this._draw)
      this._draw = setTimeout(handler, timeout)
    } else {
      handler()
    }
  }

  async asyncProcessing(cb: () => void, disable = false) {
    return disable ? cb() : new Promise<void>(resolve => {
      setTimeout(() => {
        cb()
        resolve()
      }, 0)
    })
  }

  storeEffectsAttrs(config: IImage) {
    const { currentEffect, effects } = config.styles.shadow
    if (currentEffect !== ShadowEffectType.none) {
      localStorage.setItem(currentEffect, JSON.stringify(effects[currentEffect]))
    }
  }

  getLocalEffectAttrs(effectName: ShadowEffectType) {
    const data = localStorage.getItem(effectName)
    return data && Object.keys(JSON.parse(data)).length ? JSON.parse(data) : null
  }

  isTransparentBg(target: HTMLCanvasElement | HTMLImageElement): boolean {
    let canvas
    if (target instanceof HTMLImageElement) {
      canvas = document.createElement('canvas')
      const { naturalWidth, naturalHeight } = target as HTMLImageElement
      canvas.setAttribute('width', naturalWidth.toString())
      canvas.setAttribute('height', naturalHeight.toString())
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.drawImage(target, 0, 0, naturalWidth, naturalHeight)
    } else {
      canvas = target
    }
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const { width, height } = canvas
    const data = ctx.getImageData(0, 0, width, height).data
    return data[3] !== 255 ||
      data[width * 4 - 1] !== 255 ||
      data[data.length - 1] !== 255 ||
      data[data.length - width * 4 + 3] !== 255
  }

  setIsProcess(layerInfo: ILayerInfo, drawing: boolean) {
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    layerUtils.updateLayerProps(pageIndex, layerIndex, {
      inProcess: drawing ? LayerProcessType.imgShadow : LayerProcessType.none
    }, subLayerIdx)
  }

  clearLayerData() {
    this._layerData = null
  }

  setEffect(effect: ShadowEffectType, attrs = {}, layerInfo?: ILayerInfo): void {
    let { pageIndex, layerIndex, subLayerIdx } = layerUtils
    if (layerInfo) {
      ({ pageIndex, layerIndex, subLayerIdx = -1 } = layerInfo)
    }

    let _layer = layerUtils.getLayer(pageIndex, layerIndex)
    if (subLayerIdx !== -1) {
      if (_layer.type === LayerType.group) {
        _layer = (layerUtils.getLayer(pageIndex, layerIndex) as IGroup).layers[subLayerIdx] as IImage
      } else if (_layer.type === LayerType.frame) {
        return
      }
    }
    const layer = _layer as IImage

    if (layer.type === LayerType.image) {
      const { shadow } = layer.styles
      const { effects } = shadow
      const layerInfo = { pageIndex, layerIndex, subLayerIdx }

      if (layer.styles.scale !== 1) {
        let { imgWidth, imgHeight, imgX, imgY } = layer.styles.shadow.styles
        imgWidth *= layer.styles.scale
        imgHeight *= layer.styles.scale
        imgX *= layer.styles.scale
        imgY *= layer.styles.scale
        this.updateShadowStyles({ pageIndex, layerIndex, subLayerIdx }, {
          imgWidth,
          imgHeight,
          imgX,
          imgY
        })
        layerUtils.updateLayerStyles(pageIndex, layerIndex, {
          scale: 1
        }, subLayerIdx)
      }

      if (layer.styles.shadow.currentEffect !== effect) {
        this.updateEffectState(layerInfo, effect)
      }
      this.updateEffect(layerInfo, {
        ...effects,
        ...attrs
      })
      this.storeEffectsAttrs(layer)
    }
  }

  async getImgEdgeWidth(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const ROW_PIXELS = imageData.data.length / canvas.height
    const COL_PIXELS = imageData.data.length / canvas.width

    let reach = false
    let top = 0
    await this.asyncProcessing(() => {
      while (!reach && top <= COL_PIXELS / 4) {
        for (let i = top * ROW_PIXELS + 3; i <= (top + 1) * ROW_PIXELS + 3; i += 4) {
          if (imageData.data[i]) {
            reach = true
            break
          }
        }
        top++
      }
    })

    reach = false
    let bottom = 0
    await this.asyncProcessing(() => {
      while (!reach && bottom <= COL_PIXELS / 4) {
        for (let i = bottom * ROW_PIXELS; i <= (bottom + 1) * ROW_PIXELS; i += 4) {
          if (imageData.data[imageData.data.length - i - 1]) {
            reach = true
            break
          }
        }
        bottom++
      }
    })

    reach = false
    let left = 0
    await this.asyncProcessing(() => {
      while (!reach && left <= ROW_PIXELS / 4) {
        for (let j = left * 4 + 3; j <= imageData.data.length; j += ROW_PIXELS) {
          if (imageData.data[j]) {
            reach = true
            break
          }
        }
        left++
      }
    })

    reach = false
    let right = 0
    await this.asyncProcessing(() => {
      while (!reach && right <= ROW_PIXELS / 4) {
        for (let j = right * 4; j <= imageData.data.length; j += ROW_PIXELS) {
          if (imageData.data[imageData.data.length - j - 1]) {
            reach = true
            break
          }
        }
        right++
      }
    })
    return { right, left, top, bottom }
  }

  getOptimizeWin(n: number) {
    const window = new Array(2 * n + 1)
    for (let i = 0; i < window.length; i++) {
      window[i] = new Array(2 * n + 1)
    }
    const write = (m: number, n: number, val: number) => {
      for (let i = m; i <= 2 * n - m; i++) {
        for (let j = m; j <= 2 * n - m; j++) {
          window[i][j] = val
        }
      }
    }
    for (let m = 0; m < n; m++) {
      if (m % 2 === 0) {
        write(m, n, 1)
      } else {
        write(m, n, 0)
      }
    }
    window[n][n] = n % 2 === 0 ? 1 : 0
    return window
  }

  convertToAlpha(percent: number): string {
    return Math.floor(percent / 100 * 255).toString(16).toUpperCase()
  }

  getDefaultEffect(effectName: ShadowEffectType): Partial<IShadowEffects> {
    let effect = {} as unknown
    switch (effectName) {
      case ShadowEffectType.shadow:
        (effect as IShadowEffect) = {
          distance: 50,
          angle: 20,
          radius: 50,
          spread: 0,
          opacity: 40
        }
        break
      case ShadowEffectType.floating: {
        (effect as IFloatingEffect) = {
          x: 0,
          y: 0,
          radius: 60,
          size: 100,
          thinkness: 50,
          opacity: 65
        }
        break
      }
      case ShadowEffectType.blur:
        (effect as IBlurEffect) = {
          radius: 50,
          spread: 10,
          opacity: 40
        }
        break
      case ShadowEffectType.frame:
        (effect as IFrameEffect) = {
          radius: 0,
          spread: 20,
          opacity: 100
        }
        break
      case ShadowEffectType.imageMatched:
        (effect as IImageMatchedEffect) = {
          distance: 60,
          angle: 40,
          radius: 50,
          size: 100,
          opacity: 60
        }
        break
      case ShadowEffectType.none:
        return {}
      default:
        return generalUtils.assertUnreachable(effectName)
    }
    const { getCurrLayer: currLayer } = layerUtils
    const color = currLayer.type === LayerType.image
      ? (currLayer as IImage).styles.shadow.effects.color || '#000000' : '#000000'
    return {
      [effectName]: effect,
      color
    } as IShadowEffects
  }

  getKeysOf(effect: ShadowEffectType): Array<string> {
    return [
      ...Object.keys(
        effect === ShadowEffectType.none ? {} : this.getDefaultEffect(effect)[effect] as ShadowEffects)
    ]
  }

  updateEffect(layerInfo: ILayerInfo, effects: IShadowEffects) {
    store.commit('UPDATE_shadowEffect', {
      layerInfo,
      payload: effects
    })
  }

  updateEffectState(layerInfo: ILayerInfo, currentEffect: string) {
    store.commit('SET_shadowEffectState', {
      layerInfo,
      payload: { currentEffect }
    })
  }

  updateEffectProps(layerInfo: ILayerInfo, payload: Partial<IShadowProps>) {
    store.commit('UPDATE_shadowProps', {
      layerInfo,
      payload
    })
  }

  updateShadowStyles(layerInfo: ILayerInfo, payload: Partial<IShadowStyles>) {
    store.commit('UPDATE_shadowStyles', {
      layerInfo,
      payload
    })
  }

  updateShadowSrc(layerInfo: ILayerInfo, srcObj: SrcObj) {
    store.commit('SET_srcObj', {
      layerInfo,
      srcObj
    })
  }

  setShadowSrcState(layerInfo: ILayerInfo, attrs: {
    effect: ShadowEffectType,
    effects: IShadowEffects,
    layerSrcObj: SrcObj,
    shadowSrcObj: SrcObj,
    layerState: Partial<IImageStyle>
  }) {
    const { effect, effects, layerSrcObj, shadowSrcObj, layerState } = attrs
    store.commit('SET_srcState', { layerInfo, effect, effects, layerSrcObj, shadowSrcObj, layerState })
  }

  setUploadId(id?: ILayerIdentifier) {
    if (!id) {
      id = { pageId: '', layerId: '', subLayerId: '' }
    }
    store.commit('shadow/SET_UPLOAD_ID', id)
  }

  setProcessId(id?: ILayerIdentifier) {
    if (!id) {
      id = { pageId: '', layerId: '', subLayerId: '' }
    }
    store.commit('shadow/SET_PROCESS_ID', id)
  }

  setHandleId(id?: ILayerIdentifier) {
    if (!id) {
      id = { pageId: '', layerId: '', subLayerId: '' }
    }
    store.commit('shadow/SET_HANDLE_ID', id)
  }

  addUploadImg(data: IUploadShadowImg) {
    store.commit('shadow/ADD_UPLOAD_IMG', data)
  }
}

export const shadowPropI18nMap = {
  none: {
    _effectName: 'NN0428'
  },
  shadow: {
    distance: 'NN0431',
    angle: 'NN0432',
    radius: 'NN0426',
    spread: 'NN0421',
    opacity: 'NN0427',
    _effectName: 'NN0429'
  },
  blur: {
    radius: 'NN0426',
    spread: 'NN0421',
    opacity: 'NN0427',
    _effectName: 'NN0418'
  },
  imageMatched: {
    distance: 'NN0431',
    angle: 'NN0432',
    size: 'NN0422',
    radius: 'NN0426',
    opacity: 'NN0427',
    _effectName: 'NN0419'
  },
  frame: {
    radius: 'NN0426',
    spread: 'NN0423',
    opacity: 'NN0427',
    _effectName: 'NN0430'
  },
  floating: {
    x: 'NN0425',
    y: 'NN0424',
    radius: 'NN0426',
    opacity: 'NN0427',
    thinkness: 'NN0423',
    size: 'NN0422',
    _effectName: 'NN0420'
  }
}

export const fieldRange = {
  shadow: {
    distance: { max: 100, min: 0, weighting: 3 },
    angle: { max: 180, min: -180, weighting: 1 },
    radius: { max: 100, min: 0, weighting: 1.5 },
    opacity: { max: 100, min: 0, weighting: 1 },
    spread: { max: 30, min: 0, weighting: 1 }
  },
  blur: {
    radius: { max: 100, min: 0, weighting: 2 },
    spread: { max: 30, min: 5, weighting: 0.72 },
    opacity: { max: 100, min: 0, weighting: 0.01 }
  },
  imageMatched: {
    distance: { max: 100, min: 0, weighting: 3.5 },
    angle: { max: 180, min: -180, weighting: 1 },
    size: { max: 110, min: 70, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 1.5 },
    opacity: { max: 100, min: 0, weighting: 0.01 }
  },
  frame: {
    spread: { max: 30, min: 0, weighting: 0.72 },
    opacity: { max: 100, min: 0, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 2 }
  },
  floating: {
    opacity: { max: 100, min: 0, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 3 },
    thinkness: { max: 100, min: 0 },
    size: { max: 150, min: 25 },
    x: { max: 100, min: -100, weighting: 1 },
    y: { max: 100, min: -100, weighting: 1 }
  }
} as any

export default new ImageShadowUtils()
