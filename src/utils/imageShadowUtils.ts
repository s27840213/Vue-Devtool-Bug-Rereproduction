import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { ILayerInfo, LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import mathUtils from './mathUtils'
import { IBlurEffect, IFrameEffect, IHaloEffect, IProjectionEffect, IShadowEffect, IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import imageUtils from './imageUtils'
import * as StackBlur from 'stackblur-canvas'
import store from '@/store'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IHaloEffect | IProjectionEffect

const HALO_Y_OFFSET = 70 as const
export const HALO_SPREAD_LIMIT = 80
export const CANVAS_SCALE = 1.5
export const CANVAS_SIZE = 510
export interface DrawOptions {
  canvasSize?: number,
  timeout?: number,
  layerInfo?: ILayerInfo,
  coverImg?: HTMLImageElement,
  uploading?: boolean
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
    isTransparentBg: boolean
  } | null

  private spreadBuff = {
    spread: -1,
    effect: ShadowEffectType.none as ShadowEffectType,
    size: -1,
    data: {} as ImageData
  }

  get layerData() { return this._layerData }

  async draw(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, options: DrawOptions = {}) {
    const { styles } = config
    const { timeout = 25, layerInfo, coverImg } = options
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { distance, angle, radius, spread, opacity } = (effects as any)[currentEffect] as IShadowEffect | IBlurEffect | IFrameEffect
    if (!canvas || (currentEffect === ShadowEffectType.none || currentEffect === ShadowEffectType.halo ||
      currentEffect === ShadowEffectType.projection)) return
    if (this._draw) {
      clearTimeout(this._draw)
    }
    if (!this._layerData) {
      const { canvasT } = this
      const ctxT = canvasT.getContext('2d')
      ctxT && ctxT.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvasT.width, canvasT.height)
      const isTransparentBg = this.isTransparentBg(canvasT)
      this._layerData = { img, config, isTransparentBg }
      if (layerInfo && layerInfo.subLayerIdx !== -1 && typeof layerInfo.subLayerIdx !== 'undefined') {
        this._layerData.primarylayerId = layerUtils.getLayer(layerInfo.pageIndex, layerInfo.layerIndex).id
      }
    }

    const handlerId = generalUtils.generateRandomString(6)
    const handler = async () => {
      console.log('start drawing')
      const { canvasT, canvasMaxSize } = this
      const ctxT = canvasT.getContext('2d')
      const ctxMaxSize = canvasMaxSize.getContext('2d')
      if (!ctxT || !ctxMaxSize) return
      ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
      ctxMaxSize.clearRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)

      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
      const scaleRatio = img.naturalWidth / _imgWidth
      const imgX = _imgX * scaleRatio
      const imgY = _imgY * scaleRatio
      const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
      const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight
      const drawCanvasHeight = img.naturalHeight
      const drawCanvasWidth = img.naturalWidth
      const x = canvas.width * (CANVAS_SCALE - 1) / CANVAS_SCALE * 0.5
      const y = canvas.height * (CANVAS_SCALE - 1) / CANVAS_SCALE * 0.5

      const unifiedScale = img.width / CANVAS_SIZE
      const unifiedSpread = spread * unifiedScale
      const unifiedSpreadRadius = this.SPREAD_RADIUS * unifiedScale
      const _spread = 1 / unifiedSpreadRadius

      canvasT.width !== canvas.width && canvasT.setAttribute('width', `${canvas.width}`)
      canvasT.height !== canvas.height && canvasT.setAttribute('height', `${canvas.height}`)

      let alphaVal = 1
      /** Calculating the spread */
      if (this.spreadBuff.spread !== unifiedSpread || this.spreadBuff.effect !== currentEffect || this.spreadBuff.size !== img.naturalHeight) {
        layerInfo && this.setIsProcess(layerInfo, true)
        this.spreadBuff.effect = currentEffect
        for (let i = -unifiedSpread; i <= unifiedSpread && this.handlerId === handlerId; i++) {
          await this.asyncProcessing(() => {
            for (let j = -unifiedSpread; j <= unifiedSpread && this.handlerId === handlerId; j++) {
              const r = Math.sqrt(i * i + j * j)
              if (r >= unifiedSpread + unifiedSpreadRadius && (currentEffect !== ShadowEffectType.frame || this.layerData?.isTransparentBg)) {
                alphaVal = 0
              } else if (r >= unifiedSpread && (currentEffect !== ShadowEffectType.frame || this.layerData?.isTransparentBg)) {
                alphaVal = (1 - (r - unifiedSpread) * _spread)
              } else {
                alphaVal = 1
              }
              if (alphaVal) {
                ctxT.globalAlpha = alphaVal
                ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x + i, y + j, drawCanvasWidth, drawCanvasHeight)
              }
            }
          })
        }
        ctxT.globalAlpha = 1
        this.spreadBuff.data = ctxT.getImageData(0, 0, canvasT.width, canvasT.height)
        this.spreadBuff.size = img.naturalHeight
        this.spreadBuff.spread = unifiedSpread
        this.handlerId === handlerId && layerInfo && this.setIsProcess(layerInfo, false)
      } else {
        ctxT.putImageData(this.spreadBuff.data, 0, 0)
      }

      await this.asyncProcessing(() => {
        if (this.handlerId === handlerId) {
          if (timeout) {
            const mappingScale = 1600 / CANVAS_SIZE
            canvasMaxSize.width !== canvas.width * mappingScale && canvasMaxSize.setAttribute('width', `${canvas.width * mappingScale}`)
            canvasMaxSize.height !== canvas.height * mappingScale && canvasMaxSize.setAttribute('height', `${canvas.height * mappingScale}`)
          } else {
            canvasMaxSize.setAttribute('width', `${canvas.width}`)
            canvasMaxSize.setAttribute('height', `${canvas.height}`)
          }

          ctxMaxSize.drawImage(canvasT, 0, 0, canvasT.width, canvasT.height, 0, 0, canvasMaxSize.width, canvasMaxSize.height)
          ctxT.clearRect(0, 0, canvasT.width, canvasT.height)
          const imageData = ctxMaxSize.getImageData(0, 0, canvasMaxSize.width, canvasMaxSize.height)
          StackBlur.imageDataRGBA(imageData, 0, 0, canvasMaxSize.width, canvasMaxSize.height, Math.floor(radius * 1.25) + 1)
          const offsetX = distance && distance > 0 ? distance * mathUtils.cos(angle) * 2 : 0
          const offsetY = distance && distance > 0 ? distance * mathUtils.sin(angle) * 2 : 0
          ctxMaxSize.putImageData(imageData, offsetX, offsetY)
        }
      })

      await this.asyncProcessing(() => {
        if (ctxT && this.handlerId === handlerId) {
          ctxT.drawImage(canvasMaxSize, 0, 0, canvasMaxSize.width, canvasMaxSize.height, 0, 0, canvasT.width, canvasT.height)

          ctxT.globalCompositeOperation = 'source-in'
          ctxT.globalAlpha = opacity / 100
          ctxT.fillStyle = effects.color
          ctxT.fillRect(0, 0, canvasMaxSize.width, canvasMaxSize.height)
          ctxT.globalAlpha = 1

          ctxT.globalCompositeOperation = 'source-over'
          if (coverImg) {
            const coverRatio = coverImg.naturalWidth / _imgWidth
            const coverImgX = _imgX * coverRatio
            const coverImgY = _imgY * coverRatio
            const coverImgW = coverImg.naturalWidth * layerWidth / _imgWidth
            const coverImgH = coverImg.naturalHeight * layerHeight / _imgHeight
            ctxT.drawImage(coverImg, -coverImgX, -coverImgY, coverImgW, coverImgH, x, y, drawCanvasWidth, drawCanvasHeight)
          } else {
            ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x, y, drawCanvasWidth, drawCanvasHeight)
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(canvasT, 0, 0)
        }

        ctxT.restore()
        ctxMaxSize.restore()
      })
    }
    this.handlerId = handlerId
    if (timeout) {
      this._draw = setTimeout(handler, timeout)
    } else {
      await handler()
      this.spreadBuff.spread = -1
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

  isTransparentBg(canvas: HTMLCanvasElement): boolean {
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
      const { shadow } = layer.styles
      const { effects } = shadow
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        shadow: {
          currentEffect: effect,
          effects: {
            ...effects,
            ...attrs
          }
        }
      }, subLayerIdx)
    }
  }

  /** Only used for blur and projection effects */
  convertShadowEffect(config: IImage): { [key: string]: string | number } {
    const { shadow, scale } = config.styles
    const { color = '#000000' } = shadow.effects
    const effect = shadow.currentEffect !== ShadowEffectType.none
      ? shadow.effects[shadow.currentEffect] : {}

    switch (shadow.currentEffect) {
      case ShadowEffectType.halo: {
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
      case ShadowEffectType.projection: {
        const { radius, spread, opacity, x, y, size } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity', 'size']) as ShadowEffects
        return {
          width: `${size}%`,
          left: `${x * fieldRange.projection.x.weighting + (100 - size) / 2}%`,
          bottom: `${-y * fieldRange.projection.y.weighting}%`,
          zIndex: -1,
          boxShadow:
          `0px ${HALO_Y_OFFSET * scale}px ` +
          `${(radius + 30) * fieldRange.projection.radius.weighting}px ` +
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
    while (!reach) {
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
    while (!reach) {
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
    while (!reach) {
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
    while (!reach) {
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
          distance: 0,
          angle: 0,
          radius: 9,
          spread: 3,
          opacity: 70
        }
        break
      case ShadowEffectType.projection: {
        (effect as IProjectionEffect) = {
          x: 0,
          y: 0,
          radius: 57,
          spread: 23,
          size: 79,
          opacity: 100
        }
        break
      }
      case ShadowEffectType.blur:
        (effect as IBlurEffect) = {
          radius: 10,
          spread: 5,
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
      case ShadowEffectType.halo:
        (effect as IHaloEffect) = {
          distance: 9,
          angle: 30,
          radius: 14,
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

  updateEffectState(layerInfo: ILayerInfo, currEffect: string) {
    store.commit('UPDATE_shadowEffectState', {
      layerInfo,
      payload: { currEffect }
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
  halo: {
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
  projection: {
    x: 'NN0425',
    y: 'NN0424',
    radius: 'NN0426',
    spread: 'NN0421',
    opacity: 'NN0427',
    size: 'NN0422',
    _effectName: 'NN0420'
  }
}

export const fieldRange = {
  shadow: {
    distance: { max: 50, min: 0, weighting: 1 },
    angle: { max: 180, min: -180, weighting: 1 },
    radius: { max: 100, min: 0, weighting: 1 },
    opacity: { max: 100, min: 0, weighting: 1 },
    spread: { max: 30, min: 0, weighting: 1 }
  },
  blur: {
    radius: { max: 100, min: 0, weighting: 2 },
    spread: { max: 30, min: 5, weighting: 0.72 },
    opacity: { max: 100, min: 0, weighting: 0.01 }
  },
  halo: {
    distance: { max: 100, min: 0, weighting: 2 },
    angle: { max: 180, min: -180, weighting: 2 },
    size: { max: 200, min: 50, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 2 },
    opacity: { max: 100, min: 0, weighting: 0.01 }
  },
  frame: {
    spread: { max: 30, min: 0, weighting: 0.72 },
    opacity: { max: 100, min: 0, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 2 }
  },
  projection: {
    spread: { max: 100, min: 0, weighting: 0.5 },
    opacity: { max: 100, min: 0, weighting: 0.01 },
    radius: { max: 100, min: 0, weighting: 1.2 },
    size: { max: 200, min: 50 },
    x: { max: 100, min: -100, weighting: 0.5 },
    y: { max: 100, min: -100, weighting: 0.5 }
  }
} as any

export default new ImageShadowUtils()
