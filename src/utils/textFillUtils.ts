import textEffect, { IPutTextEffectResponse } from '@/apis/textEffect'
import i18n from '@/i18n'
import { IAssetPhoto, IPhotoItem, isIAssetPhoto } from '@/interfaces/api'
import { CustomElementConfig } from '@/interfaces/editor'
import { isITextFillCustom, ITextFill, ITextFillConfig } from '@/interfaces/format'
import { AllLayerTypes, IText } from '@/interfaces/layer'
import store from '@/store'
import constantData, { IEffect, IEffectOptionSelect } from '@/utils/constantData'
import generalUtils from '@/utils/generalUtils'
import imageUtils from '@/utils/imageUtils'
import layerUtils from '@/utils/layerUtils'
import localStorageUtils from '@/utils/localStorageUtils'
import textBgUtils, { Rect } from '@/utils/textBgUtils'
import textEffectUtils from '@/utils/textEffectUtils'
import { notify } from '@kyvg/vue3-notification'
import { AxiosResponse } from 'axios'
import { find, omit, pick } from 'lodash'
import { InjectionKey } from 'vue'

interface ITextFillPresetRawImg {
  assetIndex: number
  teamId: string
  id: string
  width: number
  height: number
}

export interface ITextFIllPreset {
  id: string
  param: {
    img: ITextFillPresetRawImg
    opacity: number
    size: number
    xOffset200: number
    yOffset200: number
  }
}

export interface ITextFillCategory {
  id: number
  list: ITextFIllPreset[]
  plan: 0 | 1
  title_jp: string
  title_tw: string
  title_us: string
}

class TextFill {
  normalFills = [] as ITextFillCategory[]
  adminFills = [] as ITextFIllPreset[]

  get fillCategories(): IEffect[] { // TextFill that from appJSON
    const isAdmin = store.getters['user/isAdmin']
    const fills = [
      ...isAdmin ? [{
        id: 0,
        list: this.adminFills,
        plan: 1 as const,
        title_jp: '管理員測試用',
        title_tw: '管理員測試用',
        title_us: '管理員測試用',
      }] : [],
      ...this.normalFills,
    ]

    return fills.map(fill => {
      const firstImg = fill.list[0]?.param.img
      return {
        key: `${fill.id}`,
        label: fill[`title_${i18n.global.locale}`],
        plan: fill.plan,
        img: firstImg ? `https://template.vivipic.com/admin/${firstImg.teamId}/asset/image/${firstImg.id}/tiny`
          : require('@/assets/img/svg/image-preview.svg') as string,
        options: [{
          type: 'select' as const,
          key: 'img',
          label: 'Image', // TODO: i18n
          select: fill.list.map(eff => ({
            key: eff.id,
            img: `https://template.vivipic.com/admin/${eff.param.img.teamId}/asset/image/${eff.param.img.id}/tiny`,
            label: '',
            attrs: {
              ...eff.param,
              img: {
                ...eff.param.img,
                preview: { width: eff.param.img.width, height: eff.param.img.height },
                urls: ['prev', 'full', 'larg', 'original', 'midd', 'smal', 'tiny'].reduce((acc, size) => ({
                  ...acc, [size]: `https://template.vivipic.com/admin/${eff.param.img.teamId}/asset/image/${eff.param.img.id}/${size}`
                }), {}),
                key: eff.id,
              },
            }
          }))
        }, ...constantData.toOptions(['xOffset200', 'yOffset200', 'size', 'opacity'])]
      }
    })
  }

  updateFillCategory(normalFills: ITextFillCategory[], adminFills: ITextFIllPreset[]) {
    this.normalFills = normalFills
    this.adminFills = adminFills
  }

  getDefaultEffects(effectName: string) {
    const defaultOptions = {
      xOffset200: 0,
      yOffset200: 0,
      size: 100,
      opacity: 100,
      focus: false,
    } as const

    if (effectName === 'custom-fill-img') return defaultOptions
    else return { customImg: null }
  }

