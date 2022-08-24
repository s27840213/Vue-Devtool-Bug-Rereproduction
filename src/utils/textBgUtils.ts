import store from '@/store'
import { IText } from '@/interfaces/layer'
import { isITextBox, isITextGooey, isITextUnderline, ITextBgEffect } from '@/interfaces/format'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils//textEffectUtils'
import imageAdjustUtil from '@/utils//imageAdjustUtil'
import generalUtils from '@/utils//generalUtils'

class TextBg {
  effects = {} as Record<string, Record<string, string | number>>
  constructor() {
    this.effects = this.getDefaultEffects()
  }

  rgba = (color: string, opacity: number) =>
    textEffectUtils.convertColor2rgba(color, opacity)

  getDefaultEffects() {
    return {
      none: {},
      'square-borderless': {
        opacity: 100, // adjustable
        yOffset: 0,
        bStroke: 0,
        bRadius: 0,
        bColor: 'transparent',
        pStroke: 20, // adjustable
        pColor: '#F1D289' // adjustable
      },
      'rounded-borderless': {
        opacity: 100, // adjustable
        yOffset: 0,
        bStroke: 0,
        bRadius: 35, // adjustable
        bColor: 'transparent',
        pStroke: 20, // adjustable
        pColor: '#F1D289' // adjustable
      },
      'square-hollow': {
        opacity: 100, // adjustable
        yOffset: 0,
        bStroke: 8, // adjustable
        bRadius: 0,
        bColor: '#F1D289', // adjustable
        pStroke: 10,
        pColor: 'transparent'
      },
      'rounded-hollow': {
        opacity: 100, // adjustable
        yOffset: 0,
        bStroke: 8, // adjustable
        bRadius: 35, // adjustable
        bColor: '#F1D289', // adjustable
        pStroke: 10,
        pColor: 'transparent'
      },
      'square-both': {
        opacity: 100, // adjustable
        yOffset: 0,
        bStroke: 8, // adjustable
        bRadius: 0,
        bColor: '#979B9B', // adjustable
        pStroke: 10, // adjustable
        pColor: '#F1D289' // adjustable
      },
      'rounded-both': {
        opacity: 100, // adjustable
        yOffset: 0,
        bStroke: 8, // adjustable
        bRadius: 35, // adjustable
        bColor: '#979B9B', // adjustable
        pStroke: 10, // adjustable
        pColor: '#F1D289' // adjustable
      },
      'underline-triangle': {
        height: 20,
        yOffset: -2,
        opacity: 100,
        color: '#F1D289'
      },
      'underline-circle': {
        height: 20,
        yOffset: -2,
        opacity: 100,
        color: '#F1D289'
      },
      'underline-square': {
        height: 20,
        yOffset: -2,
        opacity: 100,
        color: '#F1D289'
      },
      gooey: {
        bRadius: 20,
        opacity: 100,
        color: '#F1D289'
      }
    }
  }

  convertTextEffect(effect: ITextBgEffect) {
    if (!isITextBox(effect)) return {}

    const opacity = effect.opacity * 0.01
    const [pTop, pBottom] = [effect.pStroke - effect.yOffset, effect.pStroke + effect.yOffset]
    return {
      borderWidth: `${effect.bStroke}px`,
      borderStyle: 'solid',
      borderColor: this.rgba(effect.bColor, opacity),
      borderRadius: `${effect.bRadius}px`,
      padding: `${pTop}px 20px ${pBottom}px 20px`,
      backgroundColor: this.rgba(effect.pColor, opacity),
      // Prevent BGcolor overflow to border
      backgroundClip: 'padding-box',
      // Only for Contorller
      controllerPadding: `${effect.bStroke + pTop}px ${effect.bStroke + 20}px ${effect.bStroke + pBottom}px ${effect.bStroke + 20}px`
    }
  }

