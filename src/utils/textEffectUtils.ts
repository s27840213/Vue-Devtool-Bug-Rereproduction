import { ITextEffect } from '@/interfaces/format'
import { AllLayerTypes, IParagraph, IText } from '@/interfaces/layer'
import store from '@/store'
import { lab2rgb, rgb2lab } from '@/utils/colorUtils'
import LayerUtils from '@/utils/layerUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import mathUtils from '@/utils/mathUtils'
import { debounce, max } from 'lodash'
import { reactive } from 'vue'
import tiptapUtils from './tiptapUtils'

type ITextShadowCSS = {
  '--base-stroke'?: string
  filter?: string
  webkitTextStrokeColor?: string
  webkitTextFillColor?: string
  duplicatedTexts?: {
    extraBodyStyle?: Record<string, string|number>
    extraSpanStyle?: Record<string, string|number>
  }[]
}

const focusState = ['none' as const, 'shadow' as const, 'shape' as const, 'bg' as const, 'fill' as const]
export type IFocusState = (typeof focusState)[number]
export function isFocusState(obj: string): obj is IFocusState {
  return !!obj && (focusState as string[]).includes(obj)
}

class Controller {
  private shadowScale = 0.2
  private strokeScale = 0.1
  private currColorKey = ''
  effects = {} as Record<string, Record<string, string | number>>
  focus = 'none' as IFocusState
  constructor() {
    this.effects = this.getDefaultEffects()
  }

  getDefaultEffects() {
    return {
      none: {},
      shadow: { // 陰影
        distance: 50,
        angle: 45,
        blur: 20,
        opacity: 60,
        color: 'fontColor'
      },
      lift: { // 模糊陰影
        spread: 50
      },
      hollow: { // 外框
        stroke: 17,
        color: 'fontColor'
      },
      splice: { // 外框分離
        distance: 50,
        angle: 45,
        stroke: 17,
        color: 'fontColor'
      },
      echo: { // 雙重陰影
        distance: 50,
        angle: 45,
        color: 'fontColor'
      },
      funky3d: { // 立體延伸
        distance: 3,
        distanceInverse: 0,
        angle: 45,
        opacity: 100,
        color: 'fontColorL+-40/BC/00'
      },
      bold3d: { // 3D立體
        distance: 10,
        angle: 0,
        opacity: 100,
        textStrokeColor: 'fontColorL+-40/BC/00',
        shadowStrokeColor: 'fontColor',
        color: 'fontColorL+-40/BC/00'
      }
    }
  }

  getCurrentLayer(): IText {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const subLayerIndex = LayerUtils.subLayerIdx
    const currLayer = store.getters.getLayer(pageIndex, layerIndex)
    const multiLayers = currLayer && currLayer.layers as any[]
    if (multiLayers) {
      if (subLayerIndex === -1) {
        for (const index in multiLayers) {
          if (multiLayers[index].type === 'text') {
            return multiLayers[index]
          }
        }
      } else {
        return multiLayers[subLayerIndex]
      }
    }
    return currLayer || {}
  }

  getSpecSubTextLayer(index: number): IText {
    const currLayer = LayerUtils.getCurrLayer
    const multiLayers = currLayer && currLayer.layers as any[]
    return multiLayers && multiLayers[index]
  }

