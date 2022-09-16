import store from '@/store'
import { IStyle, IText } from '@/interfaces/layer'
import { isITextBox, isITextGooey, isITextUnderline, ITextBgEffect } from '@/interfaces/format'
import LayerUtils from '@/utils/layerUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import imageAdjustUtil from '@/utils/imageAdjustUtil'
import tiptapUtils from '@/utils/tiptapUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import text from '@/store/text'

class TextBg {
  private currColorKey = ''
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
      cloud: {
        bRadius: 48,
        opacity: 100,
        color: '#F1D289'
      },
      gooey: {
        distance: 0,
        bRadius: 48,
        opacity: 100,
        color: '#F1D289'
      }
    }
  }

  inlineSvg(svg: string) {
    return svg.replace(/\n[ ]*/g, '').replace(/#/g, '%23')
  }

  convertTextEffect(styles: IStyle) {
    const effect = styles.textBg as ITextBgEffect
    if (!isITextBox(effect)) return {}

    const opacity = effect.opacity * 0.01
    const width = styles.width + (effect.bStroke + 20) * 2
    const height = styles.height + (effect.bStroke + effect.pStroke) * 2
    const innerWidth = styles.width + 20 * 2 + effect.bStroke
    const innerHeight = styles.height + effect.pStroke * 2 + effect.bStroke
    const innerRadius = Math.max(0, Math.min(effect.bRadius - effect.bStroke / 2, innerWidth / 2, innerHeight / 2))

    return {
      padding: `${effect.bStroke + effect.pStroke}px ${effect.bStroke + 20}px`,
      borderRadius: `${effect.bRadius}px`,
      // How to prevent stroke and color mix, https://stackoverflow.com/a/69290621
      svg: {
        width,
        height,
        content: [{
          tag: 'path',
          attrs: {
            style: `fill:${effect.pColor}; stroke:${effect.bColor}; opacity:${opacity}`,
            'stroke-width': `${effect.bStroke}`,
            d: `
              m${effect.bStroke / 2} ${effect.bStroke / 2 + innerRadius}a${innerRadius} ${innerRadius} 0 01${innerRadius} -${innerRadius}
              h${innerWidth - innerRadius * 2}a${innerRadius} ${innerRadius} 0 01${innerRadius} ${innerRadius}
              v${innerHeight - innerRadius * 2}a${innerRadius} ${innerRadius} 0 01-${innerRadius} ${innerRadius}
              h-${innerWidth - innerRadius * 2}a${innerRadius} ${innerRadius} 0 01-${innerRadius} -${innerRadius}z`
          }
        }]
      }
    }
  }

  convertTextSpanEffect(effect: ITextBgEffect): Record<string, unknown> {
    if (!isITextUnderline(effect) && !isITextGooey(effect)) return {}

    if (isITextUnderline(effect)) {
      const { color } = effect
      const borderWidth = Math.round(effect.height / 2)
      let bgEndpoints = ''

      switch (effect.endpoint) {
        case 'triangle':
          bgEndpoints = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m${borderWidth + 1} 0h-1l-${borderWidth} ${borderWidth * 2}h${borderWidth + 1}z'/>
            </svg>"), url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${borderWidth + 1}l-${borderWidth} ${borderWidth * 2}h-1z'/>
            </svg>")`
          break
        case 'rounded':
          bgEndpoints = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m${borderWidth + 1} 0h-1a1 1 0 000 ${borderWidth * 2}h1z'/>
            </svg>"), url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h1a1 1 0 010 ${borderWidth * 2}h-1z'/>
            </svg>")`
          break
        case 'square':
          bgEndpoints = `url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${borderWidth + 1}v${borderWidth * 2}h-${borderWidth + 1}z'/>
            </svg>"), url("data:image/svg+xml;utf8,
            <svg fill='${color}' width='${borderWidth + 1}' height='${borderWidth * 2}' xmlns='http://www.w3.org/2000/svg'>
              <path d='m0 0h${borderWidth + 1}v${borderWidth * 2}h-${borderWidth + 1}z'/>
            </svg>")`
          break
      }

      return {
        duplicatedSpan: {
          color: 'transparent',
          opacity: effect.opacity * 0.01,
          boxDecorationBreak: 'clone',
          backgroundRepeat: 'no-repeat',
          backgroundImage: `
            linear-gradient(180deg, ${color}, ${color}),
            ${this.inlineSvg(bgEndpoints)}`,
          backgroundSize: `
            calc(100% - ${borderWidth * 2}px) ${borderWidth * 2}px,
            ${borderWidth + 1}px ${borderWidth * 2}px,
            ${borderWidth + 1}px ${borderWidth * 2}px`,
          backgroundPositionX: `${borderWidth}px, 0, 100%`,
          backgroundPositionY: `${100 - (effect.yOffset)}%`
        }
      }
    } else if (isITextGooey(effect) && effect.name === 'cloud') {
      const color = this.rgba(effect.color, effect.opacity * 0.01)
      return {
        padding: '0 20px',
        boxDecorationBreak: 'clone',
        borderRadius: `${effect.bRadius}px`,
        backgroundColor: color
      }
    } else if (isITextGooey(effect) && effect.name === 'gooey') {
      const { color } = effect
      const svgId = `textBg_gooey_${effect.bRadius}`
      return {
        paddingTop: `${effect.distance}px`,
        paddingBottom: `${effect.distance}px`,
        textGooeyPaddingX: `${effect.distance + 20}px`, // For tiptap CSS var
        '--textGooeyPaddingX': `${effect.distance + 20}px`,
        boxDecorationBreak: 'clone',
        duplicatedBody: {
          filter: `url(#${svgId})`,
          opacity: effect.opacity * 0.01
        },
        duplicatedSpan: {
          color: 'transparent',
          backgroundColor: color
        },
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

  syncShareAttrs(textBg: ITextBgEffect, effectName: string|null) {
    Object.assign(textBg, { name: textBg.name || effectName })
    const shareAttrs = (localStorageUtils.get('textEffectSetting', 'textBgShare') ?? {}) as Record<string, string>
    const newShareAttrs = { opacity: textBg.opacity }
    const newEffect = { opacity: shareAttrs.opacity }
    if (isITextBox(textBg)) {
      if (['square-borderless', 'rounded-borderless',
        'square-both', 'rounded-both'].includes(textBg.name)) {
        Object.assign(newShareAttrs, { color: textBg.pColor })
        Object.assign(newEffect, { pColor: shareAttrs.color })
      }
      if (['square-hollow', 'rounded-hollow',
        'square-both', 'rounded-both'].includes(textBg.name)) {
        Object.assign(newShareAttrs, { bStroke: textBg.bStroke })
        Object.assign(newEffect, { bStroke: shareAttrs.bStroke })
      }
    } else {
      Object.assign(newShareAttrs, { color: textBg.color })
      Object.assign(newEffect, { color: shareAttrs.color })
    }

    // If effectName is null, overwrite share attrs. Otherwise, read share attrs and set to effect.
    if (!effectName) {
      Object.assign(shareAttrs, newShareAttrs)
      localStorageUtils.set('textEffectSetting', 'textBgShare', shareAttrs)
    } else {
      const effect = (localStorageUtils.get('textEffectSetting', effectName) ?? {}) as Record<string, string>
      Object.assign(effect, newEffect)
      localStorageUtils.set('textEffectSetting', effectName, effect)
    }
  }

  setColorKey(key: string) {
    this.currColorKey = key
  }

  setColor(color: string) {
    const effectName = textEffectUtils.getCurrentLayer().styles.textBg.name
    this.setTextBg(effectName, { [this.currColorKey]: color })
  }

  resetCurrTextEffect() {
    const effectName = textEffectUtils.getCurrentLayer().styles.textBg.name
    this.setTextBg(effectName, this.effects[effectName])
  }

  setTextBg(effect: string, attrs?: Record<string, string | number | boolean>): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue
      // Leave text editing mode to show some span text effect.
      layers[idx].contentEditable = false

      const { type, styles: { textBg: layerTextBg } } = layers[idx] as IText

      if (type === 'text') {
        const textBg = {} as ITextBgEffect
        if (layerTextBg && layerTextBg.name === effect) {
          Object.assign(textBg, layerTextBg, attrs)
          localStorageUtils.set('textEffectSetting', effect, textBg)
          this.syncShareAttrs(textBg, null)
        } else {
          this.syncShareAttrs(textBg, effect)
          const localAttrs = localStorageUtils.get('textEffectSetting', effect)
          Object.assign(textBg, defaultAttrs, localAttrs, attrs, { name: effect })
        }

        store.commit('UPDATE_specLayerData', {
          pageIndex,
          layerIndex,
          subLayerIndex: +idx,
          styles: { textBg }
        })
      }
    }

    // Update content in tiptap and focus it if need.
    tiptapUtils.updateHtml()
  }
}

export default new TextBg()
