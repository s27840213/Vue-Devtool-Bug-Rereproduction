import { IAssetPhoto, IPhotoItem, isIAssetPhoto } from '@/interfaces/api'
import { CustomElementConfig } from '@/interfaces/editor'
import { ITextFill, ITextFillConfig } from '@/interfaces/format'
import { AllLayerTypes, IText } from '@/interfaces/layer'
import store from '@/store'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import textBgUtils, { Rect } from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import { find, omit } from 'lodash'
import { InjectionKey } from 'vue'

class TextFill {
  effects = {} as Record<string, Record<string, unknown>>
  constructor() {
    this.effects = this.getDefaultEffects()
  }

  getDefaultEffects() {
    const defaultOptions = {
      customImg: null,
      xOffset200: 0,
      yOffset200: 0,
      size: 100,
      opacity: 100,
      focus: false,
    } as const
    return {
      none: {
        customImg: null
      },
      'custom-fill-img': {
        ...defaultOptions
      },
      doodle1: {
        img: '',
        ...defaultOptions
      },
    }
  }

  getImg(effect: { img?: string, customImg?: IAssetPhoto | IPhotoItem | null }): IAssetPhoto | IPhotoItem | null {
    if (effect.img) {
      const myfileImgs = [{
        width: 3240,
        height: 1080,
        id: '230424180325123sYxIzL8o',
        assetIndex: 1481660,
        preview: { width: 3240, height: 128 },
        urls: {
          prev: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/prev',
          full: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/full',
          larg: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/larg',
          original: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/original',
          midd: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/midd',
          smal: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/smal',
          tiny: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/230424180325123sYxIzL8o/tiny'
        }
      }, {
        width: 3240,
        height: 1080,
        id: '2304241803251250gC6SnPO',
        assetIndex: 1481661,
        preview: { width: 3240, height: 128 },
        urls: {
          prev: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/prev',
          full: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/full',
          larg: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/larg',
          original: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/original',
          midd: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/midd',
          smal: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/smal',
          tiny: 'https://template.vivipic.com/admin/dXdnvk5YOA1yggbZAxwE/asset/image/2304241803251250gC6SnPO/tiny'
        }
      }] as IAssetPhoto[]
      return find(myfileImgs, ['id', effect.img]) ?? null
    }
    return effect.customImg ?? null
  }

  imgToSrc(img: IAssetPhoto | IPhotoItem | null): string {
    // const img = effect.img ?? effect.customImg
    if (!img) return ''
    return isIAssetPhoto(img)
      ? img.urls.original
      : imageUtils.getSrc({ type: 'unsplash', userId: '', assetId: img.id }, 1000)
  }

  calcTextFillVar(config: IText) {
    const textFill = config.styles.textFill as ITextFillConfig
    const img = this.getImg(textFill)
    const imgSrc = this.imgToSrc(img)
    if (!img) return {}
    const layerScale = config.styles.scale
    const divWidth = config.styles.width / layerScale
    const divHeight = config.styles.height / layerScale
    const widthRatio = img.width / divWidth
    const heightRatio = img.height / divHeight
    // If true and textFill.size is 100, that mean img width === layer width
    const scaleByWidth = widthRatio < heightRatio
    const imgRatio = textFill.size / 100 / (scaleByWidth ? widthRatio : heightRatio)
    const imgWidth = img.width * imgRatio
    const imgHeight = img.height * imgRatio
    return { divHeight, divWidth, imgHeight, imgWidth, scaleByWidth, imgSrc }
  }

  async convertTextEffect(config: IText): Promise<Record<string, string | number>[][]> {
    const { textFill, textShape } = config.styles
    if (textFill.name === 'none') return []

    const { divHeight, divWidth, imgHeight, imgWidth, scaleByWidth, imgSrc } = this.calcTextFillVar(config)
    if (!imgSrc) return []

    const myRect = new Rect()
    await myRect.init(config)
    myRect.preprocess({ skipMergeLine: true })
    const { vertical, rows } = myRect.get()
    const div = [] as DOMRect[][][]
    for (const [index, row] of rows.entries()) {
      if (row.spanData.length === 0) continue
      let { pIndex, sIndex } = row.spanData[0]
      // TextShape only have one line, fix its p/sIndex
      if (textShape.name !== 'none') [pIndex, sIndex] = [0, index]

      while (div.length - 1 < pIndex) div.push([])
      while (div[pIndex].length - 1 < sIndex) div[pIndex].push([])
      div[pIndex][sIndex].push(row.rect)
    }

    const spanExpandRatio = 1
    const isTextShape = config.styles.textShape.name !== 'none'
    const isTextShapeFocus = isTextShape && textFill.focus
    const isFixedWidth = textBgUtils.isFixedWidth(config.styles)
    return div.map(p => p.map(span => {
      const rect = span[0]
      let { width: spanWidth, height: spanHeight, x, y } = rect
      if (vertical) {
        [spanWidth, spanHeight] = [spanHeight, spanWidth];
        [x, y] = [y, x]
      }
      const bgSizeBy = textFill.size * (scaleByWidth ? divWidth / spanWidth : divHeight / spanHeight)
      return {
        // About span BG
        backgroundImage: `url("${imgSrc}")`,
        backgroundSize: scaleByWidth ? `${bgSizeBy}% auto` : `auto ${bgSizeBy}%`,
        // (img - div) * position%, calc like BG-pos %, but use div as container size and map -100~100 to 0~100%
        // https://developer.mozilla.org/en-US/docs/Web/CSS/background-position#regarding_percentages
        backgroundPosition: `
          ${(x + (imgWidth - divWidth) * (0.5 - textFill.xOffset200 / 200)) * -1}px
          ${(y + (imgHeight - divHeight) * (0.5 + textFill.yOffset200 / 200)) * -1}px`,
        backgroundOrigin: 'content-box',
        backgroundRepeat: 'no-repeat',
        webkitBackgroundClip: 'text',
        // To fix a Safari bug that the element border of BG text clip will appear abnormally,
        // make border of element to be transparent.
        maskImage: `url(${require('@/assets/img/svg/text-fill-mask-image.svg')})`,
        maskSize: '100% 100%',
        // About span color
        opacity: textFill.opacity / 100,
        webkitTextFillColor: 'transparent',
        webkitTextStrokeColor: 'transparent',
        textDecorationColor: 'transparent',
        // About span position
        position: 'absolute',
        padding: `${spanHeight * spanExpandRatio}px ${spanWidth * spanExpandRatio}px`,
        ...isTextShapeFocus ? {
          top: `${y - spanHeight * spanExpandRatio}px`,
          left: `${x - spanWidth * spanExpandRatio}px`,
          transform: 'none',
          lineHeight: 'initial',
        } : isTextShape ? {
          top: `${-spanHeight * spanExpandRatio}px`,
          lineHeight: 'initial',
        } : {
          top: `${y - spanHeight * spanExpandRatio}px`,
          left: `${x - spanWidth * spanExpandRatio}px`,
          ...!isFixedWidth ? { lineHeight: 'initial' } : {},
        }
      }
    }))
  }