  getImg(effect: { img?: IAssetPhoto, customImg?: IAssetPhoto | IPhotoItem | null }): IAssetPhoto | IPhotoItem | null {
    return effect.img ?? effect.customImg ?? null
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

  setTextFill(effect: string, attrs?: Record<string, unknown>, reset = false) {
    const { index: layerIndex, pageIndex } = store.getters.getCurrSelectedInfo
    const targetLayer = store.getters.getLayer(pageIndex, layerIndex)
    const layers = (targetLayer.layers ? targetLayer.layers : [targetLayer]) as AllLayerTypes[]
    const subLayerIndex = layerUtils.subLayerIdx
    const defaultAttrs = this.getDefaultEffects(effect)

    for (const idx in layers) {
      if (subLayerIndex !== -1 && +idx !== subLayerIndex) continue

      const layer = layers[idx]
      if (layer.type !== 'text') continue
      const oldTextFill = layer.styles.textFill
      const newTextFill = {} as ITextFill

      if (oldTextFill && oldTextFill.name === effect) { // Adjust effect option.
        const localAttrs = !reset && attrs && Object.keys(attrs).includes('img')
          ? localStorageUtils.get('textEffectSetting', `fill.${(attrs as {img: {key:string}}).img.key}`) : null
        Object.assign(newTextFill, oldTextFill, attrs, localAttrs)

        // Only TextFill from appJSON need to store to localstorage
        if (isITextFillCustom(newTextFill) && newTextFill.name !== '0' && newTextFill.img) {
          localStorageUtils.set('textEffectSetting', `fill.${newTextFill.img.key}`, omit(newTextFill, ['customImg', 'name']))
        }
      } else { // Switch to other effect.
        const targetEffect = find(this.fillCategories, ['key', effect])
        const effectDefaultPreset = (targetEffect?.options[0] as IEffectOptionSelect)?.select[0]?.attrs as {img: {key:string}} | undefined
        const localAttrs = effectDefaultPreset?.img?.key ? localStorageUtils.get('textEffectSetting', `fill.${effectDefaultPreset.img.key}`) : null
        Object.assign(newTextFill, defaultAttrs, effectDefaultPreset, localAttrs,
          { name: effect, customImg: oldTextFill.customImg }
        )
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
    const textFill = textEffectUtils.getCurrentLayer().styles.textFill
    const effectName = textFill.name
    if (effectName === 'none') return
    else if (effectName === 'custom-fill-img') {
      this.setTextFill(effectName, this.getDefaultEffects(effectName), true)
      return
    }
    const targetEffect = find(this.fillCategories, ['key', effectName])
    const targetFillImg = find((targetEffect?.options[0] as IEffectOptionSelect)?.select, ['key', textFill.img.key])
    const effectDefaultPreset = targetFillImg?.attrs
    this.setTextFill(effectName, effectDefaultPreset, true)
  }

  async uploadTextFill() {
    const currText = layerUtils.getCurrLayer
    if (currText.type !== 'text') {
      notify({ group: 'error', text: '當前layer並非text' })
      return
    }

    const fill = currText.styles.textFill
    if (fill.name === 'none') {
      notify({ group: 'error', text: '當前layer不含有文字填滿' })
      return
    }

    let res: AxiosResponse<IPutTextEffectResponse>
    const params = pick(fill, ['xOffset200', 'yOffset200', 'size', 'opacity'])

    if (fill.name === 'custom-fill-img') {
      if (!isIAssetPhoto(fill.customImg)) {
        notify({ group: 'error', text: '當前文字填滿沒有圖片，或是圖片不是來自管理員上傳。' })
        return
      }
      Object.assign(params, {
        img: {
          assetIndex: fill.customImg.assetIndex,
          teamId: store.getters['user/getUserId'],
          id: fill.customImg.id,
          width: fill.customImg.width,
          height: fill.customImg.height,
        } as ITextFillPresetRawImg
      })
      res = await textEffect.addTextFill(generalUtils.generateRandomString(20), params)
    } else {
      // const currFillCategory = find(this.fillCategory, ['name', fill.name])
      // if (!currFillCategory) {
      //   notify({ group: 'error', text: 'error' })
      //   return
      // }
      // const targetEffect = ''
      // Object.assign(params, { img:  })
      // res = await textEffect.updateTextFill(fillId, params)
      res = { data: { flag: 1, msg: '還沒實作' } } as any
    }

    if (res.data.flag) notify({ group: 'error', text: res.data.msg })
    else if (res.data.flag === 0) notify({ group: 'copy', text: '文字填滿上傳/更新成功。' })
  }
}

export default new TextFill()
export const replaceImgInject: InjectionKey<(img: IPhotoItem | IAssetPhoto) => void> = Symbol('replaceImg')
