import TextUtils from '@/utils/textUtils'
import { IText } from '@/interfaces/layer'
import CssConverter from './cssConverter'

class Controller {
  private shadowScale = 0.2
  private storkeScale = 0.04
  effects = {} as { [key: string]: any }
  constructor () {
    this.effects = this.getDefaultEffects()
  }

  getDefaultEffects () {
    return {
      none: {},
      shadow: {
        distance: 50,
        angle: 45,
        blur: 20,
        opacity: 60,
        color: ''
      }, // 陰影
      lift: {
        spread: 50
      }, // 模糊陰影
      hollow: {
        stroke: 50
      }, // 空心
      splice: {
        distance: 50,
        angle: 45,
        stroke: 50,
        color: ''
      }, // 出竅
      echo: {
        distance: 50,
        angle: 45,
        color: ''
      } // 雙重陰影
    }
  }

  getCurrentLayer (): IText {
    return TextUtils.getCurrLayer || {}
  }

  getLayerFontSize (): number {
    const { paragraphs = [] } = this.getCurrentLayer()
    let maxFontSize = 0
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const spanFontSizeList = paragraphs[idx].spans.map(span => span.styles.size || 0)
      maxFontSize = Math.max(maxFontSize, ...spanFontSizeList)
    }
    return maxFontSize
  }

  getLayerMainColor (): string {
    const { paragraphs = [] } = this.getCurrentLayer()
    const colors = {} as { [key: string]: number }
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
      .reduce((prev, curr) =>
        colors[prev] > colors[curr] ? prev : curr
      )
  }

  convertColor2rgba (colorStr: string, alpha?: number) {
    if (colorStr.startsWith('#')) {
      return this.convertHex2rgba(colorStr, alpha)
    }
    if (colorStr.startsWith('rgb')) {
      const [r, g, b, a = 1] = colorStr.match(/[.\d]+/g) || []
      return `rgba(${r}, ${g}, ${b}, ${alpha || a})`
    }
    return this.convertHex2rgba('#000000', 0.6)
  }

  convertHex2rgba (hex: string, alpha?: number) {
    const hexList = hex.match(/\w\w/g) || ['0', '0', '0']
    const opacity = typeof alpha === 'number' ? alpha : 1
    return `rgba(${hexList.map(x => parseInt(x, 16)).join(',')}, ${opacity})`
  }

  convertTextEffect (effect: any) {
    const { name, distance, angle, opacity, color, blur, spread, stroke, fontSize } = effect || {}
    const unit = this.shadowScale * fontSize
    const storkeWidth = this.storkeScale * fontSize

    const effectShadowOffset = distance * 0.01 * unit
    const effectBlur = blur * 0.01 * unit
    const effectSpread = spread * 0.6 * 0.01
    const effectSpreadBlur = spread * 1.6 * 0.01 * unit
    const effectStroke = stroke * 0.01 + 0.1
    const effectOpacity = opacity * 0.01

    switch (name) {
      case 'shadow':
        return CssConverter.convertTextShadow(
          effectShadowOffset * Math.cos(angle * Math.PI / 180),
          effectShadowOffset * Math.sin(angle * Math.PI / 180),
          this.convertColor2rgba(color, effectOpacity),
          effectBlur
        )
      case 'lift':
        return CssConverter.convertTextShadow(
          0,
          0.3 * unit,
          this.convertColor2rgba('#000000', Math.max(0.05, effectSpread)),
          (0.3 * unit) + effectSpreadBlur
        )
      case 'hollow':
        return CssConverter.convertTextStorke(
          effectStroke * storkeWidth,
          this.convertColor2rgba(color, 1),
          'transparent'
        )
      case 'splice':
        return {
          ...CssConverter.convertTextShadow(
            effectShadowOffset * Math.cos(angle * Math.PI / 180),
            effectShadowOffset * Math.sin(angle * Math.PI / 180),
            this.convertColor2rgba(color, 0.6),
            effectBlur
          ),
          ...CssConverter.convertTextStorke(
            effectStroke * storkeWidth,
            this.convertColor2rgba(color, 1),
            'transparent'
          )
        }
      case 'echo':
        return {
          textShadow: [0.6, 0.3]
            .map((opacity, i) =>
              CssConverter.convertTextShadow(
                effectShadowOffset * Math.cos(angle * Math.PI / 180) * (i + 1),
                effectShadowOffset * Math.sin(angle * Math.PI / 180) * (i + 1),
                this.convertColor2rgba(color, opacity),
                effectBlur
              ).textShadow
            )
            .join(',')
        }
      default:
        return {}
    }
  }

  setTextEffect (effect: string, attrs?: any): void {
    const { styles: { textEffect: styleTextEffect } } = this.getCurrentLayer()
    const textEffect = {} as any
    const defaultAttrs = this.effects[effect]
    if (styleTextEffect && (styleTextEffect as any).name === effect) {
      Object.assign(textEffect, styleTextEffect, attrs)
    } else {
      Object.assign(textEffect, defaultAttrs, attrs, { name: effect })
    }
    textEffect.color = textEffect.color || this.getLayerMainColor()
    textEffect.fontSize = this.getLayerFontSize()
    TextUtils.updateTextStyles(
      TextUtils.pageIndex,
      TextUtils.layerIndex,
      { textEffect }
    )
  }
}

export default new Controller()
