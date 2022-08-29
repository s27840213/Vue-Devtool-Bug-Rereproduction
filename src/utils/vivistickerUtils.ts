import { IAsset } from '@/interfaces/module'
import { IPage } from '@/interfaces/page'
import store from '@/store'
import assetUtils from './assetUtils'
import groupUtils from './groupUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'
import uploadUtils from './uploadUtils'
import eventUtils, { PanelEvent } from './eventUtils'
import { ColorEventType } from '@/store/types'

class ViviStickerUtils {
  inDebugMode = false
  loadingFlags = {}

  sendToIOS(messageType: string, message: any) {
    try {
      const webkit = (window as any).webkit
      if (!webkit) {
        throw new Error('WebKit is not available!')
      }
      const messageHandler = webkit.messageHandlers[messageType]
      if (!messageHandler) {
        throw new Error(`message type: ${messageType} does not exist!`)
      }
      messageHandler.postMessage(message)
    } catch (error) {
      console.log(error)
    }
  }

  sendDoneLoading(width: number, height: number, options: string) {
    console.log(width, height, options)
    this.sendToIOS('DONE_LOADING', { width, height, options })
  }

  sendScreenshotUrl(query: string, action = 'copy') {
    this.sendToIOS('SCREENSHOT', { params: query, action })
    if (this.inDebugMode) {
      const url = `${window.location.origin}/screenshot/?${query}`
      console.log(url)
      window.open(url, '_blank')
    }
  }

  createUrl(item: IAsset): string {
    console.log(item)
    switch (item.type) {
      case 5:
      case 11:
        return `type=svg&id=${item.id}&ver=${item.ver}`
      case 1:
        return `type=background&id=${item.id}&ver=${item.ver}`
      default:
        return ''
    }
  }

  createUrlForJSON(): string {
    const page = pageUtils.getPage(0)
    return `type=json&id=${encodeURIComponent(JSON.stringify(uploadUtils.getSinglePageJson(page)))}`
  }

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', { tab, bool })
  }

  debugMode() {
    this.inDebugMode = true
  }

  startEditing(asset: IAsset) {
    console.log('start editing', asset)
    const pageWidth = window.innerWidth - 32
    pageUtils.setPages([pageUtils.newPage({
      width: pageWidth,
      height: Math.round(pageWidth * 420 / 358),
      backgroundColor: '#F8F8F8'
    })])
    assetUtils.addAsset(asset).then((jsonData?: any) => {
      if (jsonData) {
        stepsUtils.reset()
        store.commit('vivisticker/SET_isInEditor', true)
        if ([5, 11].includes(asset.type)) {
          if (jsonData.color && jsonData.color.length > 0) {
            eventUtils.emit(PanelEvent.switchTab, 'color', { currColorEvent: ColorEventType.shape })
          } else {
            eventUtils.emit(PanelEvent.switchTab, 'opacity')
          }
        }
      }
    })
  }

  endEditing() {
    groupUtils.deselect()
    pageUtils.setPages()
    store.commit('vivisticker/SET_isInEditor', false)
  }

  initLoadingFlags(page: IPage) {
    this.loadingFlags = {}
  }
}

export default new ViviStickerUtils()