  getLayerFontSize(paragraphs: IParagraph[]): number {
    let maxFontSize = 0
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const spanFontSizeList = paragraphs[idx].spans.map(span => span.styles.size || 0)
      maxFontSize = Math.max(maxFontSize, ...spanFontSizeList)
    }
    return maxFontSize
  }

  getLayerMainColor(paragraphs: IParagraph[]): string {
    const colors = {} as { [key: string]: number }
    if (!paragraphs) return '#000000'
    for (const idx in paragraphs) {
      const spans = paragraphs[idx].spans
      for (const i in spans) {
        const { styles, text = '' } = spans[i]
        if (styles.color) {
          colors[styles.color] = colors[styles.color] || 0 + text.length
        }
      }
    }
    return Object
      .keys(colors)
      .reduce((prev, curr) => colors[prev] > colors[curr] ? prev : curr, '#000000')
  }

  convertColor2rgba(colorStr: string, alpha?: number) {
    if (colorStr === 'transparent') return 'transparent'
    if (colorStr.startsWith('#')) {
      return this.convertHex2rgba(colorStr, alpha)
    }
    if (colorStr.startsWith('rgb')) {
      const [r, g, b, a = 1] = colorStr.match(/[.\d]+/g) || []
      return `rgba(${r}, ${g}, ${b}, ${alpha || a})`
    }
    return this.convertHex2rgba('#000000', 0.6)
  }

  convertHex2rgba(hex: string, alpha?: number) {
    const hexList = hex.match(/\w\w/g) || ['0', '0', '0']
    const opacity = typeof alpha === 'number' ? alpha : 1
    return `rgba(${hexList.map(x => parseInt(x, 16)).join(',')}, ${opacity})`
  }

  colorParser(color: string, config: IText) {
    const fontColor = this.getLayerMainColor(config.paragraphs)
    const lab = rgb2lab(fontColor)
    lab[0] = lab[0] <= 50 ? lab[0] + 40 : lab[0] - 40
    const fontColorL40 = lab2rgb(lab)

    switch (color) {
      case 'fontColor':
        return fontColor
      case 'fontColorL+-40/BC/00':
        if (fontColor === '#000000') return '#BCBCBC'
        if (fontColor === '#FFFFFF') return '#000000'
        return fontColorL40
      case 'fontColorL+-40/F1D289':
        if (['#000000', '#FFFFFF'].includes(fontColor)) return '#F1D289'
        return fontColorL40
      default:
        return color
    }
  }

  funky3d(distance: number, distanceInverse: number, angle: number, color: string) {
    const shadow = [] as string[]
    for (let d = -distanceInverse * 0.06; d < distance * 1.5; d += 0.5) {
      const { x, y } = mathUtils.getRotatedPoint(-angle, { x: 0, y: 0 }, { x: 0, y: d })
      shadow.push(`${color} ${x}px ${y}px`)
    }
    return { textShadow: shadow.join(',') }
  }

  convertTextEffect(config: IText): ITextShadowCSS {
    const effect = config.styles.textEffect as any
    let { name, distance, angle, opacity, color, blur, spread, stroke, fontSize, ver } = effect || {}
    const unit = this.shadowScale * fontSize
    let strokeWidth = this.strokeScale * fontSize
    if (ver && ver === 'v1') {
      strokeWidth = Math.ceil(Math.max(stroke, 0.1) / 9) * 0.5 * this.strokeScale * fontSize
    }
    const effectShadowOffset = distance * 0.01 * unit
    const effectBlur = blur * 0.01 * unit
    const effectSpread = spread * 0.6 * 0.01
    const effectSpreadBlur = spread * 1.6 * 0.01 * unit
    const effectOpacity = opacity * 0.01
    const effectStroke = Math.max(stroke, 0.1) * 0.01 + 0.1
    color = this.colorParser(color, config)
    const colorWithOpacity = color ? this.convertColor2rgba(color, effectOpacity) : ''

    const maxFontSize = max(config.paragraphs.flatMap(p => p.spans.map(s => s.styles.size))) as number

    switch (name) {
      case 'shadow':
        return {
          '--base-stroke': '0px',
          filter: `drop-shadow(
            ${colorWithOpacity} 
            ${effectShadowOffset * Math.cos(angle * Math.PI / 180)}px
            ${effectShadowOffset * Math.sin(angle * Math.PI / 180)}px
            ${effectBlur / 2}px)`,
        }
      case 'lift':
        return {
          '--base-stroke': '0px',
          filter: `drop-shadow(
            ${this.convertColor2rgba('#000000', Math.max(0.05, effectSpread))} 
            ${0}px
            ${0.3 * unit}px
            ${((0.3 * unit) + effectSpreadBlur) / 2}px)`,
        }
      case 'hollow':
        return {
          '--base-stroke': `${effectStroke * strokeWidth}px`,
          webkitTextStrokeColor: this.convertColor2rgba(color, 1),
          webkitTextFillColor: 'transparent'
        }
      case 'splice': {
        const strokeColor = this.colorParser('fontColor', config)
        return {
          '--base-stroke': `${effectStroke * strokeWidth}px`,
          webkitTextStrokeColor: `${this.convertColor2rgba(strokeColor, 1)}`,
          webkitTextFillColor: 'transparent',
          duplicatedTexts: [{
            extraBodyStyle: {
              left: `${effectShadowOffset * Math.cos(angle * Math.PI / 180) - maxFontSize}px`,
              top: `${effectShadowOffset * Math.sin(angle * Math.PI / 180) - maxFontSize}px`,
            },
            extraSpanStyle: {
              color,
              'text-decoration-color': color,
              webkitTextStroke: 'initial',
              webkitTextFillColor: 'initial',
            },
          }]
        }
      }
      case 'echo':
        return {
          '--base-stroke': '0px',
          duplicatedTexts: [0.5, 0.2].map((opacity, i) => ({
            extraBodyStyle: {
              left: `${effectShadowOffset * Math.cos(angle * Math.PI / 180) * (i + 1) - maxFontSize}px`,
              top: `${effectShadowOffset * Math.sin(angle * Math.PI / 180) * (i + 1) - maxFontSize}px`,
            },
            extraSpanStyle: {
              opacity,
              color,
              'text-decoration-color': color,
            },
          })),
        }
      case 'funky3d':
        return {
          '--base-stroke': '0px',
          duplicatedTexts: [{
            extraBodyStyle: {
              ...this.funky3d(
                distance * fontSize / 60,
                effect.distanceInverse * fontSize / 60,
                effect.angle,
                color,
              ),
              opacity: effectOpacity,
              // Prevent TextFIll maskImage clip shadow, and remove TextFill BG for shadow.
              background: 'none',
              maskImage: 'none',
            },
          }]
        }
      case 'bold3d': {
        const { x, y } = mathUtils.getRotatedPoint(angle, { x: 0, y: 0 }, { x: effect.distance * 0.2 * fontSize / 60, y: 0 })
        return {
          '--base-stroke': '1px',
          webkitTextStrokeColor: `${this.convertColor2rgba(effect.textStrokeColor, effectOpacity)}`,
          duplicatedTexts: [{
            extraBodyStyle: {
              left: `${x - maxFontSize}px`,
              top: `${y - maxFontSize}px`,
            },
            extraSpanStyle: {
              color: colorWithOpacity,
              'text-decoration-color': colorWithOpacity, // Have to be dash-case, because camelcase cannot overwrite dash-case created from cssConverter.convertFontStyle.
              webkitTextStrokeColor: `${this.convertColor2rgba(effect.shadowStrokeColor, effectOpacity)}`,
            },
          }]
        }
      }
      default:
        return { '--base-stroke': '0px' }
    }
  }

  setColorKey(key: string) {
    this.currColorKey = key
  }

  setColor(color: string) {
    const effectName = this.getCurrentLayer().styles.textEffect.name
    this.setTextEffect(effectName, { [this.currColorKey]: color })
  }

  get currColor(): string {
    return (this.getCurrentLayer().styles.textEffect as Record<string, string>)[this.currColorKey]
  }

  resetCurrTextEffect() {
    const effectName = this.getCurrentLayer().styles.textEffect.name
    this.setTextEffect(effectName, this.effects[effectName])
  }

  setTextEffect(effect: string, attrs = {} as any): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = (targetLayer.layers ? targetLayer.layers : [targetLayer]) as AllLayerTypes[]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue
      const layer = layers[idx]
      if (layer.type !== 'text') continue

      const paragraphs = layer.paragraphs
      const oldTextEffect = layer.styles.textEffect
      const newTextEffect = {} as ITextEffect

      if (oldTextEffect && oldTextEffect.name === effect) { // Adjust effect option.
        Object.assign(newTextEffect, oldTextEffect, attrs)
        localStorageUtils.set('textEffectSetting', effect, newTextEffect)
      } else { // Switch to other effect.
        const localAttrs = localStorageUtils.get('textEffectSetting', effect) as ITextEffect
        Object.assign(newTextEffect, defaultAttrs, localAttrs, attrs, { name: effect })
      }
      const mainColor = this.getLayerMainColor(paragraphs)
      const mainFontSize = this.getLayerFontSize(paragraphs)
      Object.assign(newTextEffect, {
        color: newTextEffect.color || mainColor,
        strokeColor: newTextEffect.strokeColor || mainColor,
        fontSize: mainFontSize
      })
      store.commit('UPDATE_specLayerData', {
        pageIndex,
        layerIndex,
        subLayerIndex: +idx,
        styles: { textEffect: newTextEffect }
      })
      tiptapUtils.updateHtml()
    }
  }

  _setFocus(focus: IFocusState) {
    this.focus = focus
  }

  // Write debounce callback separately, or watch will not trigger.
  setFocus = debounce(this._setFocus, 100)

  refreshSize() {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]

    for (const idx in layers) {
      const { type, styles: { textEffect: layerTextEffect }, paragraphs } = layers[idx] as IText
      const textEffect = layerTextEffect
      if (type === 'text') {
        const mainFontSize = this.getLayerFontSize(paragraphs)
        Object.assign(textEffect, {
          fontSize: mainFontSize
        })
        store.commit('UPDATE_specLayerData', {
          pageIndex,
          layerIndex,
          subLayerIndex: +idx,
          styles: { textEffect }
        })
      }
    }
  }
}

export default reactive(new Controller())
