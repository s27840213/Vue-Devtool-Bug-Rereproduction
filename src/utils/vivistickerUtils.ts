import { IAsset } from '@/interfaces/module'
import store from '@/store'
import assetUtils from './assetUtils'
import groupUtils from './groupUtils'
import pageUtils from './pageUtils'
import stepsUtils from './stepsUtils'

class ViviStickerUtils {
  inDebugMode = false

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

  sendDoneLoading(width: number, height: number) {
    console.log(width, height)
    this.sendToIOS('DONE_LOADING', { width, height })
  }

  sendScreenshotUrl(query: string, action = 'copy') {
    this.sendToIOS('SCREENSHOT', { params: query, action })
    if (this.inDebugMode) {
      const url = `${window.location.origin}/screenshot/?${query}`
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

  setIsInCategory(tab: string, bool: boolean) {
    store.commit('vivisticker/SET_isInCategory', { tab, bool })
  }

  debugMode() {
    this.inDebugMode = true
  }

  startEditing(asset: IAsset) {
    console.log('start editing', asset)
    pageUtils.setPages([pageUtils.newPage({
      width: window.innerWidth,
      height: Math.round(window.innerWidth * 422 / 390),
      backgroundColor: '#F8F8F8'
    })])
    assetUtils.addAsset(asset).then(() => {
      stepsUtils.reset()
      store.commit('vivisticker/SET_isInEditor', true)
    })
  }

  endEditing() {
    groupUtils.deselect()
    pageUtils.setPages()
    store.commit('vivisticker/SET_isInEditor', false)
  }
}

export default new ViviStickerUtils()