  drawTextFill(config: IText): CustomElementConfig | null {
    const textFill = config.styles.textFill
    if (textFill.name === 'none' || !textFill.focus) return null

    const { divHeight, divWidth, imgHeight, imgWidth, scaleByWidth, imgSrc } = this.calcTextFillVar(config)
    if (!imgSrc) return null

    return {
      tag: 'img',
      attrs: { src: imgSrc },
      style: {
        [scaleByWidth ? 'width' : 'height']: `${textFill.size}%`,
        left: `${(imgWidth - divWidth) * (0.5 - textFill.xOffset200 / 200) * -1}px`,
        top: `${(imgHeight - divHeight) * (0.5 + textFill.yOffset200 / 200) * -1}px`,
        opacity: textFill.opacity / 200,
      }
    }
  }

  // Read/write text effect setting from local storage
  syncShareAttrs(textFill: ITextFill, effectName: string | null) {
    Object.assign(textFill, { name: textFill.name || effectName })
    if (textFill.name === 'none') return

    // const shareAttrs = (localStorageUtils.get('textEffectSetting', 'textFillShare') ?? {}) as Record<string, string>
    // const newShareAttrs = { opacity: textFill.opacity }
    // const newEffect = { opacity: shareAttrs.opacity }

    // If effectName is null, overwrite share attrs. Otherwise, read share attrs and set to effect.
    if (!effectName) {
      // Object.assign(shareAttrs, newShareAttrs)
      // localStorageUtils.set('textEffectSetting', 'textFillShare', shareAttrs)
    } else {
      let effect = (localStorageUtils.get('textEffectSetting', effectName) ?? {}) as Record<string, string>
      // Object.assign(effect, newEffect)
      effect = omit(effect, ['customImg'])
      localStorageUtils.set('textEffectSetting', effectName, effect)
    }
  }

  setTextFill(effect: string, attrs?: Record<string, unknown>) {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = (targetLayer.layers ? targetLayer.layers : [targetLayer]) as AllLayerTypes[]
    const subLayerIndex = layerUtils.subLayerIdx
    const defaultAttrs = this.effects[effect]

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue

      const layer = layers[idx]
      if (layer.type !== 'text') continue
      const oldTextFill = layer.styles.textFill
      const newTextFill = {} as ITextFill

      if (oldTextFill && oldTextFill.name === effect) { // Adjust effect option.
        Object.assign(newTextFill, oldTextFill, attrs)
        localStorageUtils.set('textEffectSetting', effect, newTextFill)
        // this.syncShareAttrs(textFill, null)
      } else { // Switch to other effect.
        this.syncShareAttrs(newTextFill, effect)
        const localAttrs = localStorageUtils.get('textEffectSetting', effect)
        Object.assign(newTextFill, defaultAttrs, localAttrs, attrs, { name: effect, customImg: oldTextFill.customImg })
      }

      store.commit('UPDATE_specLayerData', {
        pageIndex,
        layerIndex,
        subLayerIndex: +idx,
        styles: { textFill: newTextFill }
      })

      // If SplitedSpan setting changed, force split/unsplit span text
      const oldSplitedSpan = textBgUtils.isSplitedSpan({ ...layer.styles, textFill: oldTextFill })
      const newSplitedSpan = textBgUtils.isSplitedSpan({ ...layer.styles, textFill: newTextFill })
      textBgUtils.splitOrMergeSpan(oldSplitedSpan, newSplitedSpan, layer,
        pageIndex, layerIndex, targetLayer.layers ? +idx : subLayerIndex)
    }
  }

  async resetCurrTextEffect() {
    const effectName = textEffectUtils.getCurrentLayer().styles.textFill.name
    this.setTextFill(effectName, omit(this.effects[effectName], 'img'))
  }
}

export default new TextFill()
export const replaceImgInject: InjectionKey<(img: IPhotoItem | IAssetPhoto) => void> = Symbol('replaceImg')
