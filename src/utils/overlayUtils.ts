import i18n from '@/i18n'
import { IAssetObject } from '@/interfaces/shape'

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
        label: category[`title_${i18n.global.locale}`],
        baseImg: category.cover_url + (category.id !== 0 ? '/prev' : ''),
        items: category.list.map(item => {
          return item ? {
            id: item.id,
            label: item[`title_${i18n.global.locale}`],
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
}

export default new Overlay()
