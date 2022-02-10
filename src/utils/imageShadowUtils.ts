import { IShadowEffect, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'
import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import store from '@/store'

class ImageShadowUtils {
  setEffect (effect: string, attrs = {}): void {
    const { pageIndex, layerIndex, subLayerIdx, getCurrLayer: currLayer } = layerUtils
    const { shadow } = currLayer.styles
    if (subLayerIdx === -1 && currLayer.type === LayerType.group) {
      for (const i in (currLayer as IGroup).layers) {
        // const shadow = generalUtils.deepCopy((currLayer as IGroup).layers[+i]) as IShadowProps
        // Object.assign()
        // layerUtils.updateLayerStyles
      }
    } else {
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        shadow: {
          ...(shadow && (shadow as IShadowProps)),
          ...attrs,
          currentEffect: effect
        }
      }, subLayerIdx)
    }
    console.log(generalUtils.deepCopy(attrs))
    console.log((layerUtils.getCurrConfig as IImage).styles)
  }

  converShadowEffect(shadow: IShadowProps): { [key: string]: string } {
    const effect = shadow[shadow.currentEffect]
    switch (shadow.currentEffect) {
      case ShadowEffectType.shadow: {
        const { x, y, radius, spread, opacity } = effect as IShadowEffect
        return {
          boxShadow: `${x}px ${y}px ${radius}px ${spread}px rgba(0, 0, 0, ${opacity / 100})`
        }
      }
    }
    return {}
  }

  getDefaultEffect(effectName: string): Partial<IShadowProps> {
    let effect = {} as unknown
    switch (effectName) {
      case ShadowEffectType.shadow:
        (effect as IShadowEffect) = {
          x: 12,
          y: 12,
          radius: 0,
          spread: 0,
          opacity: 70
        }
    }
    return {
      [effectName]: effect
    } as Partial<IShadowProps>
  }
}

export default new ImageShadowUtils()
