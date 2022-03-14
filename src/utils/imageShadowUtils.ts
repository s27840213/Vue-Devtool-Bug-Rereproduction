import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import mathUtils from './mathUtils'
import { IBlurEffect, IFrameEffect, IHaloEffect, IProjectionEffect, IShadowEffect, IShadowEffects, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import imageUtils from './imageUtils'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IHaloEffect | IProjectionEffect
type FilterNode = {
  tag: string,
  attrs: {
    [key: string]: string | number
  },
  child?: Array<FilterNode>
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
    if (subLayerIdx !== -1 || currLayer.type === LayerType.image) {
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

  addFilter(filterId: string, filters: Array<FilterNode>) {
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

  append(parent: HTMLElement | SVGElement, filters: Array<FilterNode>) {
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
          distance: 15,
          angle: 45,
          radius: 9,
          spread: 3,
          opacity: 55
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
          radius: 9,
          spread: 0,
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

  updateFilter(filter: HTMLElement, sytles: IImageStyle) {
    const { shadow, scale } = sytles
    const { effects, currentEffect } = shadow
    if (currentEffect === ShadowEffectType.none) return

    const currEffect = effects[currentEffect]
    const update = (props: Array<string>, effect: ShadowEffects) => {
      props
        .forEach(k => {
          if (effect && k in effect) {
            const weighting = fieldRange[currentEffect][k].weighting
            if (['distance', 'angle'].includes(k)) {
              const { distance, angle } = effect
              const x = distance * mathUtils.cos(angle)
              const y = distance * mathUtils.sin(angle)
              this.setAttrs(filter, { ...FilterTable.x, currentEffect, scale, weighting, k: 'x', v: x })
              this.setAttrs(filter, { ...FilterTable.y, currentEffect, scale, weighting, k: 'y', v: y })
            } else {
              this.setAttrs(filter, { ...FilterTable[k], currentEffect, scale, weighting, k, v: effect[k] })
            }
          } else {
            this.setAttrs(filter, { ...FilterTable[k], currentEffect, k, v: 0 })
          }
        })
      /** setting color */
      const subFilter = filter.getElementsByTagNameNS(SVG, FilterTable.color.tag)[0]
      subFilter.setAttribute(FilterTable.color.prop, effects.color)
    }

    switch (currentEffect) {
      case ShadowEffectType.shadow:
        update(Object.keys(this.getDefaultEffect(ShadowEffectType.shadow).shadow || {}), mathUtils
          .multipy(scale, currEffect as IShadowEffect, ['opacity', 'size', 'angle']) as ShadowEffects)
        break
      case ShadowEffectType.frame:
        update(Object.keys(this.getDefaultEffect(ShadowEffectType.frame).frame || {})
          .concat(...['x', 'y']),
          mathUtils
            .multipy(scale, currEffect as IFrameEffect, ['opacity']) as ShadowEffects)
        break
      case ShadowEffectType.blur:
        update(Object.keys(this.getDefaultEffect(ShadowEffectType.blur).blur || {})
          .concat(...['x', 'y']),
          mathUtils
            .multipy(scale, currEffect as IBlurEffect, ['opacity']) as ShadowEffects)
    }
  }

  setAttrs(filter: SVGElement | HTMLElement, data: any) {
    const { prop, child, tag, currentEffect, scale, weighting, k, v } = data
    const subFilter = filter.getElementsByTagNameNS(SVG, tag)[0]
    let val = v * (weighting || 1)
    if (child) {
      this.setAttrs(subFilter, { ...child, currentEffect, weighting, scale, k, v })
    } else {
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

  getDefaultFilterAttrs(): Array<FilterNode> {
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
    distance: { max: 100, min: 0, weighting: 2 },
    angle: { max: 180, min: -180, weighting: 2 },
    radius: { max: 100, min: 0, weighting: 2 },
    opacity: { max: 100, min: 0, weighting: 0.01 },
    spread: { max: 100, min: 0, weighting: 0.72 }
  },
  blur: {
    radius: { max: 100, min: 0, weighting: 2 },
    spread: { max: 100, min: 0, weighting: 0.72 },
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
    spread: { max: 100, min: 0, weighting: 0.72 },
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
