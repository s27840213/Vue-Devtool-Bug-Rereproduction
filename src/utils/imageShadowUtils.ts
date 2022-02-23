import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
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
        const { blur, x, y, width, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity', 'width']) as ShadowEffects
        return {
          backgroundImage: `url(${imageUtils.getSrc(config)})`,
          backgroundColor: `rgba(255, 255, 255, ${1 - opacity / 100})`,
          backgroundBlendMode: 'overlay',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          zIndex: -1,
          width: `${width}%`,
          height: '100%',
          bottom: `${-y}%`,
          left: `${x - (width - 100) / 2}%`,
          filter: `blur(${blur}px)`
        }
      }
      case ShadowEffectType.projection: {
        const { radius, spread, opacity, x, y, width, zIndex } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity', 'width']) as ShadowEffects
        const { height: layerHeight, width: layerWidth } = config.styles
        return {
          width: `${width}%`,
          left: `${x * fieldRange.projection.x.weighting * layerWidth + (1 - width / 100) / 2 * layerWidth}px`,
          bottom: `${-y * fieldRange.projection.y.weighting * layerHeight}px`,
          zIndex,
          boxShadow:
          `0px ${HALO_Y_OFFSET * scale}px ` +
          `${radius * fieldRange.projection.radius.weighting}px ` +
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
          x: 0,
          y: 0,
          radius: 50,
          spread: 50,
          width: 80,
          opacity: 70,
          zIndex: -1
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
          radius: 0,
          spread: 12,
          opacity: 70
        }
        break
      case ShadowEffectType.halo:
        (effect as IHaloEffect) = {
          x: 0,
          y: 5,
          blur: 15,
          width: 100,
          opacity: 70
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
              this.setAttrs(filter, { ...FilterTable[k], currentEffect, scale, k, v: effect[k] })
            } else {
              this.setAttrs(filter, { ...FilterTable[k], currentEffect, k, v: 0 })
            }
          })
        /** setting color */
        const subFilter = filter.getElementsByTagNameNS(SVG, FilterTable.color.tag)[0]
        subFilter.setAttribute(FilterTable.color.prop, effects.color)
      }
    }
  }

  setAttrs(filter: SVGElement | HTMLElement, data: any) {
    const { prop, child, tag, scale, currentEffect, k, v } = data
    const subFilter = filter.getElementsByTagNameNS(SVG, tag)[0]
    if (child) {
      this.setAttrs(subFilter, { ...child, currentEffect, scale, k, v })
    } else {
      let val = v
      if (fieldRange[currentEffect][k] && fieldRange[currentEffect][k].weighting) {
        val *= fieldRange[currentEffect][k].weighting
      }

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

export const shadowPropI18nMap = {
  none: {
    _effectName: 'NN0426'
  },
  shadow: {
    x: 'NN0416',
    y: 'NN0417',
    radius: 'NN0418',
    spread: 'NN0419',
    opacity: 'NN0425',
    _effectName: 'NN0411'
  },
  blur: {
    radius: 'NN0418',
    spread: 'NN0419',
    opacity: 'NN0425',
    _effectName: 'NN0412'
  },
  halo: {
    x: 'NN0416',
    y: 'NN0417',
    width: 'NN0420',
    blur: 'NN0418',
    opacity: 'NN0425',
    _effectName: 'NN0413'
  },
  frame: {
    radius: 'NN0418',
    spread: 'NN0421',
    opacity: 'NN0425',
    _effectName: 'NN0414'
  },
  projection: {
    x: 'NN0423',
    y: 'NN0422',
    radius: 'NN0418',
    spread: 'NN0419',
    opacity: 'NN0425',
    width: 'NN0420',
    zIndex: 'NN0424',
    _effectName: 'NN0415'
  }
}

export const fieldRange = {
  shadow: {
    x: { max: 180, min: -180 },
    y: { max: 180, min: -180 },
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
    width: { max: 200, min: 50, weighting: 0.01 },
    blur: { max: 100, min: 0, weighting: 2 },
    x: { max: 100, min: -100, weighting: 0.5 },
    y: { max: 100, min: -100, weighting: 0.5 },
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
    radius: { max: 100, min: 0, weighting: 1.5 },
    width: { max: 200, min: 50 },
    x: { max: 100, min: -100, weighting: 0.005 },
    y: { max: 100, min: -100, weighting: 0.005 },
    zIndex: { max: 0, min: -1 }
  }
} as any

export default new ImageShadowUtils()
