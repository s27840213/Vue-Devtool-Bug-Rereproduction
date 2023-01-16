import store from '@/store'
import {
  ISvgFilterTag,
  IAdjustJsonProps,
  IAdjustProps
} from '@/interfaces/adjust'
import i18n from '@/i18n'
import { IImage } from '@/interfaces/layer'
import imageShadowUtils from './imageShadowUtils'

class ImageAdjustUtil {
  getFields() {
    return [
      {
        name: 'brightness',
        label: `${i18n.t('NN0055')}`,
        max: 100,
        min: -100
      },
      {
        name: 'contrast',
        label: `${i18n.t('NN0056')}`,
        max: 100,
        min: -100
      },
      {
        name: 'saturate',
        label: `${i18n.t('NN0057')}`,
        max: 100,
        min: -100
      },
      {
        name: 'hue',
        label: `${i18n.t('NN0058')}`,
        max: 100,
        min: -100
      },
      {
        name: 'blur',
        label: `${i18n.t('NN0059')}`,
        max: 100,
        min: -100
      },
      {
        name: 'halation',
        label: `${i18n.t('NN0060')}`,
        max: 100,
        min: 0
      },
      {
        name: 'warm',
        label: `${i18n.t('NN0061')}`,
        max: 100,
        min: -100
      }
    ]
  }

  getDefaultProps() {
    return this.getFields().reduce((prev, curr) => {
      prev[curr.name] = 0
      return prev
    }, {} as { [key: string]: number })
  }

  createSvgFilter (element: ISvgFilterTag) {
    const { tag, attrs = {}, child = [] } = element
    return {
      tag,
      attrs,
      child
    }
  }

  getBrightness (value: number) {
    const intercept = 0.005 * value
    return [
      this.createSvgFilter({
        tag: 'feComponentTransfer',
        child: ['feFuncR', 'feFuncG', 'feFuncB'].map(tag =>
          this.createSvgFilter({
            tag,
            attrs: { type: 'linear', slope: 1, intercept }
          }))
      })
    ]
  }

  getContrast (value: number) {
    const slopeMax = value > 0 ? 1.5 : 0.6
    const interceptMax = value > 0 ? 0.75 : 0.3
    const slope = 1 + (value * slopeMax / 100)
    const intercept = 0 - (value * interceptMax / 100)
    return [
      this.createSvgFilter({
        tag: 'feComponentTransfer',
        child: ['feFuncR', 'feFuncG', 'feFuncB'].map(tag =>
          this.createSvgFilter({
            tag,
            attrs: { type: 'linear', slope, intercept }
          }))
      })
    ]
  }

  getSaturate (value: number) {
    const values = (value + 100) / 100
    return [
      this.createSvgFilter({
        tag: 'feColorMatrix',
        attrs: { type: 'saturate', values }
      })
    ]
  }

  getHue (value: number) {
    const r = value > 0 ? 0.1 * Math.max(value - 66, 0) / 33 : Math.min(Math.abs(value / 33), 1) * 0.1
    const g = Math.abs(value) > 33 ? 0.1 * (1 - Math.min(Math.abs(value / 33) - 1, 1)) : 0.1
    const b = value > 0 ? Math.min((value / 33), 1) * 0.1 : 0.1 * Math.max(Math.abs(value) - 66, 0) / 33
    const intercepts = [r, g, b]
    return [
      this.createSvgFilter({
        tag: 'feComponentTransfer',
        child: ['feFuncR', 'feFuncG', 'feFuncB'].map((tag, idx) =>
          this.createSvgFilter({
            tag,
            attrs: { type: 'linear', slope: 0.9, intercept: intercepts[idx] }
          }))
      })
    ]
  }

  getBlur (value: number, config?: IImage) {
    if (value < 0) {
      return [
        this.createSvgFilter({
          tag: 'feComponentTransfer',
          attrs: { result: 'preblur' }
        }),
        this.createSvgFilter({
          tag: 'feGaussianBlur',
          attrs: { stdDeviation: 1.2 }
        }),
        this.createSvgFilter({
          tag: 'feComposite',
          attrs: {
            operator: 'arithmetic',
            k1: 0,
            k4: 0,
            in2: 'preblur',
            k2: value * 0.06,
            k3: Math.abs(value * 0.06) + 1
          }
        })
      ]
    }
    const res = [
      this.createSvgFilter({
        tag: 'feGaussianBlur',
        attrs: { stdDeviation: 0.275 * value }
      })
    ]
    if (config && config.styles.shadow && !config.styles.shadow.isTransparent) {
      res.push(this.createSvgFilter({
        tag: 'feComponentTransfer',
        child: [
          this.createSvgFilter({
            tag: 'feFuncA',
            attrs: { type: 'linear', slope: 0, intercept: 1 }
          })
        ]
      }))
    }
    return res
  }

  getWarm (value: number) {
    const rgbaOut = [
      `1 0 0 0 ${value / 1000}`,
      '0 1 0 0 0',
      `0 0 1 0 ${value / -1000}`,
      '0 0 0 1 0'
    ]
    return [
      this.createSvgFilter({
        tag: 'feColorMatrix',
        attrs: {
          type: 'matrix',
          values: rgbaOut.join(' ')
        }
      })
    ]
  }

  getHalation (value: number, position: { [key: string]: any }) {
    const { width, x, y } = position
    const opacity = value * 0.7 / 100
    const style = {
      background: `radial-gradient(${width}px at ${x}px ${y}px, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, ${opacity}) 130%)`,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }
    return [{
      tag: 'div',
      attrs: { style }
    }]
  }

  getSvgFilter (name: string, value: number, config?: IImage): any {
    if (value === 0) return []
    // @TODO: handle more filter func
    switch (name) {
      case 'brightness':
        return this.getBrightness(value)
      case 'contrast':
        return this.getContrast(value)
      case 'saturate':
        return this.getSaturate(value)
      case 'hue':
        return this.getHue(value)
      case 'blur':
        return this.getBlur(value, config)
      case 'warm':
        return this.getWarm(value)
      default:
        return []
    }
  }

  convertAdjustToSvgFilter (adjust: IAdjustJsonProps, config?: IImage) {
    return Object.entries(adjust)
      .flatMap(([key, val]) => this.getSvgFilter(key, val, config))
  }

  setAdjust (props: IAdjustProps) {
    const { adjust, pageIndex, layerIndex, subLayerIndex } = props
    store.commit('UPDATE_specLayerData', {
      pageIndex,
      layerIndex,
      subLayerIndex,
      styles: { adjust },
      type: ['image']
    })
  }
}

export default new ImageAdjustUtil()
