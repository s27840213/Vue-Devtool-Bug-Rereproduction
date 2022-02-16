import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import store from '@/store'
import mathUtils from './mathUtils'
import { IBlurEffect, IFrameEffect, IHaloEffect, IProjectionEffect, IShadowEffect, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import imageUtils from './imageUtils'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IHaloEffect | IProjectionEffect
type Filter = {
  tag: string,
  attrs: {
    [key: string]: string | number
  },
  child?: Array<Filter>
}

const HALO_Y_OFFSET = 70 as const
export const HALO_SPREAD_LIMIT = 80 as const
class ImageShadowUtils {
  async setEffect (effect: ShadowEffectType, attrs = {}): Promise<void> {
    const { pageIndex, layerIndex, subLayerIdx, getCurrConfig: currLayer } = layerUtils
    if (subLayerIdx === -1 && currLayer.type === LayerType.group) {
      for (const i in (currLayer as IGroup).layers) {
        // const shadow = generalUtils.deepCopy((currLayer as IGroup).layers[+i]) as IShadowProps
        // Object.assign()
        // layerUtils.updateLayerStyles
      }
    } else {
      // const { shadow } = (currLayer as IImage).styles
      // let isTransparentBG
      // if (!('isTransparentBG' in shadow)) {
      //   // isTransparentBG = await this.isTransparentBG(currLayer as IImage)
      //   isTransparentBG = true
      // } else {
      //   isTransparentBG = shadow.isTransparentBG
      // }
      // layerUtils.updateLayerStyles(pageIndex, layerIndex, {
      //   shadow: {
      //     ...(shadow && (shadow as IShadowProps)),
      //     ...attrs,
      //     isTransparentBG,
      //     currentEffect: effect
      //   }
      // }, subLayerIdx)
      const filters = this.getFilterAttrs()
      this.addFilter(filters)
    }
    console.log(generalUtils.deepCopy(currLayer.styles.shadow))
  }

  isTransparentBG(config: IImage): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const { width: imgWidth, height: imgHeight } = img
        const canvas = (document.createElement('canvas') as HTMLCanvasElement)
        const c = canvas.getContext('2d')
        canvas.width = imgWidth
        canvas.height = imgHeight
        if (c) {
          c.drawImage(img, 0, 0)
          const imgData = c.getImageData(0, 0, imgWidth, imgHeight).data
          for (let i = 3; i < imgData.length; i += 4) {
            if (imgData[i] < 255) {
              resolve(true)
            }
          }
          resolve(false)
        }
        resolve(false)
      }
      img.onerror = () => reject(new Error('cannot load image'))
      img.src = imageUtils.getSrc(config) + '?' + new Date().getTime()
    })
  }

  addFilter(filters: Array<Filter>): string {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const id = 'test-filter' || this.fitlerIdGenerator()
    svg.setAttribute('viewBox', '0 0 5000 5000')
    this.append(svg, [{
      tag: 'filter',
      attrs: {
        id: `${id}`,
        x: '-100%',
        y: '-100%',
        width: '300%',
        height: '300%',
        filterUnits: 'userSpaceOnUse',
        'color-interpolation-filters': 'sRGB'
      },
      child: filters
    }])
    document.body.appendChild(svg)
    return id
  }

  getFilterAttrs(): Array<Filter> {
    return [
      {
        tag: 'feFlood',
        attrs: {
          result: 'flood',
          'flood-opacity': '1',
          'flood-color': 'yellow'
        }
      },
      {
        tag: 'feComposite',
        attrs: {
          in: 'flood',
          in2: 'SourceAlpha',
          operator: 'atop',
          result: 'color'
        }
      },
      {
        tag: 'feMorphology',
        attrs: {
          operator: 'dilate',
          radius: 10,
          result: 'spread',
          in: 'color'
        }
      },
      {
        tag: 'feGaussianBlur',
        attrs: {
          stdDeviation: 5,
          in: 'spread',
          result: 'shadow'
        }
      },
      {
        tag: 'feOffset',
        attrs: {
          dx: 20,
          dy: 20,
          in: 'shadow',
          result: 'offset'
        }
      },
      {
        tag: 'feMerge',
        attrs: {
          result: 'merge'
        },
        child: [
          {
            tag: 'feMergeNode',
            attrs: {
              in: 'offset'
            }
          },
          {
            tag: 'feMergeNode',
            attrs: {
              in: 'SourceGraphic'
            }
          }
        ]
      }
    ]
  }

  append(parent: HTMLElement | SVGElement, filters: Array<Filter>) {
    filters
      .forEach(f => {
        const filter = document.createElementNS('http://www.w3.org/2000/svg', f.tag)
        Object.entries(f.attrs)
          .forEach(([k, v]) => {
            filter.setAttribute(k, v.toString())
          })
        if (f.child && f.child.length) {
          this.append(filter, f.child)
        }
        parent.appendChild(filter)
      })
  }

  fitlerIdGenerator(): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const charLength = chars.length
    let id = 'f'
    for (let i = 0; i < 7; i++) {
      const rand = Math.floor(Math.random() * charLength)
      id += chars[rand]
    }
    return id
  }

  convertShadowEffect(styles: IImageStyle): { [key: string]: string } {
    const { shadow, scale } = styles
    const { color = '#000000', isTransparentBG } = shadow
    const effect = shadow[shadow.currentEffect]

    switch (shadow.currentEffect) {
      case ShadowEffectType.blur:
      case ShadowEffectType.shadow: {
        const { x = 0, y = 0, radius, spread, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity']) as ShadowEffects
        return isTransparentBG ? {
          filter:
            'drop-shadow(' +
              `${x}px ${y}px ` +
              `${radius}px ` +
              `${color + this.convertToAlpha(opacity)})`
        } : {
          boxShadow:
            `${x}px ${y}px ` +
            `${radius}px ` +
            `${spread}px ` +
            `${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.frame: {
        const { width, blur, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity']) as ShadowEffects
        return isTransparentBG ? {
          filter:
            `drop-shadow(${width}px 0 0 ${color + this.convertToAlpha(opacity)})` +
            `drop-shadow(0 ${-width}px 0 ${color + this.convertToAlpha(opacity)})` +
            `drop-shadow(0 ${width}px 0 ${color + this.convertToAlpha(opacity)})` +
            `drop-shadow(${-width}px 0 0 ${color + this.convertToAlpha(opacity)})`
            // `drop-shadow(${width}px ${width}px 0 ${color + this.convertToAlpha(opacity)})` +
            // `drop-shadow(${width}px ${-width}px 0 ${color + this.convertToAlpha(opacity)})` +
            // `drop-shadow(${-width}px ${width}px 0 ${color + this.convertToAlpha(opacity)})` +
            // `drop-shadow(${-width}px ${-width}px 0 ${color + this.convertToAlpha(opacity)})`
        } : {
          boxShadow: `0 0 ${blur}px ${width}px ${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.halo: {
        const { radius, spread, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity']) as ShadowEffects
        return {
          boxShadow:
          `0px ${HALO_Y_OFFSET * scale}px ` +
          `${radius}px ` +
          `${spread - HALO_SPREAD_LIMIT * scale}px ` +
          `${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.projection:
      case ShadowEffectType.none:
        return {}
      default:
        return this.assertUnreachable(shadow.currentEffect)
    }
  }

  convertToAlpha(percent: number): string {
    return Math.floor(percent / 100 * 255).toString(16).toUpperCase()
  }

  getDefaultEffect(effectName: ShadowEffectType): Partial<IShadowProps> {
    let effect = {} as unknown
    switch (effectName) {
      case ShadowEffectType.shadow:
        (effect as IShadowEffect) = {
          x: 40,
          y: 40,
          radius: 18,
          spread: 0,
          opacity: 70
        }
        break
      case ShadowEffectType.projection:
      case ShadowEffectType.blur:
        (effect as IBlurEffect) = {
          radius: 50,
          spread: 0,
          opacity: 70
        }
        break
      case ShadowEffectType.frame:
        (effect as IFrameEffect) = {
          width: 50,
          blur: 10,
          opacity: 70
        }
        break
      case ShadowEffectType.halo:
        (effect as IHaloEffect) = {
          radius: 50,
          spread: 50,
          opacity: 70
        }
        break
      case ShadowEffectType.none:
        return {}
      default:
        return this.assertUnreachable(effectName)
    }
    return {
      [effectName]: effect,
      ...((() => {
        const { type } = layerUtils.getCurrConfig
        const { color } = (layerUtils.getCurrConfig as IImage).styles.shadow
        return type === LayerType.image && !color
      })() && { color: '#000000' })
    } as Partial<IShadowProps>
  }

  getKeysOf(effect: ShadowEffectType): Array<string> {
    return [
      ...Object.keys(
        this.getDefaultEffect(effect)[effect] as ShadowEffects)
    ]
  }

  assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here")
  }
}

export default new ImageShadowUtils()
