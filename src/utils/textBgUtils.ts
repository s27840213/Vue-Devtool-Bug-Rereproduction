import store from '@/store'
import { IStyle, IText } from '@/interfaces/layer'
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
        opacity: 100,
        bStroke: 0, // unadjustable
        bRadius: 0, // unadjustable
        bColor: 'transparent', // unadjustable
        pStroke: 20,
        pColor: '#F1D289'
      },
      'rounded-borderless': {
        opacity: 100,
        bStroke: 0, // unadjustable
        bRadius: 35,
        bColor: 'transparent', // unadjustable
        pStroke: 20,
        pColor: '#F1D289'
      },
      'square-hollow': {
        opacity: 100,
        bStroke: 8,
        bRadius: 0, // unadjustable
        bColor: '#F1D289',
        pStroke: 10, // unadjustable
        pColor: 'transparent' // unadjustable
      },
      'rounded-hollow': {
        opacity: 100,
        bStroke: 8,
        bRadius: 35,
        bColor: '#F1D289',
        pStroke: 10, // unadjustable
        pColor: 'transparent' // unadjustable
      },
      'square-both': {
        opacity: 100,
        bStroke: 8,
        bRadius: 0, // unadjustable
        bColor: '#979B9B',
        pStroke: 10,
        pColor: '#F1D289'
      },
      'rounded-both': {
        opacity: 100,
        bStroke: 8,
        bRadius: 35,
        bColor: '#979B9B',
        pStroke: 10,
        pColor: '#F1D289'
      },
      underline: {
        endpoint: 'rounded',
        height: 20,
        yOffset: 10,
        opacity: 100,
        color: '#F1D289'
      },
      gooey: {
        bRadius: 48,
        opacity: 100,
        color: '#F1D289'
      }
    }
  }

  convertTextEffect(effect: ITextBgEffect) {
    if (!isITextBox(effect)) return {}

    const opacity = effect.opacity * 0.01
    return {
      borderWidth: `${effect.bStroke}px`,
      borderStyle: 'solid',
      borderColor: this.rgba(effect.bColor, opacity),
      borderRadius: `${effect.bRadius}px`,
      padding: `${effect.pStroke}px 20px`,
      backgroundColor: this.rgba(effect.pColor, opacity),
      // Prevent BGcolor overflow to border
      backgroundClip: 'padding-box',
      // Only for Contorller
      controllerPadding: `${effect.bStroke + effect.pStroke}px ${effect.bStroke + 20}px`
    }
  }

  convertTextSpanEffect(styles: IStyle): Record<string, unknown> {
    const effect = styles.textBg as ITextBgEffect
    const svgId = `svgFilter__${generalUtils.generateRandomString(5)}`
    let color = ''
    if (isITextUnderline(effect)) {
      color = this.rgba(effect.color, effect.opacity * 0.01)
    } else if (isITextGooey(effect)) {
      color = this.rgba(effect.color, effect.opacity * 0.006 + 0.4)
    }

    if (isITextUnderline(effect)) {
      let underlineSvg = ''
      const capWidth = styles.height * 0.005 * effect.height
      switch (effect.endpoint) {
        case 'triangle':
          underlineSvg = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${styles.width}' height='${capWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m${capWidth} 0h${styles.width - capWidth}l-${capWidth} ${capWidth * 2}h-${styles.width - capWidth}z'/>
            </svg>")`.replace(/\n[ ]*/g, '')
          break
        case 'rounded':
          underlineSvg = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${styles.width}' height='${capWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m${capWidth} 0a1 1 0 000 ${capWidth * 2}h${styles.width - capWidth * 2}a1 1 0 000 -${capWidth * 2}z'/>
            </svg>")`.replace(/\n[ ]*/g, '')
          break
        case 'square':
          underlineSvg = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${styles.width}' height='${capWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${styles.width}v${capWidth * 2}h-${styles.width}z'/>
            </svg>")`.replace(/\n[ ]*/g, '')
          break
      }

      return {
        boxDecorationBreak: 'clone',
        backgroundRepeat: 'no-repeat',
        backgroundImage: underlineSvg,
        backgroundSize: '100%',
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
              stdDeviation: effect.bRadius * 0.5
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

  setTextBg(effect: string, attrs?: Record<string, string | number | boolean>): void {
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
