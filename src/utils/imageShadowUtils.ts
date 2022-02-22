import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import store from '@/store'
import mathUtils from './mathUtils'
import { IBlurEffect, IFrameEffect, IHaloEffect, IProjectionEffect, IShadowEffect, IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import imageUtils from './imageUtils'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IHaloEffect | IProjectionEffect
type Filter = {
  tag: string,
  attrs: {
    [key: string]: string | number
  },
  child?: Array<Filter>
}

const SVG = 'http://www.w3.org/2000/svg'
const FilterTable = {
  opacity: {
    tag: 'feComponentTransfer',
    child: {
      tag: 'feFuncA',
      prop: 'slope',
      weighting: 0.01
    }
  },
  spread: {
    tag: 'feMorphology',
    prop: 'radius'
  },
  radius: {
    tag: 'feGaussianBlur',
    prop: 'stdDeviation'
  },
  x: {
    tag: 'feOffset',
    prop: 'dx'
  },
  y: {
    tag: 'feOffset',
    prop: 'dy'
  },
  color: {
    tag: 'feFlood',
    prop: 'flood-color'
  }
} as any

const HALO_Y_OFFSET = 70 as const
export const HALO_SPREAD_LIMIT = 80 as const
class ImageShadowUtils {
  setEffect (effect: ShadowEffectType, attrs = {}): void {
    const { pageIndex, layerIndex, subLayerIdx, getCurrConfig: currLayer } = layerUtils
    if (subLayerIdx === -1 && currLayer.type === LayerType.group) {
      for (const i in (currLayer as IGroup).layers) {
        // const shadow = generalUtils.deepCopy((currLayer as IGroup).layers[+i]) as IShadowProps
        // Object.assign()
        // layerUtils.updateLayerStyles
      }
    } else {
      const { shadow } = (currLayer as IImage).styles
      const { effects, filterId } = shadow
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        shadow: {
          currentEffect: effect,
          filterId,
          effects: {
            ...effects,
            ...attrs
          }
        }
      }, subLayerIdx)
    }
  }

  addFilter(filterId: string, filters: Array<Filter>) {
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('viewBox', '0 0 5000 5000')
    this.append(svg, [{
      tag: 'filter',
      attrs: {
        id: `${filterId}`,
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
    return svg.firstChild
  }

  append(parent: HTMLElement | SVGElement, filters: Array<Filter>) {
    filters
      .forEach(f => {
        const filter = document.createElementNS(SVG, f.tag)
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
    for (let i = 0; i < 8; i++) {
      const rand = Math.floor(Math.random() * charLength)
      id += chars[rand]
    }
    return id
  }

  /** Only used for blur and projection effects */
  convertShadowEffect(config: IImage): { [key: string]: string | number } {
    const { shadow, scale } = config.styles
    const { color = '#000000' } = shadow.effects
    const effect = shadow.currentEffect !== ShadowEffectType.none
      ? shadow.effects[shadow.currentEffect] : {}

    switch (shadow.currentEffect) {
      case ShadowEffectType.halo: {
        const { imgWidth, imgHeight } = config.styles
        const { blur, y, width } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity', 'width']) as ShadowEffects
        const imgRatio = imgHeight / imgWidth
        return {
          backgroundImage: `url(${imageUtils.getSrc(config)})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          zIndex: -1,
          width: `${width}%`,
          height: '100%',
          bottom: `${-(imgRatio > 1 ? y / 2 : y) - 5}%`,
          filter: `blur(${blur}px)`
        }
      }
      case ShadowEffectType.projection: {
        const { radius, spread, opacity, y, width } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity', 'width']) as ShadowEffects
        return {
          width: `${width}%`,
          bottom: `${-y - 10}px`,
          boxShadow:
          `0px ${HALO_Y_OFFSET * scale}px ` +
          `${radius}px ` +
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

  handleShadowStyles(config: IImage, styles: unknown, imgControl: boolean) {
    const { filterId, currentEffect } = config.styles.shadow
    switch (currentEffect) {
      case ShadowEffectType.shadow:
      case ShadowEffectType.blur:
      case ShadowEffectType.frame:
        Object.assign(
          styles,
          { ...((!imgControl && filterId) && { filter: `url(#${filterId})` }) }
        )
        break
      case ShadowEffectType.none:
      case ShadowEffectType.halo:
      case ShadowEffectType.projection:
        break
      default:
        return generalUtils.assertUnreachable(currentEffect)
    }
  }

  convertToAlpha(percent: number): string {
    return Math.floor(percent / 100 * 255).toString(16).toUpperCase()
  }

  getDefaultEffect(effectName: ShadowEffectType): Partial<IShadowEffects> {
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
      case ShadowEffectType.projection: {
        (effect as IProjectionEffect) = {
          radius: 50,
          spread: 50,
          opacity: 70,
          width: 80,
          y: 0
        }
        break
      }
      case ShadowEffectType.blur:
        (effect as IBlurEffect) = {
          radius: 50,
          spread: 0,
          opacity: 70
        }
        break
      case ShadowEffectType.frame:
        (effect as IFrameEffect) = {
          spread: 12,
          radius: 0,
          opacity: 70
        }
        break
      case ShadowEffectType.halo:
        (effect as IHaloEffect) = {
          width: 95,
          blur: 15,
          y: 0
        }
        break
      case ShadowEffectType.none:
        return {}
      default:
        return generalUtils.assertUnreachable(effectName)
    }
    const { subLayerIdx, getCurrLayer: currLayer } = layerUtils
    const color = currLayer.type === LayerType.image
      ? (currLayer as IImage).styles.shadow.effects.color : '#000000'
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

  updateFilter(filter: HTMLElement, sytles: IImageStyle) {
    const { shadow, scale } = sytles
    const { effects, currentEffect } = shadow
    if (currentEffect === ShadowEffectType.none) return

    const allProps = this.getDefaultEffect(ShadowEffectType.shadow).shadow
    const effect = effects[currentEffect]
    switch (currentEffect) {
      case ShadowEffectType.shadow:
      case ShadowEffectType.frame:
      case ShadowEffectType.blur: {
        Object.keys(allProps as IShadowEffect)
          .forEach(k => {
            if (effect && k in effect) {
              this.setAttrs(filter, { ...FilterTable[k], scale, k, v: effect[k] })
            } else {
              this.setAttrs(filter, { ...FilterTable[k], k, v: 0 })
            }
          })
        /** setting color */
        const subFilter = filter.getElementsByTagNameNS(SVG, FilterTable.color.tag)[0]
        subFilter.setAttribute(FilterTable.color.prop, effects.color)
      }
    }
  }

  setAttrs(filter: SVGElement | HTMLElement, data: any) {
    const { prop, weighting, child, tag, scale, k, v } = data
    const subFilter = filter.getElementsByTagNameNS(SVG, tag)[0]
    if (child) {
      this.setAttrs(subFilter, { ...child, scale, k, v })
    } else {
      let val = weighting ? v * weighting : v

      switch (k) {
        case 'spread':
          val *= scale
          val = val > 72 ? 72 : val
          subFilter.setAttribute('operator', val < 0 ? 'erode' : 'dilate')
          subFilter.setAttribute(prop as string, Math.abs(val).toString())
          break
        default:
          subFilter.setAttribute(prop as string, val.toString())
      }
    }
  }

  getDefaultFilterAttrs(): Array<Filter> {
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
        tag: 'feComponentTransfer',
        attrs: {
          in: 'color',
          result: 'opacity'
        },
        child: [
          {
            tag: 'feFuncA',
            attrs: {
              type: 'linear',
              intercept: '0',
              slope: '1'
            }
          }
        ]
      },
      {
        tag: 'feMorphology',
        attrs: {
          operator: 'dilate',
          radius: 10,
          result: 'spread',
          in: 'opacity'
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
          in: 'shadow',
          result: 'offset',
          dx: 20,
          dy: 20
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
}

export default new ImageShadowUtils()
