import LayerUtils from '@/utils/layerUtils'
import { IText } from '@/interfaces/layer'
import store from '@/store'
import textEffectUtils from './textEffectUtils'

class Textbox {
  effects = {} as { [key: string]: any }
  constructor() {
    this.effects = this.getDefaultEffects()
  }

  getDefaultEffects() {
    return {
      none: {},
      test: {
        opacity: 50,
        bStroke: 20,
        bRadius: 10,
        bColor: '',
        pStroke: 20,
        pColor: ''
      }
    }
  }

  convertTextEffect(effect: any) {
    switch (effect.name) {
      case 'none':
        return {}
      default:
        return {
          borderWidth: `${effect.bStroke}px`,
          borderStyle: 'solid',
          borderColor: `${textEffectUtils.convertColor2rgba(effect.bColor, effect.opacity * 0.01)}`,
          borderRadius: `${effect.bRadius}px`,
          padding: `${effect.pStroke}px 0`,
          backgroundColor: textEffectUtils.convertColor2rgba(effect.pColor, effect.opacity * 0.01),
          textShadow: 'none'
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

  setTextbox(effect: string, attrs?: any): void {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = targetLayer.layers ? targetLayer.layers : [targetLayer]
    const subLayerIndex = LayerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue
      const { type, styles: { textBox: layerTextbox }, paragraphs } = layers[idx] as IText

      if (type === 'text') {
        const textBox = {} as any
        if (layerTextbox && (layerTextbox as any).name === effect) {
          Object.assign(textBox, layerTextbox, attrs)
        } else {
          Object.assign(textBox, defaultAttrs, attrs, { name: effect })
        }

        const mainColor = textEffectUtils.getLayerMainColor(paragraphs)
        Object.assign(textBox, {
          bColor: textBox.bColor || mainColor,
          pColor: textBox.pColor || mainColor
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