  converTextSpanEffect(effect: ITextBgEffect): Record<string, unknown> {
    const svgId = `svgFilter__${generalUtils.generateRandomString(5)}`
    let color = ''
    if (isITextUnderline(effect) || isITextGooey(effect)) {
      color = this.rgba(effect.color, effect.opacity * 0.01)
    }

    if (isITextUnderline(effect)) {
      const underlineBorder = (type: string, color: string) => {
        function semiCircle(right: boolean) {
          return `url("data:image/svg+xml; utf8,
            <svg width='4' height='8' viewBox='0 0 4 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <g clip-path='url(%23clip0)'>
                <line ${right ? "transform='matrix(-1 0 0 1 4 8)'" : ''} x1='4' y1='${right ? -4 : 4}' x2='152' y2='${right ? -4 : 4}' stroke='${color}' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/>
              </g>
              <defs>
                <clipPath id='clip0'>
                  <rect ${right ? "transform='matrix(-1 0 0 1 4 0)'" : ''} width='4' height='8' fill='white'/>
                </clipPath>
              </defs>
            </svg>")`.replace(/\n[ ]*/g, '')
        }

        type = type.split('-')[1]
        switch (type) {
          case 'triangle':
            // How to draw a triangle in BG, https://stackoverflow.com/a/39854065
            return `
              linear-gradient(to bottom right, transparent 0%, transparent 50%, ${color} 50%, ${color} 100%),
              linear-gradient(to top left, transparent 0%, transparent 50%, ${color} 50%, ${color} 100%)`
          case 'circle':
            return `${semiCircle(false)}, ${semiCircle(true)}`
          case 'square':
            return `linear-gradient(${color}, ${color}), linear-gradient(${color}, ${color})`
        }
      }

      const underlineWidthScale = effect.height / 8
      return {
        boxDecorationBreak: 'clone',
        backgroundRepeat: 'no-repeat',
        backgroundImage: `
          linear-gradient(180deg, ${color}, ${color}),
          ${underlineBorder(effect.name, color)}`,
        backgroundSize: `
          calc(100% - ${underlineWidthScale * 8}px) ${effect.height}px,
          ${effect.height / 2}px ${effect.height}px,
          ${effect.height / 2}px ${effect.height}px`,
        backgroundPositionX: `${underlineWidthScale * 4}px, 0, 100%`,
        backgroundPositionY: `${100 - (effect.yOffset)}%`
      }
    } else if (isITextGooey(effect)) {
      return {
        padding: '0 20px',
        backgroundColor: color,
        filter: `url(#${svgId})`,
        svgId: svgId,
        svgFilter: [
          imageAdjustUtil.createSvgFilter({
            tag: 'feGaussianBlur',
            attrs: {
              in: 'SourceGraphic',
              result: 'blur',
              stdDeviation: effect.bRadius / 4
            }
          }),
          imageAdjustUtil.createSvgFilter({
            tag: 'feColorMatrix',
            attrs: {
              in: 'blur',
              result: 'goo',
              mode: 'matrix',
              values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9'
            }
          }),
          imageAdjustUtil.createSvgFilter({
            tag: 'feComposite',
            attrs: {
              in: 'SourceGraphic',
              in2: 'goo',
              operator: 'atop'
            }
          })
        ]
      }
    } else return {}
  }

  setTextBg(effect: string, attrs?: Record<string, string | number>): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue
      const { type, styles: { textBg: layerTextBg } } = layers[idx] as IText

      if (type === 'text') {
        const textBg = {} as ITextBgEffect
        if (layerTextBg && layerTextBg.name === effect) {
          Object.assign(textBg, layerTextBg, attrs)
        } else {
          Object.assign(textBg, defaultAttrs, attrs, { name: effect })
        }

        if (isITextBox(textBg)) {
          // textBg.bColor = textBg.bColor || '#FF0000'
          // textBg.pColor = textBg.pColor || '#00FF00'
          textBg.yOffset = Math.max(Math.min(textBg.yOffset, textBg.pStroke), -textBg.pStroke)
        } else if (isITextUnderline(textBg)) {
          textBg.color = textBg.color || '#0000FF'
        }

        store.commit('UPDATE_specLayerData', {
          pageIndex,
          layerIndex,
          subLayerIndex: +idx,
          styles: { textBg }
        })
      }
    }
  }
}

export default new TextBg()
