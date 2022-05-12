import { SrcObj } from '@/interfaces/gallery'
import { IBlurEffect, IFloatingEffect, IFrameEffect, IImageMatchedEffect, IShadowEffect, IShadowEffects, IShadowProps, IShadowStyles, ShadowEffectType } from '@/interfaces/imgShadow'
import { IGroup, IImage } from '@/interfaces/layer'
import store from '@/store'
import { ILayerInfo, LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import imageUtils from './imageUtils'
import layerUtils from './layerUtils'
import mathUtils from './mathUtils'
import { imageDataRGBA } from './stackblur'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IImageMatchedEffect | IFloatingEffect

export const HALO_SPREAD_LIMIT = 80
export const CANVAS_SCALE = 1.8
export const CANVAS_SIZE = 510
export const CANVAS_MAX_SIZE = 1600
export const CANVAS_SPACE = 400
export const CANVAS_FLOATING_SCALE = 2.2
const DRAWING_TIMEOUT = 50
const FLOATING_SHADOW_SIZE = 100
export interface DrawOptions {
  canvasSize?: number,
  timeout?: number,
  layerInfo?: ILayerInfo,
  uploading?: boolean,
  drawCanvasW?: number,
  drawCanvasH?: number,
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
    img: HTMLImageElement,
    config: IImage,
    /** This identifier is used to indexing the sub-layer */
    primarylayerId?: string,
    // isTransparentBg: boolean,
    options?: DrawOptions
  } | null

  private dataBuff = {
    spread: -1,
    radius: -1,
    size: -1,
    effect: ShadowEffectType.none as ShadowEffectType,
    layerIdentifier: '' as string,
    data: {} as ImageData
  }

  get layerData() { return this._layerData }
  getHandlerId(): string {
    return this?.handlerId || ''
  }

  private drawingInit(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, options?: DrawOptions) {
    if (!this._layerData) {
      const { canvasT } = this
      const ctxT = canvasT.getContext('2d')
      if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
        canvasT.setAttribute('width', `${canvas.width}`)
        canvasT.setAttribute('height', `${canvas.height}`)
      }
      if (ctxT) {
        ctxT.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvasT.width, canvasT.height)
        this._layerData = { img, config }

        const { layerInfo } = options || {}
        if (layerInfo) {
          this._layerData.primarylayerId = layerUtils.getLayer(layerInfo.pageIndex, layerInfo.layerIndex).id
          this.updateEffectProps(layerInfo, {
            isTransparent: this.isTransparentBg(canvasT)
          })
        }
        if (options) {
          this._layerData.options = {
            ...this._layerData.options,
            ...options
          }
        }
        ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      }
    }
    if (this._draw) {
      clearTimeout(this._draw)
    }
  }

  async drawFloatingShadow(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, options: DrawOptions = {}) {
    if (!canvas || ![ShadowEffectType.floating].includes(config.styles.shadow.currentEffect)) return
    const { timeout = DRAWING_TIMEOUT } = options
    this.drawingInit(canvas, img, config, options)
    const handlerId = generalUtils.generateRandomString(6)
    this.handlerId = handlerId
    if (timeout) {
      setTimeout(() => {
        this.floatingHandler(canvas, img, config, handlerId, options)
      }, timeout)
    } else {
      await this.floatingHandler(canvas, img, config, handlerId, options)
    }
  }

  async floatingHandler(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, handlerId: string, options: DrawOptions = {}) {
    const { canvasT, canvasMaxSize } = this
    const ctxT = canvasT.getContext('2d')
    const ctxMaxSize = canvasMaxSize.getContext('2d')

    if (!ctxT || !ctxMaxSize) return
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = options
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { x, y, radius, opacity, size, spread, thinkness } = (effects as any)[currentEffect] as IFloatingEffect

    let { drawCanvasW, drawCanvasH, layerInfo } = options || {}
    if (!drawCanvasH || !drawCanvasW) {
      drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0 as number
      drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0 as number
    }
    if (!layerInfo || !Object.keys(layerInfo)) {
      layerInfo = this.layerData?.options?.layerInfo
    }
    layerInfo && this.setIsProcess(layerInfo, true)

    if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
      canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.setAttribute('height', `${canvas.height}`)
    }

    const mappingScale = _imgWidth > _imgHeight
      ? (layerWidth / _imgWidth) * 1600 / drawCanvasW
      : (layerHeight / _imgHeight) * 1600 / drawCanvasH

    const canvasMaxW = canvas.width * mappingScale
    const ellipseX = canvasMaxW * 0.5
    const ellipseY = (1.25 * canvas.height + 0.75 * drawCanvasH) * 0.5 * mappingScale
    const layerIdentifier = (config.id ?? '') + layerWidth.toString() + layerHeight.toString()

    if (!(this.dataBuff.effect === ShadowEffectType.floating && this.dataBuff.radius === radius && this.dataBuff.size === size && this.dataBuff.layerIdentifier === layerIdentifier)) {
      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)
      const shadowSize = FLOATING_SHADOW_SIZE * Math.max(layerWidth / _imgWidth, 0.3)
      ctxMaxSize.ellipse(ellipseX, ellipseY, 2 * shadowSize * (size * 0.01 + 2), shadowSize * (0.5 + thinkness * 0.005), 0, 0, Math.PI * 2)
      ctxMaxSize.fill()
      const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      const bluredData = await imageDataRGBA(imageData, 0, 0, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * 1.7) + 1, handlerId)

      if (this.handlerId === handlerId) {
        this.dataBuff.effect = ShadowEffectType.floating
        this.dataBuff.spread = spread
        this.dataBuff.size = size
        this.dataBuff.data = bluredData
        this.dataBuff.layerIdentifier = layerIdentifier
      } else {
        ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
        ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      }
    }

    await this.asyncProcessing(() => {
      if (this.handlerId === handlerId) {
        ctxMaxSize.putImageData(this.dataBuff.data, x * 1.5 * layerWidth / _imgWidth, y * 2 * layerWidth / _imgWidth)

        ctxT.drawImage(canvasMaxSize, 0, 0, canvasMaxSize.width, canvasMaxSize.height, 0, 0, canvasT.width, canvasT.height)
        ctxT.globalCompositeOperation = 'source-in'
        ctxT.globalAlpha = opacity * 0.01
        ctxT.fillStyle = effects.color
        ctxT.fillRect(0, 0, canvasT.width, canvasT.height)
        ctxT.globalAlpha = 1
        ctxT.globalCompositeOperation = 'source-over'

        // if (!timeout) {
        //   const imgX = _imgX * img.naturalWidth / _imgWidth
        //   const imgY = _imgY * img.naturalWidth / _imgWidth
        //   const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
        //   const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight
        //   const drawCanvasHeight = drawCanvasH as number
        //   const drawCanvasWidth = drawCanvasW as number
        //   const x = (canvasT.width - drawCanvasWidth) * 0.5
        //   const y = (canvasT.height - drawCanvasHeight) * 0.5
        //   ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x, y, drawCanvasWidth, drawCanvasHeight)
        // }

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(canvasT, 0, 0)
        layerInfo && !config.isUploading && this.setIsProcess(layerInfo, false)
      }
    })
    cb && cb()
  }

  async drawImageMatchedShadow(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, options: DrawOptions = {}) {
    if (!canvas || ![ShadowEffectType.imageMatched].includes(config.styles.shadow.currentEffect)) return
    const { timeout = DRAWING_TIMEOUT } = options
    this.drawingInit(canvas, img, config, options)
    const handlerId = generalUtils.generateRandomString(6)
    this.handlerId = handlerId
    if (timeout) {
      setTimeout(() => {
        this.imageMathcedHandler(canvas, img, config, handlerId, options)
      }, timeout)
    } else {
      await this.imageMathcedHandler(canvas, img, config, handlerId, options)
    }
  }

  async imageMathcedHandler(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, handlerId: string, options: DrawOptions = {}) {
    const { canvasT, canvasMaxSize } = this
    const ctxT = canvasT.getContext('2d')
    const ctxMaxSize = canvasMaxSize.getContext('2d')

    if (!ctxT || !ctxMaxSize) return
    ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
    ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = options
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { distance, angle, radius, opacity, size } = (effects as any)[currentEffect] as IImageMatchedEffect

    const scaleRatio = img.naturalWidth / _imgWidth
    const imgX = _imgX * scaleRatio
    const imgY = _imgY * scaleRatio
    const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
    const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight
    let { drawCanvasW, drawCanvasH, layerInfo } = options || {}
    if (!drawCanvasH || !drawCanvasW) {
      drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0 as number
      drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0 as number
    }
    drawCanvasW *= size * 0.01
    drawCanvasH *= size * 0.01
    const blurImgX = (canvas.width - drawCanvasW) * 0.5
    const blurImgY = (canvas.height - drawCanvasH) * 0.5

    if (!layerInfo || !Object.keys(layerInfo)) {
      layerInfo = this.layerData?.options?.layerInfo
    }
    layerInfo && this.setIsProcess(layerInfo, true)
    console.warn('drawing start', generalUtils.deepCopy(layerInfo))

    if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
      canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.setAttribute('height', `${canvas.height}`)
    }

    ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, blurImgX, blurImgY, drawCanvasW as number, drawCanvasH as number)
    const layerIdentifier = (config.id ?? '') + layerWidth.toString() + layerHeight.toString() + img.width.toString() + img.width.toString() + img.src
    if (!(this.dataBuff.effect === ShadowEffectType.imageMatched && this.dataBuff.radius === radius && this.dataBuff.size === size && this.dataBuff.layerIdentifier === layerIdentifier)) {
      // const mappingScale = 1600 / Math.max(drawCanvasW as number, drawCanvasH as number)
      const mappingScale = _imgWidth > _imgHeight
        ? (layerWidth / _imgWidth) * 1600 / (drawCanvasW as number)
        : (layerHeight / _imgHeight) * 1600 / (drawCanvasH as number)

      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)

      ctxMaxSize.drawImage(canvasT, 0, 0, canvasT.width, canvasT.height, 0, 0, canvasMaxSize.width, canvasMaxSize.height)
      const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      const bluredData = await imageDataRGBA(imageData, 0, 0, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * fieldRange.imageMatched.radius.weighting) + 1, handlerId)
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

    await this.asyncProcessing(() => {
      if (this.handlerId === handlerId) {
        const offsetX = distance && distance > 0 ? distance * mathUtils.cos(angle) * 4 : 0
        const offsetY = distance && distance > 0 ? distance * mathUtils.sin(angle) * 4 : 0
        ctxMaxSize.putImageData(this.dataBuff.data, offsetX, offsetY)

        ctxT.clearRect(0, 0, canvas.width, canvas.height)
        ctxT.globalAlpha = opacity * 0.01
        ctxT.drawImage(canvasMaxSize, 0, 0, canvasMaxSize.width, canvasMaxSize.height, 0, 0, canvasT.width, canvasT.height)
        ctxT.globalAlpha = 1

        // if (!timeout) {
        //   const { drawCanvasW, drawCanvasH } = options
        //   const x = (canvas.width - (drawCanvasW as number)) * 0.5
        //   const y = (canvas.height - (drawCanvasH as number)) * 0.5
        //   ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x, y, drawCanvasW as number, drawCanvasH as number)
        // }
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(canvasT, 0, 0)
        layerInfo && !config.isUploading && this.setIsProcess(layerInfo, false)
      }
    })
    cb && cb()
  }

  async drawShadow(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, options?: DrawOptions) {
    const { styles } = config
    const { timeout = DRAWING_TIMEOUT, cb } = options || {}
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { distance, angle, radius, spread, opacity } = (effects as any)[currentEffect] as IShadowEffect | IBlurEffect | IFrameEffect
    if (!canvas || ![ShadowEffectType.shadow, ShadowEffectType.blur, ShadowEffectType.frame].includes(currentEffect)) return
    this.drawingInit(canvas, img, config, options)

    const handlerId = generalUtils.generateRandomString(6)
    const handler = async () => {
      const { canvasT, canvasMaxSize } = this
      const ctxT = canvasT.getContext('2d')
      const ctxMaxSize = canvasMaxSize.getContext('2d')
      if (!ctxT || !ctxMaxSize) return
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

      let { layerInfo } = options || {}
      if (!layerInfo || !Object.keys(layerInfo)) {
        layerInfo = this.layerData?.options?.layerInfo
      }
      layerInfo && this.setIsProcess(layerInfo, true)
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      const scaleRatio = img.naturalWidth / _imgWidth
      const imgX = _imgX * scaleRatio
      const imgY = _imgY * scaleRatio
      const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
      const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight
      let { drawCanvasW, drawCanvasH } = options || {}
      if (!drawCanvasH || !drawCanvasW) {
        drawCanvasH = this.layerData?.options?.drawCanvasH ?? 0
        drawCanvasW = this.layerData?.options?.drawCanvasW ?? 0
      }
      const x = (canvas.width - drawCanvasW) * 0.5
      const y = (canvas.height - drawCanvasH) * 0.5

      const unifiedScale = Math.max(drawCanvasW, drawCanvasH) / Math.max(layerWidth, layerHeight) * config.styles.scale
      const unifiedSpread = spread * unifiedScale
      const unifiedSpreadRadius = this.SPREAD_RADIUS * unifiedScale
      const _spread = 1 / unifiedSpreadRadius
      const layerIdentifier = (config.id ?? '') + layerWidth.toString() + layerHeight.toString() + imgX.toString() + imgY.toString()

      if (canvasT.width !== canvas.width || canvasT.height !== canvas.height) {
        canvasT.setAttribute('width', `${canvas.width}`)
        canvasT.setAttribute('height', `${canvas.height}`)
      }

      let alphaVal = 1
      /** Calculating the spread */
      if (this.dataBuff.spread !== unifiedSpread || this.dataBuff.effect !== currentEffect || this.dataBuff.layerIdentifier !== layerIdentifier) {
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
        this.dataBuff.data = ctxT.getImageData(0, 0, canvasT.width, canvasT.height)
        this.dataBuff.effect = currentEffect
        this.dataBuff.spread = unifiedSpread
        this.dataBuff.layerIdentifier = layerIdentifier
      } else {
        ctxT.putImageData(this.dataBuff.data, 0, 0)
      }

      const mappingScale = _imgWidth > _imgHeight
        ? (layerWidth / _imgWidth) * 1600 / (drawCanvasW as number)
        : (layerHeight / _imgHeight) * 1600 / (drawCanvasH as number)
      canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
      canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)

      ctxMaxSize.drawImage(canvasT, 0, 0, canvasT.width, canvasT.height, 0, 0, canvasMaxSize.width, canvasMaxSize.height)
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
      // const bluredData = imageData
      const bluredData = await imageDataRGBA(imageData, 0, 0, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * fieldRange.shadow.radius.weighting) + 1, handlerId)

      if (this.handlerId === handlerId) {
        const offsetX = distance && distance > 0 ? distance * mathUtils.cos(angle) * fieldRange.shadow.distance.weighting : 0
        const offsetY = distance && distance > 0 ? distance * mathUtils.sin(angle) * fieldRange.shadow.distance.weighting : 0
        ctxMaxSize.putImageData(bluredData, offsetX, offsetY)
      } else {
        ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
        ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)
        return
      }

      await this.asyncProcessing(() => {
        if (this.handlerId === handlerId) {
          ctxT.drawImage(canvasMaxSize, 0, 0, canvasMaxSize.width, canvasMaxSize.height, 0, 0, canvasT.width, canvasT.height)

          ctxT.globalCompositeOperation = 'source-in'
          ctxT.globalAlpha = opacity * 0.01
          ctxT.fillStyle = effects.color
          ctxT.fillRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)
          ctxT.globalAlpha = 1

          ctxT.globalCompositeOperation = 'source-over'
          /** only draw the origin image over the canvas as uploading */
          // if (!timeout) {
          //   ctxT.save()
          //   ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x, y, drawCanvasW as number, drawCanvasH as number)
          //   ctxT.restore()
          // }

          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(canvasT, 0, 0)
          layerInfo && !config.isUploading && this.setIsProcess(layerInfo, false)
          cb && cb()
        }
      })
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
      // window.requestAnimationFrame(() => {
      //   cb()
      //   resolve()
      // })
    })
  }

  isTransparentBg(target: HTMLCanvasElement | HTMLImageElement): boolean {
    let canvas = this.canvasT
    if (target instanceof HTMLCanvasElement) {
      canvas = this.canvasT
    } else {
      const { naturalWidth, naturalHeight } = target as HTMLImageElement
      canvas.setAttribute('width', naturalWidth.toString())
      canvas.setAttribute('height', naturalHeight.toString())
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      ctx.drawImage(target, 0, 0, naturalWidth, naturalHeight)
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
    return pivots.some(p => p[3] === 0)
  }

  setIsProcess(layerInfo: ILayerInfo, drawing: boolean) {
    const { pageIndex, layerIndex, subLayerIdx } = layerInfo
    layerUtils.updateLayerProps(pageIndex, layerIndex, {
      inProcess: drawing
    }, subLayerIdx)
  }

  clearLayerData() {
    this._layerData = null
  }

  setEffect (effect: ShadowEffectType, attrs = {}, _pageIndex = -1, _layerIndex = -1, _subLayerIdx = -1): void {
    let { pageIndex, layerIndex, subLayerIdx } = layerUtils
    _pageIndex !== -1 && (pageIndex = _pageIndex)
    _layerIndex !== -1 && (layerIndex = _layerIndex)
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

      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        initWidth: width,
        initHeight: height,
        scale: 1,
        adjust: {}
      }, subLayerIdx)

      if (layer.styles.shadow.currentEffect !== effect) {
        this.updateEffectState(layerInfo, effect)
      }
      this.updateEffect(layerInfo, {
        ...effects,
        ...attrs
      })
    }
  }

  /** Only used for blur and floating effects */
  convertShadowEffect(config: IImage): { [key: string]: string | number } {
    const { shadow, scale } = config.styles
    const { color = '#000000' } = shadow.effects
    const effect = shadow.currentEffect !== ShadowEffectType.none
      ? shadow.effects[shadow.currentEffect] : {}

    switch (shadow.currentEffect) {
      case ShadowEffectType.imageMatched: {
        const { radius, distance, angle, size, opacity } = effect as ShadowEffects
        const x = distance * mathUtils.cos(angle)
        const y = distance * mathUtils.sin(angle)
        return {
          backgroundImage: `url(${imageUtils.getSrc(config)})`,
          backgroundColor: `rgba(255, 255, 255, ${1 - opacity / 100})`,
          backgroundBlendMode: 'overlay',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          zIndex: -1,
          width: `${size}%`,
          height: `${size}%`,
          bottom: `${-y}%`,
          left: `${x - (size - 100) / 2}%`,
          filter: `blur(${radius * scale}px)`
        }
      }
      case ShadowEffectType.floating: {
        const { radius, spread, opacity, x, y, size } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity', 'size']) as ShadowEffects
        return {
          width: `${size}%`,
          left: `${x * fieldRange.floating.x.weighting + (100 - size) / 2}%`,
          bottom: `${-y * fieldRange.floating.y.weighting}%`,
          zIndex: -1,
          boxShadow:
          // `0px ${HALO_Y_OFFSET * scale}px ` +
          `${(radius + 30) * fieldRange.floating.radius.weighting}px ` +
          `${spread}px ` +
          `${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.none:
      case ShadowEffectType.blur:
      case ShadowEffectType.shadow:
      case ShadowEffectType.frame:
        return {}
      default:
        return generalUtils.assertUnreachable(shadow.currentEffect)
    }
  }

  getImgEdgeWidth(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      .data.reduce((pixel, c, i) => {
        if (i % 4 === 0) {
          pixel.push([c])
        } else {
          pixel[pixel.length - 1].push(c)
        }
        return pixel
      }, [] as Array<Array<number>>)
      .reduce((row, p, i) => {
        if (i % canvas.width === 0) {
          row.push([p])
        } else {
          row[row.length - 1].push(p)
        }
        return row
      }, [] as Array<Array<Array<number>>>)

    let reach = false
    let top = 0
    const alphaTresh = 0
    while (!reach && top < canvas.height) {
      for (let i = 0; i < canvas.width; i++) {
        if (imageData[top][i][3] > alphaTresh) {
          reach = true
          break
        }
      }
      top++
    }
    reach = false
    let bottom = 0
    while (!reach && bottom < canvas.height) {
      for (let i = 0; i < canvas.width; i++) {
        if (imageData[canvas.height - bottom - 1][i][3] > alphaTresh) {
          reach = true
          break
        }
      }
      bottom++
    }
    reach = false
    let left = 0
    while (!reach && left < canvas.width) {
      for (let j = 0; j < canvas.height; j++) {
        if (imageData[j][left][3] > alphaTresh) {
          reach = true
          break
        }
      }
      left++
    }
    reach = false
    let right = 0
    while (!reach && right < canvas.width) {
      for (let j = 0; j < canvas.height; j++) {
        if (imageData[j][canvas.width - right - 1][3] > alphaTresh) {
          reach = true
          break
        }
      }
      right++
    }
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
          distance: 60,
          angle: 45,
          radius: 70,
          spread: 15,
          opacity: 70
        }
        break
      case ShadowEffectType.floating: {
        (effect as IFloatingEffect) = {
          x: 0,
          y: 0,
          radius: 60,
          size: 70,
          thinkness: 50,
          opacity: 65
        }
        break
      }
      case ShadowEffectType.blur:
        (effect as IBlurEffect) = {
          radius: 50,
          spread: 15,
          opacity: 55
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
          distance: 35,
          angle: 45,
          radius: 60,
          size: 100,
          opacity: 55
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
    distance: { max: 100, min: 0, weighting: 1.5 },
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
    distance: { max: 100, min: 0, weighting: 2 },
    angle: { max: 180, min: -180, weighting: 2 },
    size: { max: 200, min: 50, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 1.7 },
    opacity: { max: 100, min: 0, weighting: 0.01 }
  },
  frame: {
    spread: { max: 30, min: 0, weighting: 0.72 },
    opacity: { max: 100, min: 0, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 2 }
  },
  floating: {
    opacity: { max: 100, min: 0, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 1.2 },
    thinkness: { max: 100, min: 0 },
    size: { max: 200, min: 50 },
    x: { max: 100, min: -100, weighting: 0.5 },
    y: { max: 100, min: -100, weighting: 0.5 }
  }
} as any

export default new ImageShadowUtils()
