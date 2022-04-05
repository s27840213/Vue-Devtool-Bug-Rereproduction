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
export const CANVAS_SIZE = 500
class ImageShadowUtils {
  private canvasT = document.createElement('canvas')
  private ctxT = null as CanvasRenderingContext2D | null
  private _draw = undefined as number | undefined
  // @TODO
  private _drawing = false
  private _layerData = null as {
    img: HTMLImageElement,
    config: IImage
  } | null

  get layerData() { return this._layerData }

  constructor() {
    this.ctxT = this.canvasT.getContext('2d') as CanvasRenderingContext2D
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

  readonly SPREAD_RADIUS = 1
  handlerId = ''
  async draw(canvas: HTMLCanvasElement, img: HTMLImageElement, config: IImage, canvasSize = CANVAS_SIZE, timeout = 75) {
    const { styles } = config
    const { width: layerWidth, height: layerHeight, imgWidth: _imgWidth, imgHeight: _imgHeight, shadow, imgX: _imgX, imgY: _imgY } = styles
    const { effects, currentEffect } = shadow
    const { distance, angle, radius, spread, opacity } = (effects as any)[currentEffect] as IShadowEffect | IBlurEffect | IFrameEffect
    if (!canvas || (currentEffect === ShadowEffectType.none || currentEffect === ShadowEffectType.halo ||
      currentEffect === ShadowEffectType.projection)) return
    if (this._draw) {
      clearTimeout(this._draw)
    }
    if (!this._layerData) {
      this._layerData = { img: img, config }
    }

    let offsetX = 0
    let offsetY = 0
    if (distance && distance > 0) {
      offsetX = distance * mathUtils.cos(angle)
      offsetY = distance * mathUtils.sin(angle)
    }

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const scaleRatio = img.naturalWidth / _imgWidth
    const imgRatio = _imgWidth / _imgHeight
    const imgX = _imgX * scaleRatio
    const imgY = _imgY * scaleRatio
    const drawImgWidth = layerWidth / _imgWidth * img.naturalWidth
    const drawImgHeight = layerHeight / _imgHeight * img.naturalHeight
    const drawCanvasHeight = canvasSize
    const drawCanvasWidth = drawCanvasHeight * imgRatio
    const x = (canvas.width - canvasSize * imgRatio) / 2
    const y = (canvas.height - canvasSize) / 2
    this.canvasT.setAttribute('width', `${canvas.width}`)
    this.canvasT.setAttribute('height', `${canvas.height}`)

    const _spread = 1 / this.SPREAD_RADIUS
    const handlerId = generalUtils.generateRandomString(6)
    const handler = async () => {
      if (!this.ctxT) return
      this.ctxT.clearRect(0, 0, this.canvasT.width, this.canvasT.height)

      let alphaVal = 1

      for (let i = -spread; i <= spread && this.handlerId === handlerId; i++) {
        await new Promise<void>(resolve => {
          setTimeout(() => {
            for (let j = -spread; j <= spread && this.handlerId === handlerId; j++) {
              const r = Math.sqrt(i * i + j * j)
              if (r >= spread + this.SPREAD_RADIUS) {
                alphaVal = 0
              } else if (r >= spread) {
                alphaVal = (1 - (r - spread) * _spread)
              } else {
                alphaVal = 1
              }
              if (alphaVal && this.ctxT) {
                this.ctxT.globalAlpha = alphaVal
                this.ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x + offsetX + i, y + offsetY + j, drawCanvasWidth, drawCanvasHeight)
              }
            }
            console.log('i:', i)
            resolve()
          }, 0)
        })
      }
      if (this.handlerId === handlerId) {
        console.log('for loop done')
        this.ctxT.globalCompositeOperation = 'source-in'
        const imageData = this.ctxT.getImageData(0, 0, this.canvasT.width, this.canvasT.height)
        StackBlur.imageDataRGBA(imageData, 0, 0, this.canvasT.width, this.canvasT.height, radius + 1)
        this.ctxT.putImageData(imageData, 0, 0)

        this.ctxT.globalAlpha = opacity / 100
        this.ctxT.fillStyle = effects.color
        this.ctxT.fillRect(0, 0, canvas.width, canvas.height)

        this.ctxT.globalCompositeOperation = 'source-over'
        this.ctxT.globalAlpha = 1
        this.ctxT.drawImage(img, -imgX, -imgY, drawImgWidth, drawImgHeight, x, y, drawCanvasWidth, drawCanvasHeight)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(this.canvasT, 0, 0)
      }
    }
    this.handlerId = handlerId
    timeout ? (this._draw = setTimeout(handler, timeout)) : await handler()
    console.log('already drawed')
  }

  clearLayerData() {
    this._layerData = null
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
        if (!imageData[top]) {
          console.log(top)
          console.log(canvas.height)
        }
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
    radius: { max: 60, min: 0, weighting: 1 },
    opacity: { max: 100, min: 0, weighting: 1 },
    spread: { max: 30, min: 0, weighting: 1 }
  },
  blur: {
    radius: { max: 60, min: 0, weighting: 2 },
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
    radius: { max: 60, min: 0, weighting: 2 }
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
