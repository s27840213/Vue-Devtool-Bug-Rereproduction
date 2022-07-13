import { SrcObj } from '@/interfaces/gallery'
import { IBlurEffect, IFloatingEffect, IFrameEffect, IImageMatchedEffect, IShadowEffect, IShadowEffects, IShadowProps, IShadowStyles, ShadowEffectType } from '@/interfaces/imgShadow'
import { IGroup, IImage, IImageStyle, ILayerIdentifier } from '@/interfaces/layer'
import store from '@/store'
import { IUploadShadowImg } from '@/store/module/shadow'
import { ILayerInfo, LayerProcessType, LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import imageShadowPanelUtils from './imageShadowPanelUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import logUtils from './logUtils'
import mathUtils from './mathUtils'
import pageUtils from './pageUtils'
import { imageDataAChannel, imageDataRGBA } from './stackblur'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IImageMatchedEffect | IFloatingEffect

export const HALO_SPREAD_LIMIT = 80
export const CANVAS_SCALE = 1.8
export const CANVAS_SIZE = 510
export const CANVAS_MAX_SIZE = 1600
export const CANVAS_SPACE = 400
export const CANVAS_FLOATING_SCALE = 2.2
const DRAWING_TIMEOUT = 50
const FLOATING_SHADOW_SIZE = 100

/** These attrs are used to indicate the performance of each shadow effect */
const isProduction = process.env.NODE_ENV === 'production'
const marks = {
  shadow: [
    'starting',
    'before handle spread',
    'after handle spread; before handle blur',
    'after handle blur; before handle overlay, opacity...',
    'finishing'
  ],
  imageMatched: [
    'starting',
    'before handle blur',
    'after handle blur; before handle offset/overlay',
    'finishing'
  ],
  floating: [
    'starting',
    'before handle geometry and blur',
    'after handle geometry and blur; before handle distance/overlay',
    'finishing'
  ]
}
const setMark = function (type: 'shadow' | 'imageMatched' | 'floating', i: number) {
  // if (isProduction) return
  performance.mark(marks[type][i])
}
const logMark = function (type: 'shadow' | 'imageMatched' | 'floating', ...logs: string[]) {
  // if (isProduction) return
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
   * canvasMaxSize used to handle/draw the parametera as blur or offset...,
   * as a parameter unified canvas for different size of image.
   */
  private canvasMaxSize = document.createElement('canvas')
  private _draw = undefined as number | undefined
  private handlerId = ''

  private _layerData = null as {
    config: IImage,
    pageId: string,
    /** This identifier is used to indexing the sub-layer */
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

  get layerData() { return this._layerData }
  get inUploadProcess() { return this._inUploadProcess }

  setUploadProcess(val: boolean) {
    this._inUploadProcess = val
  }

  getHandlerId(): string {
    return this?.handlerId || ''
  }

  drawingInit(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, params: DrawParams) {
    this.clearLayerData()
    const { canvasT } = this
    const ctxT = canvasT.getContext('2d')
    if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
      canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.setAttribute('height', `${canvas.height}`)
    }
    if (ctxT) {
      this._layerData = { config, pageId: params.pageId || pageUtils.currFocusPage.id }
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
        // ctxT.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvasT.width, canvasT.height)
        // this.updateEffectProps(layerInfo, {
        //   isTransparent: this.isTransparentBg(canvasT)
        // })
        // ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      }
      if (params) {
        this._layerData.options = {
          ...this._layerData.options,
          ...params
        }
      }
    }
    if (this._draw) {
      clearTimeout(this._draw)
    }
  }

  async drawFloatingShadow(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    if (!canvas || ![ShadowEffectType.floating].includes(config.styles.shadow.currentEffect)) return
    const { timeout = DRAWING_TIMEOUT } = params
    // this.drawingInit(canvas, img, config, params)
    const handlerId = generalUtils.generateRandomString(6)
    this.handlerId = handlerId
    if (timeout) {
      setTimeout(() => {
        this.floatingHandler(canvas_s, img, config, handlerId, params)
      }, timeout)
    } else {
      await this.floatingHandler(canvas_s, img, config, handlerId, params)
    }
  }

  async floatingHandler(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, handlerId: string, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    setMark('floating', 0)
    const { canvasT, canvasMaxSize } = this
    const ctxT = canvasT.getContext('2d')
    const ctxMaxSize = canvasMaxSize.getContext('2d')

    if (!ctxT || !ctxMaxSize) return
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = params
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { x, y, radius, opacity, size, thinkness } = (effects as any)[currentEffect] as IFloatingEffect

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

    let MAXSIZE = 1600
    if (['private', 'public', 'logo-private', 'logo-public', 'background'].includes(config.srcObj.type)) {
      const res = await imageUtils.getImgSize(config.srcObj)
      if (res) {
        MAXSIZE = Math.min(Math.max(res.data.height, res.data.width), 1600)
      }
    }
    const mappingScale = _imgWidth > _imgHeight
      ? (layerWidth / _imgWidth) * MAXSIZE / drawCanvasW
      : (layerHeight / _imgHeight) * MAXSIZE / drawCanvasH
    const attrFactor = MAXSIZE / 1600

    const canvasMaxW = canvas.width * mappingScale
    const ellipseX = canvasMaxW * 0.5
    const ellipseY = ((canvas.height - drawCanvasH) * 0.5 + drawCanvasH) * mappingScale
    // const ellipseY = (1.25 * canvas.height + 0.75 * drawCanvasH) * 0.5 * mappingScale
    const layerIdentifier = (config.id ?? '') + `${layerWidth}${layerHeight}`
    const hasBuffRecorded = this.dataBuff.effect === ShadowEffectType.floating &&
      this.dataBuff.radius === radius && this.dataBuff.size === size &&
      this.dataBuff.layerIdentifier === layerIdentifier && this.dataBuff.thinkness === thinkness

    if (layerInfo && timeout && !hasBuffRecorded) {
      this.setIsProcess(layerInfo, true)
    }

    const offsetX = x * drawCanvasW * mappingScale * 0.0025
    const offsetY = y * drawCanvasH * mappingScale * 0.0025

    setMark('floating', 1)
    if ((this.handlerId === handlerId) || !timeout) {
      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)
      const shadowSize = FLOATING_SHADOW_SIZE * Math.max(layerWidth / _imgWidth, 0.3)
      ctxMaxSize.ellipse(offsetX + ellipseX, offsetY + ellipseY, 2 * attrFactor * shadowSize * (size * 0.01 + 2), shadowSize * attrFactor * (thinkness * 0.01), 0, 0, Math.PI * 2)
      // ctxMaxSize.ellipse(ellipseX, ellipseY, 2 * attrFactor * shadowSize * (size * 0.01 + 2), shadowSize * attrFactor * (thinkness * 0.01), 0, 0, Math.PI * 2)
      ctxMaxSize.fill()
      const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      // radius: value bar is available in range of 0 ~ 100, which should be mapping to 50 ~ 100 as the actual computation radius
      const bluredData = await imageDataAChannel(imageData, canvasMaxSize.width, canvasMaxSize.height, Math.floor((radius * 0.5) * attrFactor * fieldRange.floating.radius.weighting), handlerId)

      if (this.handlerId === handlerId) {
        this.dataBuff.effect = ShadowEffectType.floating
        this.dataBuff.radius = radius
        this.dataBuff.size = size
        this.dataBuff.data = bluredData
        this.dataBuff.layerIdentifier = layerIdentifier
        this.dataBuff.thinkness = thinkness
      } else {
        return
      }
    }

    setMark('floating', 2)
    await this.asyncProcessing(() => {
      if (this.handlerId === handlerId) {
        // const offsetX = x * drawCanvasW * mappingScale * 0.0025 * fieldRange.floating.x.weighting
        // const offsetY = (y - 10) * drawCanvasH * mappingScale * 0.0025 * fieldRange.floating.y.weighting
        // console.log(canvasMaxSize.height, offsetX, offsetY)
        // ctxMaxSize.putImageData(this.dataBuff.data, offsetX, offsetY)
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
    })
    setMark('floating', 3)
    logMark('floating', `CANVAS_MAX_SIZE: (${canvasMaxSize.width}, ${canvasMaxSize.height})`, `CANVANST: (${canvasT.width}, ${canvasT.height}) `)
  }

  async drawImageMatchedShadow(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    if (!canvas || ![ShadowEffectType.imageMatched].includes(config.styles.shadow.currentEffect)) return
    const { timeout = DRAWING_TIMEOUT } = params
    // this.drawingInit(canvas, img, config, params)
    const handlerId = generalUtils.generateRandomString(6)
    this.handlerId = handlerId
    if (timeout) {
      setTimeout(() => {
        this.imageMathcedHandler(canvas_s, img, config, handlerId, params)
      }, timeout)
    } else {
      await this.imageMathcedHandler(canvas_s, img, config, handlerId, params)
    }
  }

  async imageMathcedHandler(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, handlerId: string, params: DrawParams) {
    console.log('start drawing imageMatched:', params.timeout)
    const canvas = canvas_s[0] || undefined
    setMark('imageMatched', 0)
    const { canvasT, canvasMaxSize } = this
    const ctxT = canvasT.getContext('2d')
    const ctxMaxSize = canvasMaxSize.getContext('2d')

    if (!ctxT || !ctxMaxSize) return
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = params
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { distance, angle, radius, opacity, size } = (effects as any)[currentEffect] as IImageMatchedEffect

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

    let MAXSIZE = 1600
    if (['private', 'public', 'logo-private', 'logo-public', 'background'].includes(config.srcObj.type)) {
      const res = await imageUtils.getImgSize(config.srcObj)
      if (res) {
        MAXSIZE = Math.min(Math.max(res.data.height, res.data.width), 1600)
      }
    }
    const mappingScale = _imgWidth > _imgHeight
      ? MAXSIZE / drawCanvasW
      : MAXSIZE / drawCanvasH
    const attrFactor = MAXSIZE / 1600

    setMark('imageMatched', 1)
    if ((this.handlerId === handlerId && !hasBuffRecorded) || !timeout) {
      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)

      ctxMaxSize.drawImage(canvasT, 0, 0, canvasT.width, canvasT.height, 0, 0, canvasMaxSize.width, canvasMaxSize.height)
      const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      const bluredData = await imageDataRGBA(imageData, 0, 0, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * attrFactor * fieldRange.imageMatched.radius.weighting) + 1, handlerId)
      if (handlerId === this.handlerId) {
        this.dataBuff.effect = ShadowEffectType.imageMatched
        this.dataBuff.radius = radius
        this.dataBuff.size = size
        this.dataBuff.data = bluredData
        this.dataBuff.layerIdentifier = layerIdentifier
      } else {
        return
      }
    }
    setMark('imageMatched', 2)
    await this.asyncProcessing(() => {
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
    })
  }

  async drawShadow(canvas_s: HTMLCanvasElement[], img: HTMLImageElement, config: IImage, params: DrawParams) {
    const canvas = canvas_s[0] || undefined
    const { timeout = DRAWING_TIMEOUT, cb } = params || {}
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = config.styles
    const { effects, currentEffect } = shadow
    const { distance, angle, radius, spread, opacity } = (effects as any)[currentEffect] as IShadowEffect | IBlurEffect | IFrameEffect
    if (!canvas || ![ShadowEffectType.shadow, ShadowEffectType.blur, ShadowEffectType.frame].includes(currentEffect)) return
    // this.drawingInit(canvas, img, config, params)

    const handlerId = generalUtils.generateRandomString(6)
    const handler = async () => {
      setMark('shadow', 0)
      const { canvasT, canvasMaxSize } = this
      const ctxT = canvasT.getContext('2d')
      const ctxMaxSize = canvasMaxSize.getContext('2d')
      if (!ctxT || !ctxMaxSize) return
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

      let { layerInfo } = params || {}
      if (!layerInfo || !Object.keys(layerInfo)) {
        layerInfo = this.layerData?.options?.layerInfo
      }
      const scaleRatio = img.naturalWidth / _imgWidth
      const imgX = _imgX * scaleRatio
      const imgY = _imgY * scaleRatio
      const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
      const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight

      let { drawCanvasW, drawCanvasH } = params || {}
      if (!drawCanvasH || !drawCanvasW) {
        drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0
        drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0
      }
      const x = (canvas.width - drawCanvasW) * 0.5
      const y = (canvas.height - drawCanvasH) * 0.5

      const unifiedScale = Math.max(drawCanvasW, drawCanvasH) / Math.max(layerWidth, layerHeight) * config.styles.scale
      const unifiedSpread = Math.ceil(spread * unifiedScale)
      const unifiedSpreadRadius = this.SPREAD_RADIUS * unifiedScale
      const _spread = 1 / unifiedSpreadRadius
      const layerIdentifier = (config.id ?? '') + `${layerWidth}${layerHeight}${imgX}${imgY}${_imgHeight}${_imgWidth}${img.src}`
      const hasBuffRecorded = this.dataBuff.spread === unifiedSpread && this.dataBuff.effect === currentEffect && this.dataBuff.layerIdentifier === layerIdentifier

      /**
       * Show the process icon as:
       * 1. this drawing is not an uploading draw -> timeout !== 0
       * 2. or, this drawing is an uploading draw and the canvas is empty
       */
      if (layerInfo && timeout) {
        this.setIsProcess(layerInfo, true)
      }

      if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
        canvasT.setAttribute('width', `${canvas.width}`)
        canvasT.setAttribute('height', `${canvas.height}`)
      }

      setMark('shadow', 1)
      let alphaVal = 1
      /** Calculating the spread */
      if (!hasBuffRecorded || !timeout) {
        for (let i = -unifiedSpread; i <= unifiedSpread && this.handlerId === handlerId; i++) {
          await this.asyncProcessing(() => {
            for (let j = -unifiedSpread; j <= unifiedSpread && this.handlerId === handlerId; j++) {
              const r = Math.sqrt(i * i + j * j)
              if (r >= unifiedSpread + unifiedSpreadRadius && (currentEffect !== ShadowEffectType.frame || shadow?.isTransparent)) {
                alphaVal = 0
              } else if (r >= unifiedSpread && (currentEffect !== ShadowEffectType.frame || shadow?.isTransparent)) {
                alphaVal = (1 - (r - unifiedSpread) * _spread)
              } else {
                alphaVal = 1
              }
              if (alphaVal) {
                ctxT.globalAlpha = alphaVal
                ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x + i, y + j, drawCanvasW as number, drawCanvasH as number)
              }
            }
          })
        }
        ctxT.globalAlpha = 1
        if (this.handlerId === handlerId) {
          this.dataBuff.data = ctxT.getImageData(0, 0, canvasT.width, canvasT.height)
          this.dataBuff.effect = currentEffect
          this.dataBuff.spread = unifiedSpread
          this.dataBuff.layerIdentifier = layerIdentifier
        } else {
          return
        }
      } else {
        ctxT.putImageData(this.dataBuff.data, 0, 0)
      }
      setMark('shadow', 2)
      let MAXSIZE = 1600
      if (['private', 'public', 'logo-private', 'logo-public', 'background'].includes(config.srcObj.type)) {
        const res = await imageUtils.getImgSize(config.srcObj)
        if (res) {
          MAXSIZE = Math.min(Math.max(res.data.height, res.data.width), 1600)
        }
      }
      const mappingScale = _imgWidth > _imgHeight
        ? MAXSIZE / drawCanvasW
        : MAXSIZE / drawCanvasH
      const arrtFactor = MAXSIZE / 1600

      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${Math.ceil(canvas.width * mappingScale)}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${Math.ceil(canvas.height * mappingScale)}`)

      if (this.handlerId === handlerId) {
        ctxMaxSize.drawImage(canvasT, 0, 0, canvasT.width, canvasT.height, 0, 0, canvasMaxSize.width, canvasMaxSize.height)
        ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
        const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
        const bluredData = await imageDataAChannel(imageData, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * arrtFactor * fieldRange.shadow.radius.weighting) + 1, handlerId)

        const offsetX = distance && distance > 0 ? distance * mathUtils.cos(angle) * arrtFactor * fieldRange.shadow.distance.weighting : 0
        const offsetY = distance && distance > 0 ? distance * mathUtils.sin(angle) * arrtFactor * fieldRange.shadow.distance.weighting : 0
        ctxMaxSize.putImageData(bluredData, offsetX, offsetY)
      } else {
        return
      }
      setMark('shadow', 3)

      await this.asyncProcessing(() => {
        if (this.handlerId === handlerId) {
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
      })
      setMark('shadow', 4)
      logMark('shadow', `CANVAS_MAX_SIZE: (${canvasMaxSize.width}, ${canvasMaxSize.height})`, `CANVANST: (${canvasT.width}, ${canvasT.height}) `)
    }
    this.handlerId = handlerId
    if (timeout) {
      this._draw = setTimeout(handler, timeout)
    } else {
      await handler()
      this.dataBuff.spread = -1
    }
  }

  async asyncProcessing(cb: () => void) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        cb()
        resolve()
      }, 0)
    })
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
      .reduce((arr, val, i) => {
        if (i % 4 === 0) {
          arr.push([val])
        } else {
          arr[arr.length - 1].push(val)
        }
        return arr
      }, [] as Array<Array<number>>)

    const pivots = [data[0], data[width - 1], data[data.length - width - 1], data[data.length - 1]]
    return pivots.some(p => p[3] !== 255)
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

  setEffect(effect: ShadowEffectType, attrs = {}, _pageIndex = -1, _layerIndex = -1, _subLayerIdx = -1): void {
    let { pageIndex, layerIndex, subLayerIdx } = layerUtils
    if (_pageIndex !== -1) {
      pageIndex = _pageIndex
    }
    if (_layerIndex !== -1) {
      layerIndex = _layerIndex
    }
    if (_pageIndex !== -1 && _layerIndex !== -1 && _subLayerIdx !== -1) {
      subLayerIdx = _subLayerIdx
    }

    const layer = subLayerIdx !== -1
      ? (layerUtils.getLayer(pageIndex, layerIndex) as IGroup).layers[subLayerIdx] as IImage
      : layerUtils.getLayer(pageIndex, layerIndex) as IImage

    if (layer.type === LayerType.image) {
      const { shadow, width, height } = layer.styles
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
          initWidth: width,
          initHeight: height,
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
          size: 60,
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
          distance: 40,
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

  setShadowSrcState(layerInfo: ILayerInfo, effect: ShadowEffectType, effects: IShadowEffects, srcObj: SrcObj, layerState?: Partial<IImageStyle>) {
    store.commit('SET_srcState', { layerInfo, effect, effects, srcObj, layerState })
  }

  setUploadId(id: ILayerIdentifier) {
    store.commit('shadow/SET_UPLOAD_ID', id)
  }

  setProcessId(id: ILayerIdentifier) {
    store.commit('shadow/SET_PROCESS_ID', id)
  }

  setHandleId(id: ILayerIdentifier) {
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
    distance: { max: 100, min: 0, weighting: 4 },
    angle: { max: 180, min: -180, weighting: 1 },
    size: { max: 120, min: 50, weighting: 0.01 },
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
    size: { max: 200, min: 50 },
    x: { max: 100, min: -100, weighting: 1 },
    y: { max: 75, min: -100, weighting: 1 }
  }
} as any

export default new ImageShadowUtils()
