import { IGroup, IImage, IImageStyle } from '@/interfaces/layer'
import { LayerType } from '@/store/types'
import generalUtils from './generalUtils'
import layerUtils from './layerUtils'
import store from '@/store'
import mathUtils from './mathUtils'
import { IBlurEffect, IFrameEffect, IHaloEffect, IProjectionEffect, IShadowEffect, IShadowProps, ShadowEffectType } from '@/interfaces/imgShadow'

type ShadowEffects = IBlurEffect | IShadowEffect | IFrameEffect | IHaloEffect | IProjectionEffect

const HALO_Y_OFFSET = 70 as const
export const HALO_SPREAD_LIMIT = 80 as const
class ImageShadowUtils {
  setEffect (effect: ShadowEffectType, attrs = {}): void {
    const { pageIndex, layerIndex, subLayerIdx, getCurrConfig: currLayer } = layerUtils
    if (subLayerIdx === -1 && currLayer.type === LayerType.group) {
      for (const i in (currLayer as IGroup).layers) {
        // const shadow = generalUtils.deepCopy((currLayer as IGroup).layers[+i]) as IShadowProps
        // Object.assign()
        // layerUtils.updateLayerStyles
      }
    } else {
      const { shadow } = (currLayer as IImage).styles
      layerUtils.updateLayerStyles(pageIndex, layerIndex, {
        shadow: {
          ...(shadow && (shadow as IShadowProps)),
          ...attrs,
          currentEffect: effect
        }
      }, subLayerIdx)
    }
  }

  convertShadowEffect(styles: IImageStyle): { [key: string]: string } {
    const { shadow, scale } = styles
    const { color = '#000000' } = shadow
    const effect = shadow[shadow.currentEffect]

    switch (shadow.currentEffect) {
      case ShadowEffectType.blur:
      case ShadowEffectType.shadow: {
        const { x = 0, y = 0, radius, spread, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity']) as ShadowEffects
        return {
          boxShadow:
            `${x}px ${y}px ` +
            `${radius}px ` +
            `${spread}px ` +
            `${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.frame: {
        const { width, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity']) as ShadowEffects
        return {
          boxShadow: `0 0 ${width}px ${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.halo: {
        const { radius, spread, opacity } = mathUtils
          .multipy(scale, effect as ShadowEffects, ['opacity']) as ShadowEffects
        return {
          boxShadow:
          `0px ${HALO_Y_OFFSET * scale}px ` +
          `${radius}px ` +
          `${spread - HALO_SPREAD_LIMIT * scale}px ` +
          `${color + this.convertToAlpha(opacity)}`
        }
      }
      case ShadowEffectType.projection:
      case ShadowEffectType.none:
        return {}
      default:
        return this.assertUnreachable(shadow.currentEffect)
    }
  }

  convertToAlpha(percent: number): string {
    return Math.floor(percent / 100 * 255).toString(16).toUpperCase()
  }

  getDefaultEffect(effectName: ShadowEffectType): Partial<IShadowProps> {
    let effect = {} as unknown
    switch (effectName) {
      case ShadowEffectType.shadow:
        (effect as IShadowEffect) = {
          x: 40,
          y: 40,
          radius: 18,
          spread: 0,
          opacity: 70
        }
        break
      case ShadowEffectType.projection:
      case ShadowEffectType.blur:
        (effect as IBlurEffect) = {
          radius: 50,
          spread: 0,
          opacity: 70
        }
        break
      case ShadowEffectType.frame:
        (effect as IFrameEffect) = {
          width: 50,
          opacity: 70
        }
        break
      case ShadowEffectType.halo:
        (effect as IHaloEffect) = {
          radius: 50,
          spread: 50,
          opacity: 70
        }
        break
      case ShadowEffectType.none:
        return {}
      default:
        return this.assertUnreachable(effectName)
    }
    return {
      [effectName]: effect,
      ...((() => {
        const { type } = layerUtils.getCurrConfig
        const { color } = (layerUtils.getCurrConfig as IImage).styles.shadow
        return type === LayerType.image && !color
      })() && { color: '#000000' })
    } as Partial<IShadowProps>
  }

  getKeysOf(effect: ShadowEffectType): Array<string> {
    return [
      ...Object.keys(
        this.getDefaultEffect(effect)[effect] as ShadowEffects)
    ]
  }

  assertUnreachable(_: never): never {
    throw new Error("Didn't expect to get here")
  }
}

export default new ImageShadowUtils()
