import i18n from '@/i18n'
import { IImage, IShape } from '@/interfaces/layer'
import { IAssetObject } from '@/interfaces/shape'
import backgroundUtils from '@/utils/backgroundUtils'
import constantData from '@/utils/constantData'
import layerUtils from '@/utils/layerUtils'
import pageUtils from '@/utils/pageUtils'
import { cloneDeep, find } from 'lodash'

// Overlay data that store in design config file.
export interface IOverlay {
  id: string
  xOffset: number
  yOffset: number
  opacity: number
  config: IShape | null
}

// Data in app.json
export interface IApiOverlayPreset {
  id: string
  ofh: number
  ofv: number
  opa: number
  plan: number
  title_jp: string
  title_tw: string
  title_us: string
  type: number
  ver: number
}
export interface IApiOverlayCategory {
  id: number
  list: IApiOverlayPreset[]
  cover_url: string
  title_jp: string
  title_tw: string
  title_us: string
}

// For Overlay UI.
export interface IOverlayItem {
  id: string
  label: string
  svg: IAssetObject | null
  preset: {
    xOffset: number
    yOffset: number
    opacity: number
  } | null
}
export interface IOverlayCategory {
  id: number
  label: string
  baseImg: string
  items: IOverlayItem[]
}
export type IOverlayList = IOverlayCategory[]

const whiteImg = `data:image/svg+xml;utf8,
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="105" fill="white">
    <rect width="80" height="105"/>
  </svg>`

class Overlay {
  overlaysData = [] as IApiOverlayCategory[]

  get overlayCategories(): IOverlayList { // Overlay that from appJSON
    const overlays = [{
      id: 0,
      cover_url: whiteImg,
      title_jp: '',
      title_tw: '',
      title_us: '',
      list: [null]
    },
    ...this.overlaysData,
    ]

    return overlays.map(category => {
      return {
        id: category.id,
        label: category[`title_${constantData.localeWithFallback}`],
        baseImg: category.cover_url + (category.id !== 0 ? '/prev' : ''),
        items: category.list.map(item => {
          return item ? {
            id: item.id,
            label: item[`title_${constantData.localeWithFallback}`],
            svg: {
              id: item.id,
              plan: item.plan,
              type: item.type,
              ver: item.ver,
              fit: 0,
              tags: [] as string[],
            },
            preset: {
              xOffset: item.ofh,
              yOffset: item.ofv,
              opacity: item.opa,
            }
          } : {
            id: 'none',
            label: i18n.global.t('NN0111'),
            svg: null,
            preset: null,
          }
        })
      }
    })
  }

  updateOverlayCategory(normalOverlays: IApiOverlayCategory[]) {
    this.overlaysData = normalOverlays
  }

  getCurrOverlay(target: 'page' | 'layer') {
    const { subLayerIdx } = layerUtils
    const currLayer = layerUtils.getCurrLayer

    if (target === 'page') {
      return pageUtils.currFocusPage.backgroundImage.config.overlay
    } else if (currLayer.type === 'image') {
      return currLayer.overlay
    } else if (currLayer.type === 'group' || currLayer.type === 'tmp') {
      return ((subLayerIdx !== -1
        ? currLayer.layers[subLayerIdx]
        : find(currLayer.layers, ['type', 'image'])) as IImage).overlay
    } else {
      return {
        id: 'none',
        xOffset: 0,
        yOffset: 0,
        opacity: 100,
        config: null,
      }
    }
  }

  applyOverlay(target: 'page' | 'layer', options: Partial<IOverlay>) {
    const { pageIndex, layerIndex, subLayerIdx } = layerUtils
    const currLayer = layerUtils.getCurrLayer
    const overlay = cloneDeep(this.getCurrOverlay(target))
    Object.assign(overlay, options)

    if (target === 'page') {
      backgroundUtils.setBgImage({ pageIndex, config: { overlay } })
    } else if (currLayer.type === 'image' || subLayerIdx !== -1) {
      // For single image layer and groun sub image layer.
      layerUtils.updateSpecLayerData({
        pageIndex,
        layerIndex,
        subLayerIndex: subLayerIdx,
        props: { overlay }
      })
    } else if (currLayer.type === 'group' || currLayer.type === 'tmp') {
      // For multiple img layers in group/tmp.
      for (const i in currLayer.layers) {
        if (currLayer.layers[+i].type !== 'image') continue
        layerUtils.updateSpecLayerData({
          pageIndex,
          layerIndex,
          subLayerIndex: +i,
          props: { overlay }
        })
      }
    }
  }
}

export default new Overlay()
