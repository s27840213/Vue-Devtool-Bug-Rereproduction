import LayerUtils from '@/utils/layerUtils'
import { IText } from '@/interfaces/layer'
import store from '@/store'
import textEffectUtils from './textEffectUtils'
import { ITextBox, ITextUnderline, isITextBox, isITextUnderline } from '@/interfaces/format'

class Textbox {
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
        opacity: 50, // adjustable
        bStroke: 0,
        bRadius: 0,
        bColor: 'transparent',
        pStroke: 20, // adjustable
        pColor: '' // adjustable
      },
      'rounded-borderless': {
        opacity: 50, // adjustable
        bStroke: 0,
        bRadius: 20, // adjustable
        bColor: 'transparent',
        pStroke: 20, // adjustable
        pColor: '' // adjustable
      },
      'square-hollow': {
        opacity: 50, // adjustable
        bStroke: 20, // adjustable
        bRadius: 0,
        bColor: '', // adjustable
        pStroke: 0,
        pColor: 'transparent'
      },
      'rounded-hollow': {
        opacity: 50, // adjustable
        bStroke: 20, // adjustable
        bRadius: 20, // adjustable
        bColor: '', // adjustable
        pStroke: 0,
        pColor: 'transparent'
      },
      'square-both': {
        opacity: 50, // adjustable
        bStroke: 20, // adjustable
        bRadius: 0,
        bColor: '', // adjustable
        pStroke: 20, // adjustable
        pColor: '' // adjustable
      },
      'rounded-both': {
        opacity: 50, // adjustable
        bStroke: 20, // adjustable
        bRadius: 20, // adjustable
        bColor: '', // adjustable
        pStroke: 20, // adjustable
        pColor: '' // adjustable
      },
      'underline-triangle': {
        height: 20,
        yOffset: -2,
        opacity: 100,
        color: ''
      },
      'underline-circle': {
        height: 20,
        yOffset: -2,
        opacity: 100,
        color: ''
      },
      'underline-square': {
        height: 20,
        yOffset: -2,
        opacity: 100,
        color: ''
      }
    }
  }

  convertTextEffect(effect: ITextBox|ITextUnderline) {
    if (!isITextBox(effect)) return {}

    const opacity = effect.opacity * 0.01
    return {
      borderWidth: `${effect.bStroke}px`,
      borderStyle: 'solid',
      borderColor: this.rgba(effect.bColor, opacity),
      borderRadius: `${effect.bRadius}px`,
      padding: `${effect.pStroke}px 0`,
      backgroundColor: this.rgba(effect.pColor, opacity),
      // Prevent BGcolor overflow to border
      backgroundClip: 'padding-box',
      // Only for Contorller
      controllerPadding: `${effect.bStroke + effect.pStroke}px ${effect.bStroke}px`
    }
  }

  converTextSpanEffect(effect: ITextBox|ITextUnderline): Record<string, string | never> {
    if (!isITextUnderline(effect)) return {}

    function underlineBorder(type: string, color: string) {
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
          </svg>")`.replace(/\n/g, '')
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
    const color = effect.color
      ? this.rgba(effect.color, effect.opacity * 0.01)
      : ''

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
  }

  setTextBox(effect: string, attrs?: Record<string, string | number>): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue
      const { type, styles: { textBox: layerTextbox } } = layers[idx] as IText

      if (type === 'text') {
        const textBox = {} as ITextBox | ITextUnderline
        if (layerTextbox && layerTextbox.name === effect) {
          Object.assign(textBox, layerTextbox, attrs)
        } else {
          Object.assign(textBox, defaultAttrs, attrs, { name: effect })
        }

        if (isITextBox(textBox)) {
          textBox.bColor = textBox.bColor || '#FF0000'
          textBox.pColor = textBox.pColor || '#00FF00'
        } else if (isITextUnderline(textBox)) {
          textBox.color = textBox.color || '#0000FF'
        }

        store.commit('UPDATE_specLayerData', {
          pageIndex,
          layerIndex,
          subLayerIndex: +idx,
          styles: { textBox }
        })
      }
    }
  }
}

export default new Textbox()
