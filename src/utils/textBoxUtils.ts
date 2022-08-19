import LayerUtils from '@/utils/layerUtils'
import { IText } from '@/interfaces/layer'
import store from '@/store'
import textEffectUtils from './textEffectUtils'
import { ITextBox } from '@/interfaces/format'

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
      }
    }
  }

  convertTextEffect(effect: ITextBox) {
    const opacity = effect.opacity * 0.01
    switch (effect.name) {
      case 'none':
        return {}
      default:
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
  }

  // updateTextEffect(pageIndex: number, layerIndex: number, attrs = {}) {
  //   const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
  //   const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
  //   for (const idx in layers) {
  //     const { type, styles: { textEffect }, paragraphs } = layers[idx] as IText
  //     if (type === 'text') {
  //       const mainColor = this.getLayerMainColor(paragraphs)
  //       const mainFontSize = this.getLayerFontSize(paragraphs)
  //       const effectName = (textEffect as any).name
  //       if (effectName && effectName !== 'none') {
  //         switch (effectName) {
  //           case 'hollow':
  //             Object.assign(textEffect, { color: mainColor })
  //             break
  //           case 'splice':
  //             Object.assign(textEffect, { strokeColor: mainColor })
  //             break
  //         }
  //         Object.assign(textEffect, { fontSize: mainFontSize })
  //         store.commit('UPDATE_specLayerData', {
  //           pageIndex,
  //           layerIndex,
  //           subLayerIndex: +idx,
  //           styles: { textEffect }
  //         })
  //       }
  //     }
  //   }
  // }

  setTextBox(effect: string, attrs?: Record<string, string | number>): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue
      const { type, styles: { textBox: layerTextbox }, paragraphs } = layers[idx] as IText

      if (type === 'text') {
        const textBox = {} as ITextBox
        if (layerTextbox && (layerTextbox as ITextBox).name === effect) {
          Object.assign(textBox, layerTextbox, attrs)
        } else {
          Object.assign(textBox, defaultAttrs, attrs, { name: effect })
        }

        Object.assign(textBox, {
          bColor: textBox.bColor || '#FF0000',
          pColor: textBox.pColor || '#00FF00'
        })
        store.commit('UPDATE_specLayerData', {
          pageIndex,
          layerIndex,
          subLayerIndex: +idx,
          styles: { textBox }
        })
      }
    }
  }

  // refreshColor() {
  //   const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
  //   const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
  //   const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]

  //   for (const idx in layers) {
  //     const { type, styles: { textEffect: layerTextEffect }, paragraphs } = layers[idx] as IText
  //     const textEffect = generalUtils.deepCopy(layerTextEffect)
  //     if (type === 'text') {
  //       const mainColor = this.getLayerMainColor(paragraphs)
  //       const effectName = textEffect.name
  //       if (effectName && effectName !== 'none') {
  //         switch (effectName) {
  //           case 'hollow':
  //             Object.assign(textEffect, { color: mainColor })
  //             break
  //           case 'splice':
  //             Object.assign(textEffect, { strokeColor: mainColor })
  //             break
  //         }
  //         store.commit('UPDATE_specLayerData', {
  //           pageIndex,
  //           layerIndex,
  //           subLayerIndex: +idx,
  //           styles: { textEffect }
  //         })
  //       }
  //     }
  //   }
  // }

  // refreshSize() {
  //   const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
  //   const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
  //   const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]

  //   for (const idx in layers) {
  //     const { type, styles: { textEffect: layerTextEffect }, paragraphs } = layers[idx] as IText
  //     const textEffect = layerTextEffect as any
  //     if (type === 'text') {
  //       const mainFontSize = this.getLayerFontSize(paragraphs)
  //       Object.assign(textEffect, {
  //         fontSize: mainFontSize
  //       })
  //       store.commit('UPDATE_specLayerData', {
  //         pageIndex,
  //         layerIndex,
  //         subLayerIndex: +idx,
  //         styles: { textEffect }
  //       })
  //     }
  //   }
  // }
}

export default new Textbox()
